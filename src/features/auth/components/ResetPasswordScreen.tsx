'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { AuthLayout } from './AuthLayout';
import { useResetPassword } from '../hooks/useResetPassword';
import { PASSWORD_RULES, allPasswordRulesPass } from '../utils/passwordRules';

const ERROR_MESSAGES: Record<string, string> = {
    ERR_400: 'Token không hợp lệ hoặc đã hết hạn.',
    ERR_NETWORK: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
};

export const ResetPasswordScreen: React.FC = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const { handleSubmit, isLoading, error, isSuccess } = useResetPassword(token);

    const allRulesPass = allPasswordRulesPass(newPassword);
    const passwordsMatch = newPassword === confirmPassword;
    const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Đã xảy ra lỗi. Vui lòng thử lại.') : null;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allRulesPass || !passwordsMatch) return;
        await handleSubmit(newPassword, confirmPassword);
    };

    if (!token) {
        return (
            <AuthLayout topRightText="Đăng nhập" topRightHref="/login">
                <div className="w-full max-w-sm mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Liên kết không hợp lệ</h1>
                    <p className="text-gray-500 text-sm">Token đặt lại mật khẩu bị thiếu. Vui lòng yêu cầu lại.</p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout topRightText="Đăng nhập" topRightHref="/login">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Đặt lại mật khẩu</h1>
                    <p className="text-sm text-gray-500 mt-1">Nhập mật khẩu mới của bạn bên dưới.</p>
                </div>

                {isSuccess ? (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-6 py-4 text-green-700 text-sm font-medium text-center">
                        ✓ Mật khẩu đã được đặt lại thành công. Đang chuyển hướng đến trang đăng nhập...
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-1">
                            <Input
                                type="password"
                                placeholder="Mật khẩu mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <ul className="mt-3 mb-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] px-1 text-left">
                                {PASSWORD_RULES.map((rule) => {
                                    const isValid = rule.validate(newPassword);
                                    return (
                                        <li key={rule.id} className={`flex items-center space-x-2 ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
                                            <span className="flex-shrink-0">
                                                {isValid ? (
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                        <circle cx="10" cy="10" r="4" />
                                                    </svg>
                                                )}
                                            </span>
                                            <span>{rule.text}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <Input
                                type="password"
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-xs text-red-500 px-1 text-left mt-1">Mật khẩu xác nhận không khớp</p>
                            )}
                        </div>

                        {errorMessage && (
                            <p className="text-sm text-red-500 px-1">{errorMessage}</p>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            disabled={isLoading || !allRulesPass || !passwordsMatch}
                            className="mt-4 text-[14px] font-bold py-3 uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                        </Button>
                    </form>
                )}
            </div>
        </AuthLayout>
    );
};
