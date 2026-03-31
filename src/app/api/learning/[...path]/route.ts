import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_LEARNING_SERVICE_URL ?? '';

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
    const targetUrl = `${BACKEND}/api/v1/learning/${pathname}${search}`;

    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    
    // Pass the bearer token from the client to the upstream service
    const auth = req.headers.get('authorization');
    if (auth) headers.set('authorization', auth);

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? await req.text() : undefined;

    try {
        const res = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
        });

        const resContentType = res.headers.get('content-type') ?? '';
        const resBody = resContentType.includes('application/json')
            ? await res.json()
            : await res.text();

        return NextResponse.json(
            typeof resBody === 'string' ? { message: resBody } : resBody,
            { status: res.status }
        );
    } catch (error) {
        console.error('Learning API proxy error:', error);
        return NextResponse.json({ message: 'Internal Server Error (Proxy)' }, { status: 500 });
    }
}
