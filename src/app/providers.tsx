'use client';

import { ToastProvider } from '@/shared/contexts/ToastContext';

import { SessionManager } from '@/features/auth/components/SessionManager';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <SessionManager />
            {children}
        </ToastProvider>
    );
}
