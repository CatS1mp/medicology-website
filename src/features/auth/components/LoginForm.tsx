'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useLogin } from '../hooks/useLogin';
import { OAuthButtons } from './OAuthButtons';

export const LoginForm: React.FC = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const { handleLogin, isLoading, error } = useLogin();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleLogin({ email, password });
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Đăng nhập</h1>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    error={!!error}
                />

                <Input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    error={!!error}
                    rightElement={
                        <Link href="/forgot-password" className="text-xs font-bold text-gray-400 hover:text-gray-600 tracking-wider uppercase">
                            Quên?
                        </Link>
                    }
                />


                <Button
                    type="submit"
                    fullWidth
                    disabled={isLoading}
                    className="mt-4 text-[14px] font-bold py-3 uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
            </form>

            <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-xs font-bold text-gray-400">HOẶC</span>
                <div className="flex-1 border-t border-gray-200"></div>
            </div>

            <OAuthButtons />

            <div className="mt-8 text-center px-4">
                <p className="text-[13px] font-medium text-gray-400 leading-relaxed mb-4">
                    Bằng cách đăng nhập vào Medicology, bạn đồng ý với <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Điều khoản</a> và{' '}
                    <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Chính sách Quyền riêng tư</a> của chúng tôi.
                </p>
                <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
                    Trang web này được bảo vệ bởi reCAPTCHA Enterprise và áp dụng{' '}
                    <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Chính sách Quyền riêng tư</a> cũng như <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Điều khoản Dịch vụ</a> của Google.
                </p>
            </div>
        </div>
    );
};
