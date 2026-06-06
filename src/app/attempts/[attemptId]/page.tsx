'use client';

import Link from 'next/link';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';

export default function AttemptPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f7f8fa] font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={0} />
                <div className="flex-1 overflow-y-auto px-6 py-8 flex items-center justify-center">
                    <div className="mx-auto max-w-md text-center space-y-4">
                        <div className="text-6xl">📋</div>
                        <h1 className="text-2xl font-extrabold text-gray-900">Tính năng đang phát triển</h1>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Chi tiết bài kiểm tra sẽ sớm được cập nhật. Hãy quay lại sau nhé!
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block mt-4 px-6 py-2 rounded-full bg-[#2aa4e8] text-white text-sm font-semibold hover:bg-[#1d8bcb] transition-colors"
                        >
                            Quay lại Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
