'use client';

import { hasRefreshSession } from '@/features/auth/session';

export interface SpringApiResponse<T> {
    code?: number;
    message?: string;
    data: T;
}

export interface ParsedErrorBody {
    status: number;
    message: string;
    timestamp?: string;
    body?: unknown;
}

export class ApiTransportError extends Error {
    public readonly status: number;
    public readonly timestamp?: string;
    public readonly body?: unknown;

    constructor(body: ParsedErrorBody) {
        super(body.message);
        this.name = 'ApiTransportError';
        this.status = body.status;
        this.timestamp = body.timestamp;
        this.body = body.body;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export function getStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return null;
}

export function buildHeaders(options?: {
    accessToken?: string;
    includeJsonContentType?: boolean;
    headers?: HeadersInit;
}): HeadersInit {
    const accessToken = options?.accessToken ?? getStoredAccessToken() ?? undefined;
    const headers = new Headers(options?.headers);

    if (options?.includeJsonContentType !== false && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return headers;
}

export function unwrapSpringData<T>(body: unknown): T {
    if (isRecord(body) && 'data' in body && ('code' in body || 'message' in body)) {
        return body.data as T;
    }
    return body as T;
}

async function readResponseBody(res: Response): Promise<unknown> {
    if (res.status === 204) return null;

    const text = await res.text();
    if (!text) return null;

    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
}

export async function parseSuccessResponse<T>(
    res: Response,
    options?: { unwrapData?: boolean }
): Promise<T> {
    const body = await readResponseBody(res);

    if (body === null) {
        return undefined as T;
    }

    if (typeof body === 'string') {
        return body as T;
    }

    return (options?.unwrapData === false ? body : unwrapSpringData<T>(body)) as T;
}

export async function parseErrorResponse(res: Response): Promise<ApiTransportError> {
    const body = await readResponseBody(res);

    if (isRecord(body)) {
        const message =
            typeof body.message === 'string'
                ? body.message
                : typeof body.error === 'string'
                    ? body.error
                    : res.statusText || 'Yêu cầu thất bại';
        const status =
            typeof body.status === 'number'
                ? body.status
                : typeof body.code === 'number'
                    ? body.code
                    : res.status;
        const timestamp = typeof body.timestamp === 'string' ? body.timestamp : undefined;
        return new ApiTransportError({ status, message, timestamp, body });
    }

    if (typeof body === 'string') {
        const isHtml = body.trim().startsWith('<!DOCTYPE') || body.trim().startsWith('<html');
        const message = isHtml ? (res.statusText || 'Giao tiếp với máy chủ thất bại') : (body || res.statusText || 'Yêu cầu thất bại');
        
        return new ApiTransportError({
            status: res.status,
            message,
            body,
        });
    }

    return new ApiTransportError({
        status: res.status,
        message: res.statusText || 'Yêu cầu thất bại',
        body,
    });
}

function shouldAttemptAuthRefresh(requestUrl: string): boolean {
    const publicEndpoints = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/refresh',
        '/api/oauth/oauth',
    ];
    return !publicEndpoints.some((p) => requestUrl.includes(p));
}

function shouldRedirectToLoginAfterSessionFailure(): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    if (
        path.startsWith('/login') ||
        path.startsWith('/signup') ||
        path.startsWith('/forgot-password') ||
        path.startsWith('/reset-password') ||
        path.startsWith('/auth/verify')
    ) {
        return false;
    }
    return true;
}

export async function requestApi<T>(
    input: string,
    init?: RequestInit,
    options?: { unwrapData?: boolean }
): Promise<T> {
    const res = await fetch(input, {
        ...init,
        credentials: init?.credentials ?? 'include',
    });
    if (res.ok) {
        return parseSuccessResponse<T>(res, options);
    }

    const shouldHandleAuthRefresh = res.status === 401;
    if (
        shouldHandleAuthRefresh &&
        typeof window !== 'undefined' &&
        shouldAttemptAuthRefresh(input) &&
        hasRefreshSession()
    ) {
        const { refreshAccessTokenWithMutex } = await import('@/features/auth/token-refresh');
        let lastRes = res;
        const refreshed = await refreshAccessTokenWithMutex();
        if (refreshed) {
            const res2 = await fetch(input, {
                ...init,
                credentials: init?.credentials ?? 'include',
                headers: buildHeaders({ headers: init?.headers }),
            });
            lastRes = res2;
            if (res2.ok) {
                return parseSuccessResponse<T>(res2, options);
            }
        }
        const { clearAuthSession } = await import('@/features/auth/session');
        clearAuthSession();
        if (shouldRedirectToLoginAfterSessionFailure()) {
            window.location.replace('/login');
        }
        throw await parseErrorResponse(lastRes);
    }

    throw await parseErrorResponse(res);
}
