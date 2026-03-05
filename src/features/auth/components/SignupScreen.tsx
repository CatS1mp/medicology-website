import React from 'react';
import { AuthLayout } from './AuthLayout';
import { SignupForm } from './SignupForm';

export const SignupScreen: React.FC = () => {
    return (
        <AuthLayout topRightText="Đăng nhập" topRightHref="/login">
            <SignupForm />
        </AuthLayout>
    );
};
