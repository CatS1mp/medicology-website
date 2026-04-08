'use client';

import React from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { oauthLogin } from '../api';
import { ApiError, AuthResponse } from '../types';
import { persistAuthSession } from '../session';

type Provider = 'facebook' | 'google';

type GoogleTokenResponse = {
    access_token?: string;
    error?: string;
    error_description?: string;
};

type GoogleTokenClient = {
    requestAccessToken: (overrides?: { prompt?: string }) => void;
};

type GoogleUserInfo = {
    email?: string;
    id?: string;
    sub?: string;
    name?: string;
};

type FacebookAuthResponse = {
    accessToken: string;
};

type FacebookLoginResponse = {
    authResponse?: FacebookAuthResponse;
    status?: string;
};

type FacebookUserProfile = {
    email?: string;
    id?: string;
    name?: string;
};

declare global {
    interface Window {
        FB?: {
            api: (
                path: string,
                params: Record<string, string>,
                callback: (response: FacebookUserProfile & { error?: { message?: string } }) => void
            ) => void;
            init: (options: Record<string, unknown>) => void;
            login: (
                callback: (response: FacebookLoginResponse) => void,
                options?: Record<string, unknown>
            ) => void;
        };
        google?: {
            accounts?: {
                oauth2?: {
                    initTokenClient: (config: {
                        callback: (response: GoogleTokenResponse) => void;
                        client_id: string;
                        scope: string;
                    }) => GoogleTokenClient;
                };
            };
        };
    }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? '';
const OAUTH_SCOPE = 'openid email profile';

function isSecureFacebookOrigin() {
    if (typeof window === 'undefined') {
        return true;
    }

    const { hostname, protocol } = window.location;
    return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

const ERROR_MESSAGES: Record<string, string> = {
    ERR_400: 'Thông tin tài khoản OAuth không hợp lệ.',
    ERR_401: 'Không thể xác thực bằng tài khoản mạng xã hội này.',
    ERR_403: 'Tài khoản của bạn hiện không thể đăng nhập.',
    ERR_FACEBOOK_EMAIL: 'Facebook chưa trả về email. Hãy kiểm tra email chính trên tài khoản Facebook hoặc dùng Google.',
    ERR_GOOGLE_CONFIG: 'Thiếu cấu hình Google OAuth ở frontend.',
    ERR_FACEBOOK_CONFIG: 'Thiếu cấu hình Facebook OAuth ở frontend.',
    ERR_GOOGLE_SDK: 'Google OAuth chưa sẵn sàng. Vui lòng thử lại sau vài giây.',
    ERR_GOOGLE_PROFILE: 'Không lấy được thông tin tài khoản Google. Hãy cấp quyền email và thử lại.',
    ERR_GOOGLE_EXCHANGE: 'Google đã trả về token nhưng không thể lấy thông tin người dùng.',
    ERR_FACEBOOK_SDK: 'Facebook OAuth chưa sẵn sàng. Vui lòng thử lại sau vài giây.',
    ERR_FACEBOOK_HTTPS: 'Facebook Login chỉ hoạt động trên HTTPS hoặc localhost. Hãy mở site bằng HTTPS để tiếp tục.',
    ERR_GOOGLE_CANCELLED: 'Bạn đã hủy đăng nhập Google.',
    ERR_FACEBOOK_CANCELLED: 'Bạn đã hủy đăng nhập Facebook.',
    ERR_NETWORK: 'Không thể hoàn tất đăng nhập OAuth. Vui lòng thử lại.',
};

export const OAuthButtons: React.FC = () => {
    const router = useRouter();
    const [loadingProvider, setLoadingProvider] = React.useState<Provider | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const googleClientRef = React.useRef<GoogleTokenClient | null>(null);
    const googleReadyRef = React.useRef(false);
    const facebookReadyRef = React.useRef(false);

    const completeOAuthLogin = React.useCallback(
        async (sessionPromise: Promise<AuthResponse>) => {
            const session = await sessionPromise;
            persistAuthSession(session);
            router.push('/dashboard');
        },
        [router]
    );

    const handleGoogleClick = React.useCallback(() => {
        if (!GOOGLE_CLIENT_ID) {
            setError('ERR_GOOGLE_CONFIG');
            return;
        }
        if (!googleReadyRef.current || !googleClientRef.current) {
            setError('ERR_GOOGLE_SDK');
            return;
        }

        setError(null);
        setLoadingProvider('google');
        googleClientRef.current.requestAccessToken({ prompt: 'select_account' });
    }, []);

    const handleFacebookClick = React.useCallback(() => {
        if (!FACEBOOK_APP_ID) {
            setError('ERR_FACEBOOK_CONFIG');
            return;
        }
        if (!isSecureFacebookOrigin()) {
            setError('ERR_FACEBOOK_HTTPS');
            return;
        }
        if (!facebookReadyRef.current || !window.FB) {
            setError('ERR_FACEBOOK_SDK');
            return;
        }

        setError(null);
        setLoadingProvider('facebook');
        window.FB.login((response) => {
            void (async () => {
                if (!response.authResponse?.accessToken) {
                    setLoadingProvider(null);
                    setError('ERR_FACEBOOK_CANCELLED');
                    return;
                }

                try {
                    const profile = await new Promise<FacebookUserProfile>((resolve, reject) => {
                        window.FB?.api('/me', { fields: 'id,name,email' }, (result) => {
                            if (result.error?.message) {
                                reject(new Error(result.error.message));
                                return;
                            }
                            resolve(result);
                        });
                    });

                    if (!profile.email || !profile.id || !profile.name) {
                        setError('ERR_FACEBOOK_EMAIL');
                        return;
                    }

                    await completeOAuthLogin(
                        oauthLogin({
                            email: profile.email,
                            name: profile.name,
                            facebookId: profile.id,
                        })
                    );
                } catch (err) {
                    if (err instanceof ApiError) {
                        setError(`ERR_${err.status}`);
                    } else {
                        setError('ERR_NETWORK');
                    }
                } finally {
                    setLoadingProvider(null);
                }
            })();
        }, { scope: 'email,public_profile' });
    }, [completeOAuthLogin]);

    const initGoogleClient = React.useCallback(() => {
        const oauth2 = window.google?.accounts?.oauth2;
        if (!GOOGLE_CLIENT_ID || !oauth2) {
            return;
        }

        if (googleClientRef.current) {
            googleReadyRef.current = true;
            return;
        }

        googleClientRef.current = oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: OAUTH_SCOPE,
            callback: async (tokenResponse) => {
                if (!tokenResponse.access_token) {
                    setLoadingProvider(null);
                    setError(tokenResponse.error ? 'ERR_GOOGLE_CANCELLED' : 'ERR_NETWORK');
                    return;
                }

                try {
                    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                        },
                    });
                    if (!profileRes.ok) {
                        setError('ERR_GOOGLE_EXCHANGE');
                        return;
                    }

                    const profile = (await profileRes.json()) as GoogleUserInfo;
                    const providerUserId = profile.id ?? profile.sub;
                    if (!profile.email || !providerUserId || !profile.name) {
                        setError('ERR_GOOGLE_PROFILE');
                        return;
                    }

                    await completeOAuthLogin(
                        oauthLogin({
                            email: profile.email,
                            name: profile.name,
                            googleId: providerUserId,
                        })
                    );
                } catch (err) {
                    if (err instanceof ApiError) {
                        setError(`ERR_${err.status}`);
                    } else {
                        setError('ERR_NETWORK');
                    }
                } finally {
                    setLoadingProvider(null);
                }
            },
        });
        googleReadyRef.current = true;
    }, [completeOAuthLogin]);

    const initFacebookClient = React.useCallback(() => {
        if (!FACEBOOK_APP_ID || !window.FB) {
            return;
        }

        if (facebookReadyRef.current) {
            return;
        }

        window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: false,
            xfbml: false,
            version: 'v22.0',
        });
        facebookReadyRef.current = true;
    }, []);

    React.useEffect(() => {
        initGoogleClient();
        initFacebookClient();
    }, [initFacebookClient, initGoogleClient]);

    const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.ERR_NETWORK) : null;

    return (
        <div className="w-full">
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initGoogleClient} onReady={initGoogleClient} />
            <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" onLoad={initFacebookClient} onReady={initFacebookClient} />
            <div className="grid grid-cols-2 gap-4">
                <Button
                    type="button"
                    variant="outline"
                    disabled={loadingProvider !== null}
                    className="text-[#3b5998] border-gray-200 py-3 uppercase tracking-wider text-[13px] shadow-[0_2px_0_0_#e5e7eb] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#e5e7eb] active:translate-y-[2px] active:shadow-none"
                    onClick={handleFacebookClick}
                >
                    <span className="font-bold text-lg mr-1 text-[#3b5998]">f</span> Facebook
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={loadingProvider !== null}
                    className="text-gray-600 border-gray-200 py-3 uppercase tracking-wider text-[13px] shadow-[0_2px_0_0_#e5e7eb] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#e5e7eb] active:translate-y-[2px] active:shadow-none font-bold"
                    onClick={handleGoogleClick}
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
            {loadingProvider && (
                <p className="mt-3 text-xs text-gray-500">
                    Đang kết nối {loadingProvider === 'google' ? 'Google' : 'Facebook'}...
                </p>
            )}
            {errorMessage && (
                <p className="mt-3 text-sm text-red-500">{errorMessage}</p>
            )}
        </div>
    );
};
