import { NextRequest } from 'next/server';
import { proxyThroughGateway } from '@/app/api/_proxy';

const LEGACY_BACKEND = process.env.AUTH_SERVICE_URL ?? '';
const config = {
    gatewayBasePath: '/api/profiles',
    legacy: { backendUrl: LEGACY_BACKEND, upstreamBasePath: '/api/v1/profiles' },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyThroughGateway(req, await params, config);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyThroughGateway(req, await params, config);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyThroughGateway(req, await params, config);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyThroughGateway(req, await params, config);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyThroughGateway(req, await params, config);
}
