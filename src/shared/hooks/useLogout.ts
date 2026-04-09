'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthSession } from '@/features/auth/session';

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

        const accessToken = localStorage.getItem('accessToken') ?? undefined;
        const refreshToken = localStorage.getItem('refreshToken') ?? undefined;

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

            const baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || '';
            const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
                method: 'POST',
                headers,
                body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
            });

            if (!res.ok) {
                setError(`ERR_${res.status}`);
            }
        } catch {
            setError('ERR_NETWORK');
        } finally {
            clearAuthSession();
            router.replace('/login');
            router.refresh();
            setIsLoading(false);
        }
    };

    return { handleLogout, isLoading, error, clearError: () => setError(null) };
}
