'use client';

import { useCallback, useEffect, useState } from 'react';
import { pingStreak } from '@/shared/api/learning';

const STREAK_CACHE_KEY = 'learningStreakDays';
const STREAK_LAST_SYNC_DATE_KEY = 'learningStreakLastSyncDate';
const STREAK_UPDATED_EVENT = 'learning-streak-updated';

function todayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function readCachedStreakDays(): number | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STREAK_CACHE_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

function writeCachedStreakDays(value: number) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STREAK_CACHE_KEY, String(value));
}

function markStreakSyncedToday() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STREAK_LAST_SYNC_DATE_KEY, todayKey());
}

function hasSyncedStreakToday(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STREAK_LAST_SYNC_DATE_KEY) === todayKey();
}

export async function syncLearningStreakOnFirstCompletionToday() {
    if (typeof window === 'undefined') return readCachedStreakDays();

    if (hasSyncedStreakToday()) {
        return readCachedStreakDays();
    }

    const data = await pingStreak();
    writeCachedStreakDays(data.currentStreak);
    markStreakSyncedToday();
    window.dispatchEvent(new Event(STREAK_UPDATED_EVENT));
    return data.currentStreak;
}

export function useLearningStreak() {
    const [streakDays, setStreakDays] = useState<number | null>(() => readCachedStreakDays());
    const refreshFromCache = useCallback(() => {
        setStreakDays(readCachedStreakDays());
    }, []);

    useEffect(() => {
        const handleStreakUpdated = () => {
            refreshFromCache();
        };
        window.addEventListener(STREAK_UPDATED_EVENT, handleStreakUpdated);
        return () => {
            window.removeEventListener(STREAK_UPDATED_EVENT, handleStreakUpdated);
        };
    }, [refreshFromCache]);

    return { streakDays, isLoading: false };
}