'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        setError(null);
        setIsLoading(true);

        const accessToken = localStorage.getItem('accessToken') ?? undefined;
        const refreshToken = localStorage.getItem('refreshToken') ?? undefined;

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

            const res = await fetch('/api/auth/logout', {
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
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userProfile');
            router.push('/login');
            setIsLoading(false);
        }
    };

    return { handleLogout, isLoading, error, clearError: () => setError(null) };
}
