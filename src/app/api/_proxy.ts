import { NextRequest, NextResponse } from 'next/server';
import { AUTH_ACCESS_COOKIE } from '@/lib/auth-cookies';

interface ProxyConfig {
    backendUrl: string;
    upstreamBasePath: string;
}

/**
 * URL của API gateway. Khi cấu hình, mọi proxy của Next.js sẽ đi qua gateway,
 * gateway lo việc rewrite path + chọn service đích.
 *
 * Khi không cấu hình, hệ thống fall back về cấu hình cũ (Next.js gọi thẳng service).
 */
export const API_GATEWAY_URL = (process.env.API_GATEWAY_URL ?? '').trim();

interface GatewayProxyConfig {
    /** Prefix gateway nhận, ví dụ `/api/assessment`. Giữ nguyên khi forward qua gateway. */
    gatewayBasePath: string;
    /** Cấu hình fallback khi `API_GATEWAY_URL` chưa được đặt. */
    legacy: ProxyConfig;
}

/**
 * Helper duy nhất các route Next.js BFF nên gọi. Tự chọn gateway hoặc fallback service trực tiếp.
 */
export function proxyThroughGateway(
    req: NextRequest,
    params: { path?: string[] },
    config: GatewayProxyConfig
) {
    if (API_GATEWAY_URL) {
        return proxyToBackend(req, params, {
            backendUrl: API_GATEWAY_URL,
            upstreamBasePath: config.gatewayBasePath,
        });
    }
    return proxyToBackend(req, params, config.legacy);
}

const PUBLIC_AUTH_PATH_PREFIXES = new Set([
    'login',
    'register',
    'refresh',
    'verify',
    'resend',
    'reset',
    'logout',
]);

function isPublicAuthProxyPath(segments: string[], upstreamBasePath: string): boolean {
    if (!upstreamBasePath.endsWith('/auth')) return false;
    const first = segments[0];
    return typeof first === 'string' && PUBLIC_AUTH_PATH_PREFIXES.has(first);
}

function validatePathSegments(segments: string[]): boolean {
    if (segments.length > 12) return false;
    return segments.every((seg) => {
        if (!seg) return true;
        return !seg.includes('..') && !seg.includes('//');
    });
}

/** Ensures fetch() receives an absolute URL (env often omits https://). */
function normalizeBackendBaseUrl(raw: string): string {
    const t = raw.trim();
    if (!t) return '';
    const withoutTrailingSlash = t.replace(/\/+$/, '');
    if (/^https?:\/\//i.test(withoutTrailingSlash)) {
        return withoutTrailingSlash;
    }
    return `https://${withoutTrailingSlash.replace(/^\/+/, '')}`;
}

function buildTargetUrl(req: NextRequest, pathSegments: string[], config: ProxyConfig) {
    const pathname = pathSegments.join('/');
    const suffix = pathname ? `/${pathname}` : '';
    const search = req.nextUrl.search ?? '';
    return `${config.backendUrl}${config.upstreamBasePath}${suffix}${search}`;
}

function logProxyError(error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('Proxy error:', message);
}

export async function proxyToBackend(
    req: NextRequest,
    params: { path?: string[] },
    config: ProxyConfig
) {
    const backend = normalizeBackendBaseUrl(config.backendUrl ?? '');
    if (!backend) {
        return NextResponse.json({ message: 'Dịch vụ nền chưa được cấu hình.' }, { status: 503 });
    }

    const segments = params.path ?? [];
    if (!validatePathSegments(segments)) {
        return NextResponse.json({ message: 'Đường dẫn không hợp lệ' }, { status: 400 });
    }

    const targetUrl = buildTargetUrl(req, segments, { ...config, backendUrl: backend });
    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    const authHeader = req.headers.get('authorization');
    const cookieAccess = req.cookies.get(AUTH_ACCESS_COOKIE)?.value;

    if (contentType) headers.set('content-type', contentType);
    const skipAuthForwarding = isPublicAuthProxyPath(segments, config.upstreamBasePath);
    if (!skipAuthForwarding) {
        if (authHeader) {
            headers.set('authorization', authHeader);
        } else if (cookieAccess) {
            headers.set('authorization', `Bearer ${cookieAccess}`);
        }
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? await req.arrayBuffer() : undefined;

    try {
        const res = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
        });

        const responseContentType = res.headers.get('content-type') ?? '';
        if (responseContentType.includes('application/json')) {
            const json = await res.json();
            return NextResponse.json(json, { status: res.status });
        }

        const text = await res.text();
        return new NextResponse(text, {
            status: res.status,
            headers: {
                'content-type': responseContentType || 'text/plain; charset=utf-8',
            },
        });
    } catch (error) {
        logProxyError(error);
        return NextResponse.json({ message: 'Lỗi máy chủ nội bộ (proxy)' }, { status: 500 });
    }
}
