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

import { useToast } from '@/shared/contexts/ToastContext';

export function useSignup(): UseSignupReturn {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (data: RegisterRequest) => {
        setError(null);
        setIsLoading(true);
        try {
            const res = await register(data);
            showToast('Đăng ký thành công! Vui lòng kiểm tra email.', 'success');
            sessionStorage.setItem('pendingVerifyEmail', res.email);
            router.push('/verify-email');
        } catch (err) {
            if (err instanceof ApiError) {
                // If it's a 400, it's usually a validation error with a specific message
                const msg = err.status === 400 ? err.body.message : `ERR_${err.status}`;
                setError(msg);
                showToast(err.body.message || 'Đã xảy ra lỗi khi đăng ký', 'error');
            } else {
                setError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { handleSignup, isLoading, error, clearError: () => setError(null) };
}
