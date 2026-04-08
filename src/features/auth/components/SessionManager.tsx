'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { refreshToken as refreshAccessToken } from '../api';
import {
    clearAuthSession,
    getStoredAccessTokenExpiry,
    getStoredRefreshToken,
    persistAuthSession,
} from '../session';

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

        if (!refreshToken || !expiresAt) {
            return false;
        }

        const timeRemaining = expiresAt - Date.now();
        if (!force && timeRemaining > REFRESH_THRESHOLD_MS) {
            return false;
        }

        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }

        const refreshTask = refreshAccessToken({ refreshToken })
            .then((session) => {
                persistAuthSession(session);
                return true;
            })
            .catch(() => {
                forceLogout();
                return false;
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
        if (!refreshToken || !expiresAt) {
            return;
        }

        const timeRemaining = expiresAt - Date.now();
        if (timeRemaining <= 0) {
            forceLogout();
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
        if (!refreshToken || !expiresAt) {
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
