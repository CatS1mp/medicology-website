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
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white px-6 py-8">
                        <h1 className="text-2xl font-extrabold text-gray-900">Route bai kiem tra da san sang</h1>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                            FE da co route cho attempt detail, nhung luong bat dau bai kiem tra van con phu thuoc endpoint discovery
                            theo `section/lesson` o assessment service. Muc nay duoc giu de dam bao lien ket route khong bi hong trong
                            giai doan tich hop.
                        </p>
                        <Link href="/dashboard" className="mt-6 inline-flex text-sm font-semibold text-[#2aa4e8] hover:text-[#1d8bcb]">
                            Quay lai dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
