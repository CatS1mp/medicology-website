'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { AuthLayout } from './AuthLayout';
import { useVerifyEmail } from '../hooks/useVerifyEmail';

const ERROR_MESSAGES: Record<string, string> = {
    ERR_404: 'Không tìm thấy tài khoản. Vui lòng đăng ký lại.',
    ERR_NETWORK: 'Không thể gửi lại email. Vui lòng thử lại.',
};

export const VerifyEmailScreen: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(120);
    const router = useRouter();
    const { handleResend, isResending, resendError, isResendSuccess } = useVerifyEmail();

    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timeLeft]);

    useEffect(() => {
        const channel = new BroadcastChannel('email-verification');
        channel.onmessage = (event) => {
            if (event.data === 'verified') {
                router.push('/dashboard');
            }
        };
        return () => channel.close();
    }, [router]);

    const onResend = async () => {
        await handleResend();
        if (!resendError) {
            setTimeLeft(120);
        }
    };

    const errorMessage = resendError ? (ERROR_MESSAGES[resendError] ?? 'Không thể gửi lại email. Vui lòng thử lại.') : null;

    return (
        <AuthLayout topRightText="Đăng nhập" topRightHref="/login">
            <div className="w-full max-w-sm mx-auto text-center">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Chờ xác thực email</h1>
                    <p className="text-sm text-gray-500">
                        Vui lòng kiểm tra hộp thư đến của bạn và nhấp vào liên kết để xác thực tài khoản.
                    </p>
                </div>

                {isResendSuccess && (
                    <p className="text-sm text-green-600 mb-4">✓ Email xác thực đã được gửi lại.</p>
                )}
                {errorMessage && (
                    <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
                )}

                <div className="mt-8">
                    <Button
                        onClick={onResend}
                        disabled={timeLeft > 0 || isResending}
                        fullWidth
                        className="text-[14px] font-bold py-3 uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResending
                            ? 'Đang gửi...'
                            : timeLeft > 0
                                ? `Gửi lại email (${timeLeft}s)`
                                : 'Gửi lại email'}
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
};
