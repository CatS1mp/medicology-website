'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export const ForgotPasswordScreen: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Top Header */}
            <header className="w-full bg-[#3b71ca] py-4 px-8 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center text-white font-extrabold text-xl tracking-wide uppercase">
                    <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    MEDICOLOGY
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-6">
                    <div className="text-white text-[11px] font-bold uppercase tracking-wider flex items-center cursor-pointer">
                        Site Language: English
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <div className="flex space-x-3">
                        <Link href="/login" tabIndex={-1} className="px-6 py-2.5 rounded-full bg-white text-[#3b71ca] font-bold text-xs tracking-widest hover:bg-gray-50 uppercase transition-colors select-none focus:outline-none inline-block">
                            Login
                        </Link>
                        <Link href="/signup" tabIndex={-1} className="px-6 py-2.5 rounded-full bg-[#5cb8ff] text-white font-bold text-xs tracking-widest hover:bg-[#4aa8ff] uppercase transition-colors select-none focus:outline-none inline-block">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-sm text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-3">Forgot password</h1>
                    <p className="text-gray-600 font-medium text-[15px] leading-relaxed mb-8">
                        We will send you instructions on how to<br />
                        reset your password by email.
                    </p>

                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <Input
                            type="email"
                            placeholder="Email"
                        />
                        <Button type="submit" fullWidth className="mt-4 text-[15px] py-3 uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none">
                            Submit
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
};
