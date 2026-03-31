'use client';

import { useState, useCallback } from 'react';
import { getProgress, pingStreak } from '../api';
import { UserCourse, UserDailyStreak, LearningApiError } from '../types';

export function useProgress() {
    const [progress, setProgress] = useState<UserCourse[]>([]);
    const [streak, setStreak] = useState<UserDailyStreak | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProgress = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getProgress();
            setProgress(data);
        } catch (err) {
            if (err instanceof LearningApiError) {
                setError(`ERR_${err.status}`);
            } else {
                setError('ERR_NETWORK');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateStreak = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await pingStreak();
            setStreak(data);
        } catch (err) {
            if (err instanceof LearningApiError) {
                setError(`ERR_${err.status}`);
            } else {
                setError('ERR_NETWORK');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { 
        progress, 
        streak, 
        fetchProgress, 
        updateStreak, 
        isLoading, 
        error 
    };
}
