import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AuthVerifyClient } from '@/app/auth/verify/ui';

export const metadata: Metadata = {
    title: 'Verify Email - Medicology',
    description: 'Verify your Medicology email address',
};

export default function AuthVerifyPage() {
    return (
        <Suspense>
            <AuthVerifyClient />
        </Suspense>
    );
}

