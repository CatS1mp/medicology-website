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

import { useToast } from '@/shared/contexts/ToastContext';

export function useResetPassword(token: string): UseResetPasswordReturn {
    const router = useRouter();
    const { showToast } = useToast();
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
            showToast('Đặt lại mật khẩu thành công!', 'success');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err) {
            if (err instanceof ApiError) {
                const msg = [400, 403].includes(err.status) ? err.body.message : `ERR_${err.status}`;
                setError(msg);
                showToast(err.body.message || 'Đặt lại mật khẩu thất bại', 'error');
            } else {
                setError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { handleSubmit, isLoading, error, isSuccess };
}
