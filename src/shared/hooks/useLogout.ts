'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthSession } from '@/features/auth/session';
import { useUserStore } from '@/shared/store/useUserStore';
import { enrolledCoursesCache } from '@/features/courses/hooks/useEnrolledCourses';
import { roadmapCache } from '@/features/courses/hooks/useRoadmap';

interface UseLogoutReturn {
    handleLogout: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

export function useLogout(): UseLogoutReturn {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogout = async () => {
        if (isLoading) return;

        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                setError(`ERR_${res.status}`);
            }
        } catch {
            setError('ERR_NETWORK');
        } finally {
            // Clear all in-memory caches so the next user gets fresh data
            enrolledCoursesCache.clear();
            roadmapCache.clear();
            clearAuthSession();
            useUserStore.getState().clearUserData();
            router.replace('/login');
            router.refresh();
            setIsLoading(false);
        }
    };

    return { handleLogout, isLoading, error, clearError: () => setError(null) };
}
