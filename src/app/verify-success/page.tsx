import { VerifySuccessScreen } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Email Verified - Medicology',
    description: 'Your Medicology email address has been verified',
};

export default function VerifySuccessPage() {
    return <VerifySuccessScreen />;
}
