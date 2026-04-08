import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_proxy';

const BACKEND = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? '';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyToBackend(req, await params, { backendUrl: BACKEND, upstreamBasePath: '/api/v1/oauth' });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyToBackend(req, await params, { backendUrl: BACKEND, upstreamBasePath: '/api/v1/oauth' });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyToBackend(req, await params, { backendUrl: BACKEND, upstreamBasePath: '/api/v1/oauth' });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyToBackend(req, await params, { backendUrl: BACKEND, upstreamBasePath: '/api/v1/oauth' });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyToBackend(req, await params, { backendUrl: BACKEND, upstreamBasePath: '/api/v1/oauth' });
}
