import { NextRequest } from 'next/server';
import { proxyThroughGateway, proxyToBackend } from '@/app/api/_proxy';

const EXPLICIT_NOTIFICATION_BACKEND = process.env.NOTIFICATION_SERVICE_URL?.trim() ?? '';
const LEGACY_BACKEND = EXPLICIT_NOTIFICATION_BACKEND || 'http://localhost:8085';
const config = {
    gatewayBasePath: '/api/notifications',
    legacy: { backendUrl: LEGACY_BACKEND, upstreamBasePath: '/api/notifications' },
};

function proxyNotification(req: NextRequest, params: { path?: string[] }) {
    if (EXPLICIT_NOTIFICATION_BACKEND) {
        return proxyToBackend(req, params, config.legacy);
    }
    return proxyThroughGateway(req, params, config);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    return proxyNotification(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    return proxyNotification(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    return proxyNotification(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    return proxyNotification(req, await params);
}
