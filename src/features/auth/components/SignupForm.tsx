'use client';

import React from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useSignup } from '../hooks/useSignup';
import { PASSWORD_RULES, allPasswordRulesPass } from '../utils/passwordRules';
import { OAuthButtons } from './OAuthButtons';

export const SignupForm: React.FC = () => {
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const { handleSignup, isLoading, error } = useSignup();

    const allRulesPass = allPasswordRulesPass(password);
    const passedRulesCount = PASSWORD_RULES.filter(r => r.validate(password)).length;
    const passwordsMatch = password === confirmPassword;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allRulesPass || !passwordsMatch) return;
        await handleSignup({ username, email, password, confirmPassword });
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Tạo tài khoản mới</h1>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
                <Input
                    type="text"
                    placeholder="Tên người dùng"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    error={!!error}
                />

                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    error={!!error}
                />

                <div className="space-y-1">
                    <Input
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        error={!!error}
                    />

                    <div className="mt-3 mb-4">
                        <div className="flex w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                            <div 
                                className={`h-full transition-all duration-300 ${allRulesPass ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${(passedRulesCount / Math.max(PASSWORD_RULES.length, 1)) * 100}%` }}
                            />
                        </div>

                        <ul className="flex flex-col space-y-1.5 text-[12.5px] px-1 text-left">
                            {PASSWORD_RULES.map((rule) => {
                                const isValid = rule.validate(password);
                                return (
                                    <li key={rule.id} className="flex items-center space-x-2 text-gray-600">
                                        <span className="flex-shrink-0">
                                            {isValid ? (
                                                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <circle cx="12" cy="12" r="10" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className={isValid ? "text-gray-800 font-medium" : ""}>{rule.text}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <div className="space-y-1">
                    <Input
                        type="password"
                        placeholder="Xác nhận mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        error={!!error || (!!confirmPassword && !passwordsMatch)}
                    />
                    {confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-500 px-1 text-left mt-1">Mật khẩu xác nhận không khớp</p>
                    )}
                </div>


                <Button
                    type="submit"
                    fullWidth
                    disabled={isLoading || !allRulesPass || !passwordsMatch}
                    className="mt-4 text-[14px] font-bold py-3 uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
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
                    Bằng cách đăng ký Medicology, bạn đồng ý với <a href="#" className="font-bold text-gray-600 hover:text-gray-800">Điều khoản</a> và{' '}
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
