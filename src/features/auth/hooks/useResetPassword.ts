'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '../api';
import { ApiError } from '../types';

interface UseResetPasswordReturn {
    handleSubmit: (newPassword: string, confirmPassword: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
}

export function useResetPassword(token: string): UseResetPasswordReturn {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (newPassword: string, confirmPassword: string) => {
        if (!token) return;
        setError(null);
        setIsLoading(true);
        try {
            await resetPassword({ token, newPassword, confirmPassword });
            setIsSuccess(true);
            setTimeout(() => router.push('/login'), 2000);
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

    return { handleSubmit, isLoading, error, isSuccess };
}
