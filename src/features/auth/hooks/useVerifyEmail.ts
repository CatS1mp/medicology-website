'use client';

import { useState } from 'react';
import { requestEmailToken } from '../api';
import { ApiError } from '../types';

interface UseVerifyEmailReturn {
    handleResend: () => Promise<void>;
    isResending: boolean;
    resendError: string | null;
    isResendSuccess: boolean;
}

export function useVerifyEmail(): UseVerifyEmailReturn {
    const [isResending, setIsResending] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);
    const [isResendSuccess, setIsResendSuccess] = useState(false);

    const handleResend = async () => {
        const email = sessionStorage.getItem('pendingVerifyEmail');
        if (!email) return;

        setResendError(null);
        setIsResendSuccess(false);
        setIsResending(true);
        try {
            await requestEmailToken(email);
            setIsResendSuccess(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setResendError(`ERR_${err.status}`);
            } else {
                setResendError('ERR_NETWORK');
            }
        } finally {
            setIsResending(false);
        }
    };

    return { handleResend, isResending, resendError, isResendSuccess };
}
