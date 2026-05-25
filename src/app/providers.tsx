'use client';

import { ToastProvider } from '@/shared/contexts/ToastContext';

import { SessionManager } from '@/features/auth/components/SessionManager';
import { ClickSound } from '@/shared/components/ClickSound';
import { BrokenStreakCard } from '@/shared/components/BrokenStreakCard';
import { SuccessHoldingStreakCard } from '@/shared/components/SuccessHoldingStreakCard';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <SessionManager />
            <ClickSound />
            <BrokenStreakCard />
            <SuccessHoldingStreakCard />
            {children}
        </ToastProvider>
    );
}
