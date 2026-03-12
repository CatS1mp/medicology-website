import { ForgotPasswordScreen } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Forgot Password - Medicology',
    description: 'Reset your Medicology password',
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordScreen />;
}
