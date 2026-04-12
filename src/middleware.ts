import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from '@/lib/auth-cookies';

function isProtectedPath(pathname: string): boolean {
    const prefixes = [
        '/dashboard',
        '/profile',
        '/notebook',
        '/courses',
        '/attempts',
        '/notifications',
        '/admin',
    ];
    return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (!isProtectedPath(pathname)) {
        return NextResponse.next();
    }

    const hasAuth =
        request.cookies.has(AUTH_ACCESS_COOKIE) || request.cookies.has(AUTH_REFRESH_COOKIE);

    if (!hasAuth) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/profile/:path*',
        '/notebook/:path*',
        '/courses/:path*',
        '/attempts/:path*',
        '/notifications/:path*',
        '/admin/:path*',
    ],
};
