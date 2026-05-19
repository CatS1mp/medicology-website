'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/api';
import { RouteLoadingSkeleton } from '@/shared/components/RouteLoadingSkeleton';

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
        return <RouteLoadingSkeleton />;
    }

    if (state === 'denied') {
        return null;
    }

    return <>{children}</>;
}
