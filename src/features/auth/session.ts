import type { AuthSessionPayload } from './types';
import type { UserProfile } from './types';
import { clearAllCachedValues } from '@/shared/api/client-cache';

const USER_PROFILE_KEY = 'userProfile';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';

function canUseBrowserApis() {
    return typeof window !== 'undefined';
}

function getLocalStorageItem(key: string): string | null {
    if (!canUseBrowserApis()) return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setLocalStorageItem(key: string, value: string) {
    if (!canUseBrowserApis()) return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable in private/restricted browser modes.
    }
}

function removeLocalStorageItem(key: string) {
    if (!canUseBrowserApis()) return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Storage can be unavailable in private/restricted browser modes.
    }
}

function dispatchBrowserEvent(eventName: string) {
    if (!canUseBrowserApis()) return;
    window.dispatchEvent(new Event(eventName));
}

export function persistAuthSession(session: AuthSessionPayload) {
    const expiresAt = Date.now() + session.expiresIn * 1000;

    setLocalStorageItem(USER_PROFILE_KEY, JSON.stringify(session.userProfile));
    setLocalStorageItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
    dispatchBrowserEvent('user-profile-updated');
    dispatchBrowserEvent('auth-session-updated');
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
    const raw = getLocalStorageItem(USER_PROFILE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as UserProfile;
    } catch {
        return null;
    }
}

export function upsertCachedUserProfile(partial: Partial<UserProfile>) {
    const current = getCachedUserProfile() ?? getEmptyUserProfile();
    const next: UserProfile = {
        ...current,
        ...partial,
    };
    setLocalStorageItem(USER_PROFILE_KEY, JSON.stringify(next));
    dispatchBrowserEvent('user-profile-updated');
}

export function hasRefreshSession(): boolean {
    return (
        getLocalStorageItem(USER_PROFILE_KEY) != null && getLocalStorageItem(ACCESS_TOKEN_EXPIRES_AT_KEY) != null
    );
}

/** Refresh token lives in an httpOnly cookie; this returns a truthy placeholder when a session exists. */
export function getStoredRefreshToken() {
    return hasRefreshSession() ? 'cookie' : null;
}

export function getStoredAccessTokenExpiry() {
    const raw = getLocalStorageItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    if (!raw) return null;

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

export function clearAuthSession() {
    const cachedUserId = getCachedUserProfile()?.userId;
    const removeSessionKey = (key: string) => {
        removeLocalStorageItem(key);
        if (cachedUserId) {
            removeLocalStorageItem(`${key}:${cachedUserId}`);
        }
    };

    removeLocalStorageItem(USER_PROFILE_KEY);
    removeLocalStorageItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    removeLocalStorageItem('enrolledCoursesLocal');
    removeLocalStorageItem('accessToken');
    removeLocalStorageItem('refreshToken');
    removeSessionKey('learningStreakDays');
    removeSessionKey('learningStreakLastSyncDate');
    removeSessionKey('lastKnownStreak');
    removeSessionKey('lastBrokenStreakAckDate');
    removeSessionKey('lastGainedStreakAckDate');
    removeSessionKey('lastLearningStreakAckDate');
    removeSessionKey('pendingStreakCard');

    // Wipe all API response caches (both memory and sessionStorage)
    clearAllCachedValues();

    dispatchBrowserEvent('user-profile-updated');
    dispatchBrowserEvent('auth-session-updated');

    if (canUseBrowserApis()) {
        void fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }).catch(() => undefined);
    }
}
