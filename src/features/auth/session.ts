import type { AuthSessionPayload } from './types';

const USER_PROFILE_KEY = 'userProfile';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';

export function persistAuthSession(session: AuthSessionPayload) {
    const expiresAt = Date.now() + session.expiresIn * 1000;

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(session.userProfile));
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('auth-session-updated'));
}

export function hasRefreshSession(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        localStorage.getItem(USER_PROFILE_KEY) != null && localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY) != null
    );
}

/** Refresh token lives in an httpOnly cookie; this returns a truthy placeholder when a session exists. */
export function getStoredRefreshToken() {
    if (typeof window === 'undefined') return null;
    return hasRefreshSession() ? 'cookie' : null;
}

export function getStoredAccessTokenExpiry() {
    const raw = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    if (!raw) return null;

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

export function clearAuthSession() {
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    localStorage.removeItem('enrolledCoursesLocal');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('auth-session-updated'));

    if (typeof window !== 'undefined') {
        void fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }).catch(() => undefined);
    }
}
