import { NextRequest } from 'next/server';
import { proxyThroughGateway } from '@/app/api/_proxy';

const LEGACY_BACKEND = process.env.DICTIONARY_SERVICE_URL ?? '';
const config = {
    gatewayBasePath: '/api/dictionary',
    legacy: { backendUrl: LEGACY_BACKEND, upstreamBasePath: '/api/dictionary' },
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
