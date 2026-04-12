import type { AuthResponse, AuthSessionPayload } from '@/features/auth/types';

export function unwrapSpringBody(body: unknown): unknown {
    if (typeof body === 'object' && body !== null && 'data' in body && ('code' in body || 'message' in body)) {
        return (body as { data: unknown }).data;
    }
    return body;
}

export function isAuthResponse(value: unknown): value is AuthResponse {
    if (typeof value !== 'object' || value === null) return false;
    const o = value as Record<string, unknown>;
    return typeof o.accessToken === 'string' && typeof o.refreshToken === 'string' && o.expiresIn != null;
}

export function isAuthSessionPayload(value: unknown): value is AuthSessionPayload {
    if (typeof value !== 'object' || value === null) return false;
    const o = value as Record<string, unknown>;
    if (o.expiresIn == null) return false;
    if (typeof o.userProfile !== 'object' || o.userProfile === null) return false;
    const up = o.userProfile as Record<string, unknown>;
    return typeof up.userId === 'string';
}

export function stripAuthTokensFromResponse(body: unknown): unknown {
    if (typeof body !== 'object' || body === null) return body;
    const b = body as Record<string, unknown>;
    if ('data' in b && typeof b.data === 'object' && b.data !== null) {
        const data = { ...(b.data as Record<string, unknown>) };
        delete data.accessToken;
        delete data.refreshToken;
        return { ...b, data };
    }
    const copy = { ...b };
    delete copy.accessToken;
    delete copy.refreshToken;
    return copy;
}
