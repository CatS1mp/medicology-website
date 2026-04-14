type CacheRecord<T> = {
    expiresAt: number;
    sessionKey: string | null;
    value: T;
};

const STORAGE_PREFIX = 'medicology:api-cache:';
const memoryCache = new Map<string, CacheRecord<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

function canUseBrowserStorage() {
    return typeof window !== 'undefined';
}

function getSessionCacheKey(): string | null {
    if (!canUseBrowserStorage()) return null;
    const raw = window.localStorage.getItem('userProfile');
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
    if (!canUseBrowserStorage()) return null;

    const raw = window.sessionStorage.getItem(getStorageKey(key));
    if (!raw) return null;

    try {
        return JSON.parse(raw) as CacheRecord<T>;
    } catch {
        window.sessionStorage.removeItem(getStorageKey(key));
        return null;
    }
}

function persistRecord<T>(key: string, record: CacheRecord<T>) {
    if (!canUseBrowserStorage()) return;
    window.sessionStorage.setItem(getStorageKey(key), JSON.stringify(record));
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

export function invalidateCachedValue(...keys: string[]) {
    for (const key of keys) {
        memoryCache.delete(key);
        pendingRequests.delete(key);
        if (canUseBrowserStorage()) {
            window.sessionStorage.removeItem(getStorageKey(key));
        }
    }
}

export function invalidateCachedValueByPrefix(...prefixes: string[]) {
    if (prefixes.length === 0) return;

    const keysFromMemory = Array.from(memoryCache.keys());
    const keysFromPending = Array.from(pendingRequests.keys());
    const keysFromStorage =
        canUseBrowserStorage()
            ? Object.keys(window.sessionStorage)
                  .filter((k) => k.startsWith(STORAGE_PREFIX))
                  .map((k) => k.slice(STORAGE_PREFIX.length))
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
    const request = factory()
        .then((value) => {
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
