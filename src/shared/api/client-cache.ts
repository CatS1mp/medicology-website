type CacheRecord<T> = {
    expiresAt: number;
    sessionKey: string | null;
    value: T;
};

const STORAGE_PREFIX = 'medicology:api-cache:';
const MAX_SESSION_STORAGE_RECORD_LENGTH = 1_000_000;
const memoryCache = new Map<string, CacheRecord<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();
let cacheVersion = 0;

function canUseBrowserStorage() {
    return typeof window !== 'undefined';
}

function safeGetLocalStorageItem(key: string): string | null {
    if (!canUseBrowserStorage()) return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeGetSessionStorageItem(key: string): string | null {
    if (!canUseBrowserStorage()) return null;
    try {
        return window.sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeRemoveSessionStorageItem(key: string) {
    if (!canUseBrowserStorage()) return;
    try {
        window.sessionStorage.removeItem(key);
    } catch {
        // Storage can be unavailable in private/restricted browser modes.
    }
}

function getSessionStorageKeys(): string[] {
    if (!canUseBrowserStorage()) return [];
    try {
        return Object.keys(window.sessionStorage);
    } catch {
        try {
            const keys: string[] = [];
            for (let index = 0; index < window.sessionStorage.length; index += 1) {
                const key = window.sessionStorage.key(index);
                if (key) keys.push(key);
            }
            return keys;
        } catch {
            return [];
        }
    }
}

function getSessionCacheKey(): string | null {
    const raw = safeGetLocalStorageItem('userProfile');
    if (!raw) return null;
    try {
        const p = JSON.parse(raw) as { userId?: string };
        return typeof p.userId === 'string' ? p.userId : raw;
    } catch {
        return null;
    }
}

function getStorageKey(key: string) {
    return `${STORAGE_PREFIX}${key}`;
}

function readStoredRecord<T>(key: string): CacheRecord<T> | null {
    const raw = safeGetSessionStorageItem(getStorageKey(key));
    if (!raw) return null;

    try {
        return JSON.parse(raw) as CacheRecord<T>;
    } catch {
        safeRemoveSessionStorageItem(getStorageKey(key));
        return null;
    }
}

function persistRecord<T>(key: string, record: CacheRecord<T>) {
    if (!canUseBrowserStorage()) return;
    try {
        const serialized = JSON.stringify(record);
        if (serialized.length > MAX_SESSION_STORAGE_RECORD_LENGTH) {
            return;
        }
        window.sessionStorage.setItem(getStorageKey(key), serialized);
    } catch {
        safeRemoveSessionStorageItem(getStorageKey(key));
    }
}

function isRecordFresh(record: CacheRecord<unknown> | null, sessionKey: string | null) {
    return !!record && record.expiresAt > Date.now() && record.sessionKey === sessionKey;
}

export function getCachedValue<T>(key: string): T | null {
    const sessionKey = getSessionCacheKey();
    const memoryRecord = memoryCache.get(key) as CacheRecord<T> | undefined;

    if (memoryRecord && isRecordFresh(memoryRecord, sessionKey)) {
        return memoryRecord.value;
    }

    const storedRecord = readStoredRecord<T>(key);
    if (storedRecord && isRecordFresh(storedRecord, sessionKey)) {
        memoryCache.set(key, storedRecord);
        return storedRecord.value;
    }

    return null;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number) {
    const sessionKey = getSessionCacheKey();
    const record: CacheRecord<T> = {
        value,
        expiresAt: Date.now() + ttlMs,
        sessionKey,
    };
    memoryCache.set(key, record);
    persistRecord(key, record);
}

export function invalidateCachedValue(...keys: string[]) {
    cacheVersion += 1;
    for (const key of keys) {
        memoryCache.delete(key);
        pendingRequests.delete(key);
        safeRemoveSessionStorageItem(getStorageKey(key));
    }
}

export function clearAllCachedValues() {
    cacheVersion += 1;
    memoryCache.clear();
    pendingRequests.clear();
    getSessionStorageKeys()
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .forEach((key) => safeRemoveSessionStorageItem(key));
}

export function invalidateCachedValueByPrefix(...prefixes: string[]) {
    if (prefixes.length === 0) return;

    const keysFromMemory = Array.from(memoryCache.keys());
    const keysFromPending = Array.from(pendingRequests.keys());
    const keysFromStorage =
        canUseBrowserStorage()
            ? getSessionStorageKeys()
                .filter((key) => key.startsWith(STORAGE_PREFIX))
                .map((key) => key.slice(STORAGE_PREFIX.length))
            : [];

    const allKeys = new Set<string>([...keysFromMemory, ...keysFromPending, ...keysFromStorage]);
    const matchedKeys = Array.from(allKeys).filter((key) => prefixes.some((prefix) => key.startsWith(prefix)));
    if (matchedKeys.length > 0) {
        invalidateCachedValue(...matchedKeys);
    }
}

export async function getOrSetCachedValue<T>(
    key: string,
    ttlMs: number,
    factory: () => Promise<T>
): Promise<T> {
    const cachedValue = getCachedValue<T>(key);
    if (cachedValue !== null) {
        return cachedValue;
    }

    const pending = pendingRequests.get(key) as Promise<T> | undefined;
    if (pending) {
        return pending;
    }

    const sessionKey = getSessionCacheKey();
    const requestVersion = cacheVersion;
    const request = factory()
        .then((value) => {
            if (requestVersion !== cacheVersion) {
                return value;
            }
            const record: CacheRecord<T> = {
                value,
                expiresAt: Date.now() + ttlMs,
                sessionKey,
            };
            memoryCache.set(key, record);
            persistRecord(key, record);
            return value;
        })
        .finally(() => {
            pendingRequests.delete(key);
        });

    pendingRequests.set(key, request);
    return request;
}
