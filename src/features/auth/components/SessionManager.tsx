'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    clearAuthSession,
    getStoredAccessTokenExpiry,
    getStoredRefreshToken,
} from '../session';
import { refreshAccessTokenWithMutex } from '../token-refresh';

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

function isAuthPage(pathname: string) {
    return pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';
}

export function SessionManager() {
    const router = useRouter();
    const pathname = usePathname();
    const timerRef = React.useRef<number | null>(null);
    const refreshPromiseRef = React.useRef<Promise<boolean> | null>(null);

    const forceLogout = React.useCallback(() => {
        clearAuthSession();
        if (!isAuthPage(pathname)) {
            router.replace('/login');
            router.refresh();
        }
    }, [pathname, router]);

    const refreshSessionIfNeeded = React.useCallback(async (force = false) => {
        if (typeof window === 'undefined') {
            return false;
        }

        const refreshToken = getStoredRefreshToken();
        const expiresAt = getStoredAccessTokenExpiry();

        if (!refreshToken) {
            return false;
        }

        if (!force && expiresAt != null) {
            const timeRemaining = expiresAt - Date.now();
            if (timeRemaining > REFRESH_THRESHOLD_MS) {
                return false;
            }
        }

        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }

        const refreshTask = refreshAccessTokenWithMutex()
            .then((ok) => {
                if (!ok) {
                    forceLogout();
                }
                return ok;
            })
            .finally(() => {
                refreshPromiseRef.current = null;
            });

        refreshPromiseRef.current = refreshTask;
        return refreshTask;
    }, [forceLogout]);

    const syncSessionState = React.useCallback(async () => {
        if (typeof window === 'undefined') {
            return;
        }

        const refreshToken = getStoredRefreshToken();
        const expiresAt = getStoredAccessTokenExpiry();
        if (!refreshToken) {
            return;
        }

        const timeRemaining = expiresAt != null ? expiresAt - Date.now() : -1;
        if (timeRemaining <= 0) {
            const ok = await refreshSessionIfNeeded(true);
            if (!ok) {
                forceLogout();
            }
            return;
        }

        if (document.visibilityState === 'visible' && timeRemaining <= REFRESH_THRESHOLD_MS) {
            await refreshSessionIfNeeded(true);
        }
    }, [forceLogout, refreshSessionIfNeeded]);

    const scheduleRefresh = React.useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (document.visibilityState !== 'visible') {
            return;
        }

        const refreshToken = getStoredRefreshToken();
        const expiresAt = getStoredAccessTokenExpiry();
        if (!refreshToken || expiresAt == null) {
            return;
        }

        const delay = Math.max(expiresAt - Date.now() - REFRESH_THRESHOLD_MS, 0);
        timerRef.current = window.setTimeout(() => {
            void refreshSessionIfNeeded(true);
        }, delay);
    }, [refreshSessionIfNeeded]);

    React.useEffect(() => {
        void syncSessionState();
        scheduleRefresh();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void syncSessionState();
            }
            scheduleRefresh();
        };

        const handleFocus = () => {
            void syncSessionState();
            scheduleRefresh();
        };

        const handleSessionUpdated = () => {
            scheduleRefresh();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('auth-session-updated', handleSessionUpdated);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('auth-session-updated', handleSessionUpdated);
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [scheduleRefresh, syncSessionState]);

    return null;
}
