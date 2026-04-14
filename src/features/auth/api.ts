import {
    ApiError,
    ApiErrorBody,
    AuthSessionPayload,
    ChangeCurrentPasswordRequest,
    CurrentUser,
    CurrentUserProfile,
    CurrentUserSettings,
    LinkedOAuthAccount,
    LoginRequest,
    LogoutRequest,
    OAuthLoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    UpdateCurrentUserProfileRequest,
    UpdateCurrentUserRequest,
    UpdateCurrentUserSettingsRequest,
    UserSession,
} from './types';
import { ApiTransportError, buildHeaders, requestApi } from '@/shared/api/http';
import { cachedGet, mutateAndInvalidate } from '@/shared/api/cached-request';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';

const AUTH = `/api/auth`;
const USERS = `/api/users`;
const PROFILES = `/api/profiles`;
const SETTINGS = `/api/settings`;
const OAUTH = `/api/oauth`;
const SESSIONS = `/api/sessions`;

function authScopedKey(key: string, accessToken?: string): string {
    if (!accessToken) return key;
    return `${key}:token`;
}

function jsonPost<T>(url: string, data?: unknown, accessToken?: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'POST',
        headers: buildHeaders({ accessToken }),
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }).catch((error: unknown) => {
        throw normalizeAuthError(error);
    });
}

function jsonPatch<T>(url: string, data?: unknown, accessToken?: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'PATCH',
        headers: buildHeaders({ accessToken }),
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }).catch((error: unknown) => {
        throw normalizeAuthError(error);
    });
}

function jsonPut<T>(url: string, data?: unknown, accessToken?: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'PUT',
        headers: buildHeaders({ accessToken }),
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }).catch((error: unknown) => {
        throw normalizeAuthError(error);
    });
}

function jsonGet<T>(url: string, accessToken?: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'GET',
        headers: buildHeaders({ accessToken }),
    }).catch((error: unknown) => {
        throw normalizeAuthError(error);
    });
}

function jsonDelete<T>(url: string, accessToken?: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'DELETE',
        headers: buildHeaders({ accessToken, includeJsonContentType: false }),
    }).catch((error: unknown) => {
        throw normalizeAuthError(error);
    });
}

function normalizeAuthError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof ApiTransportError) {
        const body: ApiErrorBody = {
            status: error.status,
            message: error.message,
            timestamp: error.timestamp ?? new Date().toISOString(),
        };
        return new ApiError(body);
    }
    return new ApiError({
        status: 500,
        message: 'Unknown auth error',
        timestamp: new Date().toISOString(),
    });
}


export function register(data: RegisterRequest): Promise<RegisterResponse> {
    return jsonPost<RegisterResponse>(`${AUTH}/register`, data);
}

export function login(data: LoginRequest): Promise<AuthSessionPayload> {
    return mutateAndInvalidate(() => jsonPost<AuthSessionPayload>(`${AUTH}/login`, data), [], ['auth:']);
}

export function oauthLogin(data: OAuthLoginRequest): Promise<AuthSessionPayload> {
    return mutateAndInvalidate(() => jsonPost<AuthSessionPayload>(`${OAUTH}/oauth`, data), [], ['auth:']);
}


export function verifyEmail(token: string): Promise<string> {
    return requestApi<string>(`${AUTH}/verify?token=${encodeURIComponent(token)}`)
        .catch((error: unknown) => {
            throw normalizeAuthError(error);
        });
}

export function resend(email: string): Promise<string> {
    return requestApi<string>(`${AUTH}/resend?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: buildHeaders({ includeJsonContentType: false }),
    }).catch((error: unknown) => {
        throw normalizeAuthError(error);
    });
}

export { resend as resendVerificationEmail };
export function requestPasswordReset(email: string): Promise<string> {
    return requestApi<string>(`${AUTH}/reset/request?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: buildHeaders({ includeJsonContentType: false }),
    }).catch((error: unknown) => {
        throw normalizeAuthError(error);
    });
}

export function resetPassword(data: ResetPasswordRequest): Promise<string> {
    return jsonPost<string>(`${AUTH}/reset`, data);
}

export function logout(data?: LogoutRequest, accessToken?: string): Promise<string> {
    return mutateAndInvalidate(() => jsonPost<string>(`${AUTH}/logout`, data, accessToken), [], ['auth:']);
}

export function refreshToken(data: RefreshTokenRequest): Promise<AuthSessionPayload> {
    return mutateAndInvalidate(() => jsonPost<AuthSessionPayload>(`${AUTH}/refresh`, data), [], ['auth:']);
}

export function getCurrentUser(accessToken?: string): Promise<CurrentUser> {
    return cachedGet(authScopedKey(cacheKeys.auth.currentUser(), accessToken), CACHE_TTL.SHORT, () =>
        jsonGet<CurrentUser>(`${USERS}/me`, accessToken)
    );
}

export function updateCurrentUser(data: UpdateCurrentUserRequest, accessToken?: string): Promise<CurrentUser> {
    return mutateAndInvalidate(
        () => jsonPatch<CurrentUser>(`${USERS}/me`, data, accessToken),
        [authScopedKey(cacheKeys.auth.currentUser(), accessToken), authScopedKey(cacheKeys.auth.currentProfile(), accessToken)]
    );
}

export function changeCurrentPassword(data: ChangeCurrentPasswordRequest, accessToken?: string): Promise<void> {
    return jsonPut<void>(`${USERS}/me/password`, data, accessToken);
}

export function getCurrentProfile(accessToken?: string): Promise<CurrentUserProfile> {
    return cachedGet(authScopedKey(cacheKeys.auth.currentProfile(), accessToken), CACHE_TTL.SHORT, () =>
        jsonGet<CurrentUserProfile>(`${PROFILES}/me`, accessToken)
    );
}

export function updateCurrentProfile(
    data: UpdateCurrentUserProfileRequest,
    accessToken?: string
): Promise<CurrentUserProfile> {
    return mutateAndInvalidate(
        () => jsonPut<CurrentUserProfile>(`${PROFILES}/me`, data, accessToken),
        [authScopedKey(cacheKeys.auth.currentProfile(), accessToken), authScopedKey(cacheKeys.auth.currentUser(), accessToken)]
    );
}

export function getCurrentSettings(accessToken?: string): Promise<CurrentUserSettings> {
    return cachedGet(authScopedKey(cacheKeys.auth.currentSettings(), accessToken), CACHE_TTL.MEDIUM, () =>
        jsonGet<CurrentUserSettings>(`${SETTINGS}/me`, accessToken)
    );
}

export function updateCurrentSettings(
    data: UpdateCurrentUserSettingsRequest,
    accessToken?: string
): Promise<CurrentUserSettings> {
    return mutateAndInvalidate(
        () => jsonPatch<CurrentUserSettings>(`${SETTINGS}/me`, data, accessToken),
        [authScopedKey(cacheKeys.auth.currentSettings(), accessToken)]
    );
}

export function getLinkedAccounts(accessToken?: string): Promise<LinkedOAuthAccount[]> {
    return cachedGet(authScopedKey(cacheKeys.auth.linkedAccounts(), accessToken), CACHE_TTL.MEDIUM, () =>
        jsonGet<LinkedOAuthAccount[]>(`${OAUTH}/linked-accounts`, accessToken)
    );
}

export function unlinkLinkedAccount(provider: string, accessToken?: string): Promise<void> {
    return mutateAndInvalidate(
        () => jsonDelete<void>(`${OAUTH}/linked-accounts/${encodeURIComponent(provider)}`, accessToken),
        [authScopedKey(cacheKeys.auth.linkedAccounts(), accessToken)]
    );
}

export function getSessions(accessToken?: string): Promise<UserSession[]> {
    return jsonGet<UserSession[]>(`${SESSIONS}`, accessToken);
}

export function revokeSession(sessionId: string, accessToken?: string): Promise<void> {
    return mutateAndInvalidate(
        () => jsonDelete<void>(`${SESSIONS}/${encodeURIComponent(sessionId)}`, accessToken),
        [],
        ['auth:']
    );
}