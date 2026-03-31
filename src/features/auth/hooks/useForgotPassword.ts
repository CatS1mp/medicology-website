'use client';

import { useState } from 'react';
import { requestPasswordReset } from '../api';
import { ApiError } from '../types';

interface UseForgotPasswordReturn {
    handleSubmit: (email: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    isSent: boolean;
}

export function useForgotPassword(): UseForgotPasswordReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (email: string) => {
        setError(null);
        setIsLoading(true);
        try {
            await requestPasswordReset(email);
            setIsSent(true);
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

    return { handleSubmit, isLoading, error, isSent };
}
