export function getAuthServiceUrl(): string | null {
    const url = process.env.AUTH_SERVICE_URL?.trim();
    return url || null;
}

function getApiGatewayUrl(): string | null {
    const url = process.env.API_GATEWAY_URL?.trim();
    return url || null;
}

/**
 * Trả về `{ base, basePath }` cho các route auth chuyên biệt (login/refresh/oauth...).
 * Khi `API_GATEWAY_URL` được đặt, FE đi qua gateway (`/api/auth`), không thì gọi thẳng auth-service.
 * Trả `null` nếu thiếu cả gateway lẫn auth-service URL.
 */
export function getAuthBackend(): { base: string; basePath: string } | null {
    const gateway = getApiGatewayUrl();
    if (gateway) {
        return { base: gateway.replace(/\/+$/, ''), basePath: '/api/auth' };
    }
    const auth = getAuthServiceUrl();
    if (!auth) return null;
    return { base: auth.replace(/\/+$/, ''), basePath: '/api/v1/auth' };
}
