'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    clearAuthSession,
    getStoredAccessTokenExpiry,
    getStoredRefreshToken,
} from '../session';
import { refreshAccessTokenWithMutex } from '../token-refresh';
import { clearAllClientCaches } from '@/shared/cache/client-cache-reset';
import { useUserStore } from '@/shared/store/useUserStore';

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

function isAuthPage(pathname: string) {
    return pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';
}

function todayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function msUntilNextLocalDay(): number {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    nextDay.setHours(0, 0, 1, 0);
    return Math.max(nextDay.getTime() - now.getTime(), 1000);
}

export function SessionManager() {
    const router = useRouter();
    const pathname = usePathname();
    const timerRef = React.useRef<number | null>(null);
    const dailyStreakTimerRef = React.useRef<number | null>(null);
    const lastStreakCheckDateRef = React.useRef<string | null>(null);
    const refreshPromiseRef = React.useRef<Promise<boolean> | null>(null);

    const forceLogout = React.useCallback(() => {
        clearAuthSession();
        clearAllClientCaches();
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

    const syncUserDataForCurrentDay = React.useCallback((force = false) => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!getStoredRefreshToken()) {
            return;
        }

        const today = todayKey();
        if (!force && lastStreakCheckDateRef.current === today) {
            return;
        }

        useUserStore.getState().loadUserData()
            .then(() => {
                const { streakDays } = useUserStore.getState();
                if (streakDays !== null) {
                    lastStreakCheckDateRef.current = today;
                }
            })
            .catch(console.error);
    }, []);

    const scheduleDailyStreakSync = React.useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (dailyStreakTimerRef.current) {
            window.clearTimeout(dailyStreakTimerRef.current);
            dailyStreakTimerRef.current = null;
        }

        if (!getStoredRefreshToken()) {
            return;
        }

        const scheduleNext = () => {
            dailyStreakTimerRef.current = window.setTimeout(() => {
                syncUserDataForCurrentDay(true);
                scheduleNext();
            }, msUntilNextLocalDay());
        };

        scheduleNext();
    }, [syncUserDataForCurrentDay]);

    const redirectToDashboardIfAuthenticated = React.useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
            const { hasLoaded, streakDays, loadUserData } = useUserStore.getState();
            if (!hasLoaded || streakDays === null) {
                loadUserData().catch(console.error);
            }
        }
        syncUserDataForCurrentDay();

        if (!isAuthPage(pathname)) {
            return;
        }

        if (!refreshToken) {
            return;
        }

        router.replace('/dashboard');
    }, [pathname, router, syncUserDataForCurrentDay]);

    React.useEffect(() => {
        void syncSessionState();
        redirectToDashboardIfAuthenticated();
        scheduleRefresh();
        scheduleDailyStreakSync();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void syncSessionState();
                syncUserDataForCurrentDay();
            }
            scheduleRefresh();
            scheduleDailyStreakSync();
        };

        const handleFocus = () => {
            void syncSessionState();
            syncUserDataForCurrentDay();
            scheduleRefresh();
            scheduleDailyStreakSync();
        };

        const handleSessionUpdated = () => {
            redirectToDashboardIfAuthenticated();
            scheduleRefresh();
            scheduleDailyStreakSync();
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
            if (dailyStreakTimerRef.current) {
                window.clearTimeout(dailyStreakTimerRef.current);
            }
        };
    }, [redirectToDashboardIfAuthenticated, scheduleDailyStreakSync, scheduleRefresh, syncSessionState, syncUserDataForCurrentDay]);

    return null;
}
