'use client';

import { useState } from 'react';
import { resend } from '../api';
import { ApiError } from '../types';

interface UseVerifyEmailReturn {
    handleResend: () => Promise<void>;
    isResending: boolean;
    resendError: string | null;
    isResendSuccess: boolean;
}

import { useToast } from '@/shared/contexts/ToastContext';

export function useVerifyEmail(): UseVerifyEmailReturn {
    const { showToast } = useToast();
    const [isResending, setIsResending] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);
    const [isResendSuccess, setIsResendSuccess] = useState(false);

    const handleResend = async () => {
        const email = sessionStorage.getItem('pendingVerifyEmail');
        if (!email) {
            showToast('Không tìm thấy email cần xác thực', 'error');
            return;
        }

        setResendError(null);
        setIsResendSuccess(false);
        setIsResending(true);
        try {
            await resend(email);
            setIsResendSuccess(true);
            showToast('Email xác thực đã được gửi lại!', 'success');
        } catch (err) {
            if (err instanceof ApiError) {
                const msg = [400, 403].includes(err.status) ? err.body.message : `ERR_${err.status}`;
                setResendError(msg);
                showToast(err.body.message || 'Gửi lại email thất bại', 'error');
            } else {
                setResendError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsResending(false);
        }
    };

    return { handleResend, isResending, resendError, isResendSuccess };
}
