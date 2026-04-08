'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, resendVerificationEmail } from '../api';
import { ApiError, LoginRequest } from '../types';
import { persistAuthSession } from '../session';
import { useToast } from '@/shared/contexts/ToastContext';

interface UseLoginReturn {
    handleLogin: (data: LoginRequest) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

export function useLogin(): UseLoginReturn {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (data: LoginRequest) => {
        setError(null);
        setIsLoading(true);
        try {
            const res = await login(data);
            persistAuthSession(res);
            showToast('Đăng nhập thành công!', 'success');
            router.push('/dashboard');
        } catch (err) {
            if (err instanceof ApiError) {
                // Handle unverified user (usually 403 or specific error message)
                const isUnverified = err.status === 403 && (
                    err.message.toLowerCase().includes('verify') || 
                    err.message.toLowerCase().includes('xác thực')
                );

                if (isUnverified) {
                    sessionStorage.setItem('pendingVerifyEmail', data.email);
                    // Automatically trigger resend
                    void resendVerificationEmail(data.email).catch(console.error);
                    showToast('Tài khoản chưa xác thực. Một email mới đã được gửi!', 'info');
                    router.push('/verify-email');
                    return;
                }

                const msg = [400, 403].includes(err.status) ? err.body.message : `ERR_${err.status}`;
                setError(msg);
                showToast(err.body.message || 'Đăng nhập thất bại', 'error');
            } else {
                setError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { handleLogin, isLoading, error, clearError: () => setError(null) };
}
