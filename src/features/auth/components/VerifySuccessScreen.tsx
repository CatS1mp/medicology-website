'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { AuthLayout } from './AuthLayout';

export const VerifySuccessScreen: React.FC = () => {
    const router = useRouter();

    const handleContinue = () => {
        // Broadcast the success message
        const channel = new BroadcastChannel('email-verification');
        channel.postMessage('verified');
        channel.close();
    };

    return (
        <AuthLayout topRightText="Đăng nhập" topRightHref="/login">
            <div className="w-full max-w-sm mx-auto text-center">
                <div className="mb-8">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Xác thực thành công!</h1>
                    <p className="text-base font-medium text-gray-600 mb-2">
                        Cảm ơn bạn đã chọn đồng hành cùng chúng tôi
                    </p>
                    <p className="text-sm text-gray-500">
                        Tài khoản của bạn đã được kích hoạt. Bạn hiện có thể sử dụng đầy đủ các tính năng của Medicology.
                    </p>
                </div>

                <div className="mt-8">
                    <Button 
                        onClick={handleContinue} 
                        fullWidth
                        className="text-[14px] font-bold py-3 uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none"
                    >
                        Bắt đầu khám phá
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
};
