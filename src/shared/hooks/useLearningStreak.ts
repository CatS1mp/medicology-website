'use client';

import { useEffect, useState } from 'react';
import { pingStreak } from '@/shared/api/learning';

export function useLearningStreak() {
    const [streakDays, setStreakDays] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            setIsLoading(true);
            try {
                const data = await pingStreak();
                if (!cancelled) setStreakDays(data.currentStreak);
            } catch {
                if (!cancelled) setStreakDays(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, []);

    return { streakDays, isLoading };
}
