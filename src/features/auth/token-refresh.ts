'use client';

import type { AuthResponse } from './types';
import { getStoredRefreshToken, persistAuthSession } from './session';

function unwrapSpringBody(body: unknown): unknown {
    if (typeof body === 'object' && body !== null && 'data' in body && ('code' in body || 'message' in body)) {
        return (body as { data: unknown }).data;
    }
    return body;
}

function isAuthResponse(value: unknown): value is AuthResponse {
    if (typeof value !== 'object' || value === null) return false;
    const o = value as Record<string, unknown>;
    return typeof o.accessToken === 'string' && typeof o.refreshToken === 'string' && o.expiresIn != null;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Calls `/api/auth/refresh` with stored refresh token (rotation).
 * Serialized so concurrent 401s do not run parallel refresh storms.
 */
export function refreshAccessTokenWithMutex(): Promise<boolean> {
    if (typeof window === 'undefined') {
        return Promise.resolve(false);
    }
    if (refreshInFlight) {
        return refreshInFlight;
    }

    const task = (async () => {
        try {
            const refreshToken = getStoredRefreshToken();
            if (!refreshToken) {
                return false;
            }

            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!res.ok) {
                return false;
            }

            const raw = await res.json();
            const data = unwrapSpringBody(raw);
            if (!isAuthResponse(data)) {
                return false;
            }

            persistAuthSession({
                ...data,
                tokenType: typeof data.tokenType === 'string' ? data.tokenType : 'Bearer',
                expiresIn: typeof data.expiresIn === 'number' ? data.expiresIn : Number(data.expiresIn),
            });
            return true;
        } catch {
            return false;
        }
    })();

    refreshInFlight = task;
    void task.finally(() => {
        if (refreshInFlight === task) {
            refreshInFlight = null;
        }
    });
    return task;
}
