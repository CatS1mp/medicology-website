import { NextRequest, NextResponse } from 'next/server';
import { applyAuthCookies, AUTH_REFRESH_COOKIE } from '@/lib/auth-cookies';
import { isAuthResponse, stripAuthTokensFromResponse, unwrapSpringBody } from '@/lib/auth-response';
import { getAuthBackend } from '@/lib/env-backend';

export async function POST(req: NextRequest) {
    const backend = getAuthBackend();
    if (!backend) {
        return NextResponse.json({ message: 'Dịch vụ xác thực chưa được cấu hình.' }, { status: 503 });
    }

    let bodyRefresh: string | undefined;
    try {
        const parsed = (await req.json()) as { refreshToken?: string };
        if (typeof parsed.refreshToken === 'string' && parsed.refreshToken.length > 0) {
            bodyRefresh = parsed.refreshToken;
        }
    } catch {
        /* empty body */
    }

    const refreshToken = bodyRefresh ?? req.cookies.get(AUTH_REFRESH_COOKIE)?.value;
    if (!refreshToken) {
        return NextResponse.json({ message: 'Missing refresh token' }, { status: 400 });
    }

    const res = await fetch(`${backend.base}${backend.basePath}/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
        return NextResponse.json(json, { status: res.status });
    }

    const data = unwrapSpringBody(json);
    if (!isAuthResponse(data)) {
        return NextResponse.json(json, { status: res.status });
    }

    const nextResponse = NextResponse.json(stripAuthTokensFromResponse(json), { status: res.status });
    applyAuthCookies(nextResponse, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: typeof data.expiresIn === 'number' ? data.expiresIn : Number(data.expiresIn),
    });
    return nextResponse;
}
