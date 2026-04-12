import type { NextResponse } from 'next/server';

export const AUTH_ACCESS_COOKIE = 'mc_access_token';
export const AUTH_REFRESH_COOKIE = 'mc_refresh_token';

export function applyAuthCookies(
    res: NextResponse,
    tokens: { accessToken: string; refreshToken: string; expiresIn: number }
) {
    const secure = process.env.NODE_ENV === 'production';
    const maxAgeAccess = Math.max(60, Math.floor(tokens.expiresIn));
    const maxAgeRefresh = 60 * 60 * 24 * 30;

    res.cookies.set(AUTH_ACCESS_COOKIE, tokens.accessToken, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeAccess,
    });
    res.cookies.set(AUTH_REFRESH_COOKIE, tokens.refreshToken, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeRefresh,
    });
}

export function clearAuthCookies(res: NextResponse) {
    res.cookies.delete(AUTH_ACCESS_COOKIE);
    res.cookies.delete(AUTH_REFRESH_COOKIE);
}
