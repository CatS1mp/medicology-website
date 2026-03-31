'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../api';
import { ApiError, LoginRequest } from '../types';

interface UseLoginReturn {
    handleLogin: (data: LoginRequest) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

export function useLogin(): UseLoginReturn {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (data: LoginRequest) => {
        setError(null);
        setIsLoading(true);
        try {
            const res = await login(data);
            localStorage.setItem('accessToken', res.accessToken);
            localStorage.setItem('refreshToken', res.refreshToken);
            router.push('/dashboard');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`ERR_${err.status}`);
            } else {
                setError('ERR_NETWORK');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { handleLogin, isLoading, error, clearError: () => setError(null) };
}
