'use client';

import React from 'react';
import Image from 'next/image';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';

export function LessonCompletionLoadingScreen({
    streakDays,
    progress,
    onLogout,
}: {
    streakDays: number;
    progress: number;
    onLogout: () => void;
}) {
    const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

    return (
        <div className="flex h-screen overflow-hidden bg-white font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays} onLogout={onLogout} />
                <div className="flex-1 overflow-hidden px-6 py-8">
                    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
                        <div className="relative mb-6 flex h-[clamp(18rem,18vw,34rem)] w-[clamp(18rem,18vw,34rem)] items-center justify-center rounded-full bg-[#EAF7EF]">
                            <Image
                                src="/images/Mascot/24.svg"
                                alt="Medicology mascot"
                                width={768}
                                height={768}
                                priority
                                className="h-[clamp(32rem,34vw,64rem)] w-[clamp(32rem,34vw,64rem)] max-w-none object-contain"
                            />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
                            Đang hoàn tất bài tập
                        </p>
                        <h1 className="mt-3 text-2xl font-extrabold text-gray-900">
                            Hệ thống đang ghi nhận kết quả của bạn
                        </h1>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                            Giữ nguyên màn hình trong giây lát để cập nhật tiến độ khóa học.
                        </p>

                        <div className="mt-8 w-full max-w-md">
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500">
                                <span>Tiến trình</span>
                                <span className="text-emerald-600">{safeProgress}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${safeProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
