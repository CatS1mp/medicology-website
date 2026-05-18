import type { AuthSessionPayload } from './types';
import type { UserProfile } from './types';

const USER_PROFILE_KEY = 'userProfile';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';

export function persistAuthSession(session: AuthSessionPayload) {
    const expiresAt = Date.now() + session.expiresIn * 1000;

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(session.userProfile));
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('auth-session-updated'));
}

function getEmptyUserProfile(): UserProfile {
    return {
        userId: '',
        email: '',
        username: '',
        lastName: null,
        firstName: null,
        dateOfBirth: null,
        gender: null,
        address: null,
        displayName: null,
        bio: null,
    };
}

export function getCachedUserProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as UserProfile;
    } catch {
        return null;
    }
}

export function upsertCachedUserProfile(partial: Partial<UserProfile>) {
    if (typeof window === 'undefined') return;
    const current = getCachedUserProfile() ?? getEmptyUserProfile();
    const next: UserProfile = {
        ...current,
        ...partial,
    };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('user-profile-updated'));
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

    // Wipe all API response caches stored in sessionStorage
    if (typeof window !== 'undefined') {
        const keysToRemove = Object.keys(window.sessionStorage).filter((k) =>
            k.startsWith('medicology:api-cache:')
        );
        keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    }

    window.dispatchEvent(new Event('user-profile-updated'));
    window.dispatchEvent(new Event('auth-session-updated'));

    if (typeof window !== 'undefined') {
        void fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }).catch(() => undefined);
    }
}
