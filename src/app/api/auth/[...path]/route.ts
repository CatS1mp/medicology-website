import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? '';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, await params);
}

async function proxy(req: NextRequest, params: { path: string[] }) {
    const pathname = params.path.join('/');
    const search = req.nextUrl.search ?? '';
    const targetUrl = `${BACKEND}/api/v1/auth/${pathname}${search}`;

    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const auth = req.headers.get('authorization');
    if (auth) headers.set('authorization', auth);

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? await req.text() : undefined;

    const res = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
    });

    const resContentType = res.headers.get('content-type') ?? '';

    // Preserve response format:
    // - If backend returns JSON, forward JSON
    // - If backend returns plain text, forward plain text
    if (resContentType.includes('application/json')) {
        const json = await res.json();
        return NextResponse.json(json, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: {
            'content-type': resContentType || 'text/plain; charset=utf-8',
        },
    });
}
