import React from 'react';
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';

export const LoginScreen: React.FC = () => {
    return (
        <AuthLayout topRightText="Sign up" topRightHref="/signup">
            <LoginForm />
        </AuthLayout>
    );
};
