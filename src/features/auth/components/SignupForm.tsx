'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export const SignupForm: React.FC = () => {
    const router = useRouter();
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const passwordRules = [
        { id: 'length', text: 'Tối thiểu 8 ký tự', validate: (p: string) => p.length >= 8 },
        { id: 'uppercase', text: 'Ít nhất 1 chữ hoa', validate: (p: string) => /[A-Z]/.test(p) },
        { id: 'lowercase', text: 'Ít nhất 1 chữ thường', validate: (p: string) => /[a-z]/.test(p) },
        { id: 'number', text: 'Ít nhất 1 số', validate: (p: string) => /[0-9]/.test(p) },
        { id: 'special', text: 'Ít nhất 1 ký tự đặc biệt', validate: (p: string) => /[^A-Za-z0-9]/.test(p) },
    ];

    const getRequirementsClasses = () => {
        return 'mt-3 mb-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] px-1 text-left';
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Tạo tài khoản mới</h1>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <Input
                    type="text"
                    placeholder="Tên (không bắt buộc)"
                />

                <Input
                    type="email"
                    placeholder="Email"
                />

                <div className="space-y-1">
                    <Input
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <ul className={getRequirementsClasses()}>
                        {passwordRules.map((rule) => {
                            const isValid = rule.validate(password);
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
                        placeholder="Xác nhận mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500 px-1 text-left mt-1">Mật khẩu xác nhận không khớp</p>
                    )}
                </div>

                <Button
                    type="button"
                    fullWidth
                    className="mt-4 text-[14px] font-bold py-3 uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                        e.preventDefault();
                        // Simulate backend success and open the verify success link in new tab
                        window.open('/verify-success', '_blank');
                        // Redirect current tab to waiting page
                        router.push('/verify-email');
                    }}
                >
                    Tạo tài khoản (Test Skip)
                </Button>
            </form>

            <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-xs font-bold text-gray-400">HOẶC</span>
                <div className="flex-1 border-t border-gray-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="text-[#3b5998] border-gray-200 py-3 uppercase tracking-wider text-[13px] shadow-[0_2px_0_0_#e5e7eb] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#e5e7eb] active:translate-y-[2px] active:shadow-none">
                    <span className="font-bold text-lg mr-1 text-[#3b5998]">f</span> Facebook
                </Button>
                <Button variant="outline" className="text-gray-600 border-gray-200 py-3 uppercase tracking-wider text-[13px] shadow-[0_2px_0_0_#e5e7eb] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#e5e7eb] active:translate-y-[2px] active:shadow-none font-bold">
                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </Button>
            </div>

            <div className="mt-8 text-center px-4">
                <p className="text-[13px] font-medium text-gray-400 leading-relaxed mb-4">
                    Bằng việc đăng ký Medicology, bạn đồng ý với <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Điều khoản</a> và <br />
                    <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Chính sách bảo mật</a> của chúng tôi.
                </p>
                <p className="text-[11px] font-medium text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                    Trang web này được bảo vệ bởi reCAPTCHA Enterprise, <br />
                    áp dụng <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Chính sách bảo mật</a> và <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Điều khoản dịch vụ</a> của Google.
                </p>
            </div>
        </div>
    );
};
