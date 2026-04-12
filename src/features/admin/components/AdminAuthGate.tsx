'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/api';

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [state, setState] = React.useState<'loading' | 'ok' | 'denied'>('loading');

    React.useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const user = await getCurrentUser();
                if (cancelled) return;
                if (!user.admin) {
                    setState('denied');
                    router.replace('/dashboard');
                    return;
                }
                setState('ok');
            } catch {
                if (!cancelled) {
                    setState('denied');
                    router.replace('/login');
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [router]);

    if (state === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white text-gray-500">
                Đang kiểm tra quyền...
            </div>
        );
    }

    if (state === 'denied') {
        return null;
    }

    return <>{children}</>;
}
