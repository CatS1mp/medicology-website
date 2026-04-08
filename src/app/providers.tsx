'use client';

import { SessionManager } from '@/features/auth/components/SessionManager';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SessionManager />
            {children}
        </>
    );
}
