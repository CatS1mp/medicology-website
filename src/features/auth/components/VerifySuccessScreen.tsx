'use client';

import React, { useEffect } from 'react';
import { AuthLayout } from './AuthLayout';

export const VerifySuccessScreen: React.FC = () => {
    useEffect(() => {
        const channel = new BroadcastChannel('email-verification');
        channel.postMessage('verified');
        channel.close();
    }, []);

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
            </div>
        </AuthLayout>
    );
};