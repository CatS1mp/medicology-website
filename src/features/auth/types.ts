
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

export interface OAuthLoginRequest {
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


export interface UserProfile {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
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

export interface CurrentUser {
    id: string;
    email: string;
    username: string;
    dateOfBirth: string | null;
    location: string | null;
    active: boolean;
    verified: boolean;
    admin: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CurrentUserProfile {
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
}

export interface CurrentUserSettings {
    userId: string;
    notificationEnabled: boolean;
    dailyReminderTime: string | null;
    emailNotifications: boolean;
    pushNotifications: boolean;
    themePreference: 'light' | 'dark' | 'system' | null;
    dailyGoalCourses: number | null;
}

export interface LinkedOAuthAccount {
    provider: string;
    providerUserId: string;
    providerEmail: string | null;
}

export interface UserSession {
    id: string;
    createdAt: string;
    expiresAt: string;
    revoked: boolean;
    tokenPreview: string;
}

export interface UpdateCurrentUserRequest {
    username?: string;
    dateOfBirth?: string | null;
    location?: string | null;
}

export interface UpdateCurrentUserProfileRequest {
    displayName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
}

export interface UpdateCurrentUserSettingsRequest {
    notificationEnabled?: boolean;
    dailyReminderTime?: string | null;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    themePreference?: 'light' | 'dark' | 'system' | null;
    dailyGoalCourses?: number | null;
}

export interface ChangeCurrentPasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}


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