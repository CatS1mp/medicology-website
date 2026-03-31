'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '../api';
import { ApiError, RegisterRequest } from '../types';

interface UseSignupReturn {
    handleSignup: (data: RegisterRequest) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

export function useSignup(): UseSignupReturn {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (data: RegisterRequest) => {
        setError(null);
        setIsLoading(true);
        try {
            const res = await register(data);
            sessionStorage.setItem('pendingVerifyEmail', res.email);
            router.push('/verify-email');
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

    return { handleSignup, isLoading, error, clearError: () => setError(null) };
}
