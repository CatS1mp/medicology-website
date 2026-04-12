export function getAuthServiceUrl(): string | null {
    const url = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL?.trim();
    return url || null;
}
