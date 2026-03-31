// ─── Request types ────────────────────────────────────────────────────────────

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface OAuthRequest {
    email: string;
    name: string;
    facebookId?: string;
    googleId?: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface LogoutRequest {
    refreshToken?: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface UserProfile {
    displayName: string;
    avatarUrl: string;
    bio: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    userProfile: UserProfile;
}

export interface RegisterResponse {
    email: string;
}

// ─── Error type ───────────────────────────────────────────────────────────────

export interface ApiErrorBody {
    status: number;
    message: string;
    timestamp: string;
}

export class ApiError extends Error {
    public readonly status: number;
    public readonly body: ApiErrorBody;

    constructor(body: ApiErrorBody) {
        super(body.message);
        this.name = 'ApiError';
        this.status = body.status;
        this.body = body;
    }
}
