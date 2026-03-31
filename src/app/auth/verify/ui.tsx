'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

const SpinnerIcon = () => (
    <svg className="animate-spin w-12 h-12 mb-5" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="5" r="4" fill="#3B82F6" />
        <circle cx="39.14" cy="10.86" r="4" fill="#60A5FA" opacity="0.8" />
        <circle cx="45" cy="25" r="4" fill="#93C5FD" opacity="0.6" />
        <circle cx="39.14" cy="39.14" r="4" fill="#BFDBFE" opacity="0.4" />
        <circle cx="25" cy="45" r="4" fill="#E0E7FF" />
        <circle cx="10.86" cy="39.14" r="4" fill="#EEF2FF" />
        <circle cx="5" cy="25" r="4" fill="#EEF2FF" />
        <circle cx="10.86" cy="10.86" r="4" fill="#EEF2FF" />
    </svg>
);

import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { verifyEmail } from '@/features/auth/api';
import { ApiError } from '@/features/auth/types';

const VERIFY_ERROR_MESSAGES: Record<string, string> = {
    ERR_400: 'Token xác thực không hợp lệ hoặc đã hết hạn.',
    ERR_404: 'Không tìm thấy tài khoản liên kết với token này.',
    ERR_NETWORK: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
};

export function AuthVerifyClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [errorCode, setErrorCode] = useState<string>('');

    const lastVerifyAtRef = useRef<number>(0);
    const lastVerifyTokenRef = useRef<string>('');

    useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!token) {
                router.replace('/');
                return;
            }

            // Rate limit verification calls (helps avoid double-calls in dev StrictMode)
            const now = Date.now();
            if (lastVerifyTokenRef.current === token && now - lastVerifyAtRef.current < 200) {
                return;
            }
            lastVerifyTokenRef.current = token;
            lastVerifyAtRef.current = now;

            setStatus('verifying');
            try {
                await verifyEmail(token);
                if (cancelled) return;
                setStatus('success');
                router.replace('/verify-success');
            } catch (err) {
                if (cancelled) return;
                setStatus('error');
                if (err instanceof ApiError) {
                    setErrorCode(`ERR_${err.status}`);
                } else {
                    setErrorCode('ERR_NETWORK');
                }
            }
        }

        void run();

        return () => {
            cancelled = true;
        };
    }, [router, token]);

    if (status === 'error') {
        const displayError = VERIFY_ERROR_MESSAGES[errorCode] ?? 'Không thể xác thực email. Vui lòng thử lại.';
        return (
            <AuthLayout topRightText="Đăng nhập" topRightHref="/login">
                <div className="w-full max-w-sm mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thất bại</h1>
                    <p className="text-sm text-gray-500">{displayError}</p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout topRightText="Đăng nhập" topRightHref="/login">
            <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center text-center mt-4">
                <SpinnerIcon />
                <h1 className="text-[22px] font-bold text-gray-800 mb-2">Đang xác thực...</h1>
                <p className="text-[13px] font-medium text-gray-500 max-w-[320px] mx-auto leading-relaxed mb-6">
                    Vui lòng đợi trong giây lát, chúng tôi đang kiểm tra thông tin tài khoản của bạn.
                </p>
                <div className="relative w-full max-w-[358px] aspect-[358/544] mt-2">
                    <Image 
                        src="/images/Mascot/27.svg" 
                        alt="Đang xác thực Mascot" 
                        fill 
                        className="object-contain" 
                        priority 
                    />
                </div>
            </div>
        </AuthLayout>
    );
}
