type CacheRecord<T> = {
    expiresAt: number;
    token: string | null;
    value: T;
};

const STORAGE_PREFIX = 'medicology:api-cache:';
const memoryCache = new Map<string, CacheRecord<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

function canUseBrowserStorage() {
    return typeof window !== 'undefined';
}

function getActiveAccessToken(): string | null {
    if (!canUseBrowserStorage()) return null;
    return window.localStorage.getItem('accessToken');
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

function isRecordFresh(record: CacheRecord<unknown> | null, token: string | null) {
    return !!record && record.expiresAt > Date.now() && record.token === token;
}

export function getCachedValue<T>(key: string): T | null {
    const token = getActiveAccessToken();
    const memoryRecord = memoryCache.get(key) as CacheRecord<T> | undefined;

    if (memoryRecord && isRecordFresh(memoryRecord, token)) {
        return memoryRecord.value;
    }

    const storedRecord = readStoredRecord<T>(key);
    if (storedRecord && isRecordFresh(storedRecord, token)) {
        memoryCache.set(key, storedRecord);
        return storedRecord.value;
    }

    return null;
}

export function invalidateCachedValue(...keys: string[]) {
    for (const key of keys) {
        memoryCache.delete(key);
        if (canUseBrowserStorage()) {
            window.sessionStorage.removeItem(getStorageKey(key));
        }
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

    const token = getActiveAccessToken();
    const request = factory()
        .then((value) => {
            const record: CacheRecord<T> = {
                value,
                expiresAt: Date.now() + ttlMs,
                token,
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
