'use client';

import { isAuthSessionPayload, unwrapSpringBody } from '@/lib/auth-response';
import type { AuthSessionPayload } from './types';
import { getStoredRefreshToken, persistAuthSession } from './session';

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
            if (!getStoredRefreshToken()) {
                return false;
            }

            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!res.ok) {
                return false;
            }

            const raw: unknown = await res.json();
            const data = unwrapSpringBody(raw);
            if (!isAuthSessionPayload(data)) {
                return false;
            }

            const payload: AuthSessionPayload = {
                tokenType: typeof data.tokenType === 'string' ? data.tokenType : 'Bearer',
                expiresIn: typeof data.expiresIn === 'number' ? data.expiresIn : Number(data.expiresIn),
                userProfile: data.userProfile,
            };

            persistAuthSession(payload);
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
