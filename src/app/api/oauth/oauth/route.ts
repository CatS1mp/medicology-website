import { NextRequest, NextResponse } from 'next/server';
import { applyAuthCookies } from '@/lib/auth-cookies';
import { isAuthResponse, stripAuthTokensFromResponse, unwrapSpringBody } from '@/lib/auth-response';
import { getAuthServiceUrl } from '@/lib/env-backend';

export async function POST(req: NextRequest) {
    const backend = getAuthServiceUrl();
    if (!backend) {
        return NextResponse.json({ message: 'Dịch vụ xác thực chưa được cấu hình.' }, { status: 503 });
    }

    const body = await req.text();
    const res = await fetch(`${backend}/api/v1/oauth/oauth`, {
        method: 'POST',
        headers: {
            'content-type': req.headers.get('content-type') ?? 'application/json',
        },
        body,
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
