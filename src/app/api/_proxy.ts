import { NextRequest, NextResponse } from 'next/server';

interface ProxyConfig {
    backendUrl: string;
    upstreamBasePath: string;
}

function buildTargetUrl(req: NextRequest, pathSegments: string[], config: ProxyConfig) {
    const pathname = pathSegments.join('/');
    const suffix = pathname ? `/${pathname}` : '';
    const search = req.nextUrl.search ?? '';
    return `${config.backendUrl}${config.upstreamBasePath}${suffix}${search}`;
}

export async function proxyToBackend(
    req: NextRequest,
    params: { path?: string[] },
    config: ProxyConfig
) {
    const targetUrl = buildTargetUrl(req, params.path ?? [], config);
    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    const authorization = req.headers.get('authorization');

    if (contentType) headers.set('content-type', contentType);
    if (authorization) headers.set('authorization', authorization);

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? await req.text() : undefined;

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
        console.error('Proxy error:', error);
        return NextResponse.json({ message: 'Internal Server Error (Proxy)' }, { status: 500 });
    }
}
