'use client';

import { useEffect } from 'react';
import { pingStreak } from '@/shared/api/learning';
import { useUserStore } from '@/shared/store/useUserStore';

const STREAK_LAST_SYNC_DATE_KEY = 'learningStreakLastSyncDate';
const STREAK_UPDATED_EVENT = 'learning-streak-updated';
const STREAK_ATTEMPT_SYNC_PREFIX = 'learningStreakAttemptSynced:';

function getLocalStorageItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setLocalStorageItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable in private/restricted browser modes.
    }
}

function removeLocalStorageItem(key: string) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Storage can be unavailable in private/restricted browser modes.
    }
}

function todayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function readCurrentStreakDays(): number | null {
    return useUserStore.getState().streakDays;
}

function markStreakSyncedToday() {
    setLocalStorageItem(STREAK_LAST_SYNC_DATE_KEY, todayKey());
}

function hasSyncedStreakToday(): boolean {
    return getLocalStorageItem(STREAK_LAST_SYNC_DATE_KEY) === todayKey();
}

export function clearLearningStreakCache() {
    removeLocalStorageItem(STREAK_LAST_SYNC_DATE_KEY);
}

export async function syncLearningStreakOnFirstCompletionToday() {
    if (typeof window === 'undefined') return readCurrentStreakDays();

    if (hasSyncedStreakToday()) {
        const cached = readCurrentStreakDays();
        if (cached !== null) {
            useUserStore.getState().recordStreakSync(cached);
        }
        return cached;
    }

    const previousStreakDays = useUserStore.getState().streakDays;
    const data = await pingStreak();
    markStreakSyncedToday();
    useUserStore.getState().recordStreakSync(data.currentStreak, previousStreakDays);
    window.dispatchEvent(new Event(STREAK_UPDATED_EVENT));
    return data.currentStreak;
}

export async function syncLearningStreakForCompletedAttempt(attemptId: string) {
    if (typeof window === 'undefined') return readCurrentStreakDays();

    const attemptSyncKey = `${STREAK_ATTEMPT_SYNC_PREFIX}${attemptId}`;
    if (getLocalStorageItem(attemptSyncKey) === todayKey()) {
        return readCurrentStreakDays();
    }

    const previousStreakDays = useUserStore.getState().streakDays;
    const data = await pingStreak();
    markStreakSyncedToday();
    setLocalStorageItem(attemptSyncKey, todayKey());

    const previousForAnimation = previousStreakDays ?? (data.currentStreak > 0 ? data.currentStreak - 1 : null);
    useUserStore.getState().recordStreakSync(data.currentStreak, previousForAnimation, {
        source: 'learning-completion',
    });

    window.dispatchEvent(new Event(STREAK_UPDATED_EVENT));
    return data.currentStreak;
}

export function useLearningStreak() {
    const storeStreakDays = useUserStore((state) => state.streakDays);
    const isUserDataLoading = useUserStore((state) => state.isLoading);
    const hasUserDataLoaded = useUserStore((state) => state.hasLoaded);
    const loadUserData = useUserStore((state) => state.loadUserData);

    useEffect(() => {
        if (isUserDataLoading) {
            return;
        }

        if (!hasUserDataLoaded || storeStreakDays === null) {
            void loadUserData().catch(() => undefined);
        }
    }, [hasUserDataLoaded, isUserDataLoading, loadUserData, storeStreakDays]);

    return {
        streakDays: storeStreakDays,
        isLoading: isUserDataLoading || !hasUserDataLoaded,
    };
}
