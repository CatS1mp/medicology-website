export function getAuthServiceUrl(): string | null {
    const url = process.env.AUTH_SERVICE_URL?.trim();
    return url || null;
}
