import { AuthResponse } from './types';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_KEY = 'userProfile';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';

export function persistAuthSession(session: AuthResponse) {
    const expiresAt = Date.now() + session.expiresIn * 1000;

    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(session.userProfile));
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('auth-session-updated'));
}

export function getStoredRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredAccessTokenExpiry() {
    const raw = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    if (!raw) return null;

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

export function clearAuthSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    localStorage.removeItem('enrolledCoursesLocal');
    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('auth-session-updated'));
}
