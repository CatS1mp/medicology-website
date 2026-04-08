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

import { useToast } from '@/shared/contexts/ToastContext';

export function useForgotPassword(): UseForgotPasswordReturn {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (email: string) => {
        setError(null);
        setIsLoading(true);
        try {
            await requestPasswordReset(email);
            setIsSent(true);
            showToast('Yêu cầu đặt lại mật khẩu đã được gửi!', 'success');
        } catch (err) {
            if (err instanceof ApiError) {
                const msg = [400, 403].includes(err.status) ? err.body.message : `ERR_${err.status}`;
                setError(msg);
                showToast(err.body.message || 'Yêu cầu thất bại', 'error');
            } else {
                setError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { handleSubmit, isLoading, error, isSent };
}
