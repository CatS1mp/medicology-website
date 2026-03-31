'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { oauthLogin } from '../api';
import { ApiError, OAuthRequest } from '../types';

export function useOAuth() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOAuth = async (data: OAuthRequest) => {
        setError(null);
        setIsLoading(true);
        try {
            const res = await oauthLogin(data);
            localStorage.setItem('accessToken', res.accessToken);
            localStorage.setItem('refreshToken', res.refreshToken);
            
            if (res.userProfile) {
                localStorage.setItem('userProfile', JSON.stringify(res.userProfile));
            }
            
            router.push('/dashboard');
        } catch (err) {
            console.error('OAuth login failed:', err);
            if (err instanceof ApiError) {
                setError(`ERR_${err.status}`);
            } else {
                setError('ERR_NETWORK');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { handleOAuth, isLoading, error, clearError: () => setError(null) };
}
