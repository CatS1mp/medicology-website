import { VerifyEmailScreen } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Verify Email - Medicology',
    description: 'Verify your Medicology email address',
};

export default function VerifyEmailPage() {
    return <VerifyEmailScreen />;
}
