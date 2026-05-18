'use client';

import { ToastProvider } from '@/shared/contexts/ToastContext';

import { SessionManager } from '@/features/auth/components/SessionManager';
import { ClickSound } from '@/shared/components/ClickSound';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <SessionManager />
            <ClickSound />
            {children}
        </ToastProvider>
    );
}
