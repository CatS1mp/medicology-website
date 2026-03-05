import React from 'react';
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';

export const LoginScreen: React.FC = () => {
    return (
        <AuthLayout topRightText="Đăng ký" topRightHref="/signup">
            <LoginForm />
        </AuthLayout>
    );
};
