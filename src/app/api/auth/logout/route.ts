import { NextRequest, NextResponse } from 'next/server';
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE, clearAuthCookies } from '@/lib/auth-cookies';
import { getAuthBackend } from '@/lib/env-backend';

export async function POST(req: NextRequest) {
    const backend = getAuthBackend();
    const accessToken = req.cookies.get(AUTH_ACCESS_COOKIE)?.value;
    let refreshToken = req.cookies.get(AUTH_REFRESH_COOKIE)?.value;

    const raw = await req.text();
    if (raw) {
        try {
            const parsed = JSON.parse(raw) as { refreshToken?: string };
            if (typeof parsed.refreshToken === 'string' && parsed.refreshToken.length > 0) {
                refreshToken = parsed.refreshToken;
            }
        } catch {
            /* ignore */
        }
    }

    if (backend && (accessToken || refreshToken)) {
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (accessToken) {
            headers.authorization = `Bearer ${accessToken}`;
        }
        try {
            await fetch(`${backend.base}${backend.basePath}/logout`, {
                method: 'POST',
                headers,
                body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
            });
        } catch {
            /* still clear cookies */
        }
    }

    const res = NextResponse.json({ ok: true });
    clearAuthCookies(res);
    return res;
}
