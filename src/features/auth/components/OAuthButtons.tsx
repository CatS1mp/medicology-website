'use client';

import React from 'react';
import { Button } from '@/shared/components/Button';
import { useGoogleLogin, TokenResponse } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { useOAuth } from '../hooks/useOAuth';
import { jwtDecode } from 'jwt-decode';

export const OAuthButtons: React.FC = () => {
    const { handleOAuth, isLoading, error } = useOAuth();

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // Because we didn't use the standard Google button, useGoogleLogin returns an access token
            // We need to fetch the user info using this access token
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();
                
                await handleOAuth({
                    email: userInfo.email,
                    name: userInfo.name,
                    googleId: userInfo.sub,
                });
            } catch (err) {
                console.error("Failed to fetch Google user info", err);
            }
        },
        onError: errorResponse => console.log(errorResponse),
    });

    const responseFacebook = async (response: any) => {
        if (response.status === 'unknown' || response.error || !response.email) {
            console.error('Facebook login failed or no email provided', response);
            return;
        }

        await handleOAuth({
            email: response.email,
            name: response.name || '',
            facebookId: response.id,
        });
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 gap-4">
                {mounted ? (
                    <FacebookLogin
                        appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''}
                        fields="name,email,picture"
                        callback={responseFacebook}
                        render={(renderProps: any) => (
                            <Button
                                variant="outline"
                                className="text-[#3b5998] border-gray-200 py-3 uppercase tracking-wider text-[13px] shadow-[0_2px_0_0_#e5e7eb] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#e5e7eb] active:translate-y-[2px] active:shadow-none"
                                onClick={renderProps.onClick}
                                disabled={isLoading}
                            >
                                <span className="font-bold text-lg mr-1 text-[#3b5998]">f</span> Facebook
                            </Button>
                        )}
                    />
                ) : (
                    <Button
                        variant="outline"
                        className="text-[#3b5998] border-gray-200 py-3 uppercase tracking-wider text-[13px] shadow-[0_2px_0_0_#e5e7eb] opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <span className="font-bold text-lg mr-1 text-[#3b5998]">f</span> Facebook
                    </Button>
                )}
                
                <Button
                    variant="outline"
                    className="text-gray-600 border-gray-200 py-3 uppercase tracking-wider text-[13px] shadow-[0_2px_0_0_#e5e7eb] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#e5e7eb] active:translate-y-[2px] active:shadow-none font-bold"
                    onClick={() => googleLogin()}
                    disabled={isLoading}
                >
                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </Button>
            </div>
            
            {error && (
                <p className="text-sm text-red-500 text-center mt-4">
                    {error === 'ERR_NETWORK' ? 'Không thể kết nối đến máy chủ.' : 'Lỗi đăng nhập OAuth.'}
                </p>
            )}
        </div>
    );
};
