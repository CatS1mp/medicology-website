import {
    ApiError,
    ApiErrorBody,
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    OAuthLoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
} from './types';

// Requests go through the local Next.js proxy (/api/auth/*) which forwards
// server-to-server to the Railway backend — avoids CORS entirely.
const AUTH = `/api/auth`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
        // Some endpoints return plain text
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            return res.json() as Promise<T>;
        }
        return res.text() as unknown as T;
    }

    // Try to parse structured error body
    let body: ApiErrorBody;
    try {
        body = await res.json();
    } catch {
        body = { status: res.status, message: res.statusText, timestamp: new Date().toISOString() };
    }
    throw new ApiError(body);
}

function jsonPost<T>(url: string, data?: unknown, accessToken?: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return fetch(url, {
        method: 'POST',
        headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }).then((res) => handleResponse<T>(res));
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** POST /api/v1/auth/register — Creates account, sends verification email */
export function register(data: RegisterRequest): Promise<RegisterResponse> {
    return jsonPost<RegisterResponse>(`${AUTH}/register`, data);
}

/** POST /api/v1/auth/login — Authenticates by email/password */
export function login(data: LoginRequest): Promise<AuthResponse> {
    return jsonPost<AuthResponse>(`${AUTH}/login`, data);
}

/** POST /api/v1/auth/oauth — Completes OAuth login after provider authentication */
export function oauthLogin(data: OAuthLoginRequest): Promise<AuthResponse> {
    return jsonPost<AuthResponse>(`${AUTH}/oauth`, data);
}


/** GET /api/v1/auth/verify?token= — Marks user as verified */
export function verifyEmail(token: string): Promise<string> {
    return fetch(`${AUTH}/verify?token=${encodeURIComponent(token)}`)
        .then((res) => handleResponse<string>(res));
}

/** POST /api/v1/auth/resend?email= — Resends verification email */
export function resendVerificationEmail(email: string): Promise<string> {
    return fetch(`${AUTH}/resend?email=${encodeURIComponent(email)}`, {
        method: 'POST',
    }).then((res) => handleResponse<string>(res));
}

/** POST /api/v1/auth/reset/request?email= — Sends password reset email */
export function requestPasswordReset(email: string): Promise<string> {
    return fetch(`${AUTH}/reset/request?email=${encodeURIComponent(email)}`, {
        method: 'POST',
    }).then((res) => handleResponse<string>(res));
}

/** POST /api/v1/auth/reset — Resets password using a reset token */
export function resetPassword(data: ResetPasswordRequest): Promise<string> {
    return jsonPost<string>(`${AUTH}/reset`, data);
}

/** POST /api/v1/auth/logout — Revokes refresh token */
export function logout(data?: LogoutRequest, accessToken?: string): Promise<string> {
    return jsonPost<string>(`${AUTH}/logout`, data, accessToken);
}

/** POST /api/v1/auth/refresh — Exchanges refresh token for new tokens (rotation) */
export function refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return jsonPost<AuthResponse>(`${AUTH}/refresh`, data);
}
