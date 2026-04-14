import { getOrSetCachedValue, invalidateCachedValue, invalidateCachedValueByPrefix } from '@/shared/api/client-cache';

export function cachedGet<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    return getOrSetCachedValue<T>(key, ttlMs, factory);
}

export async function mutateAndInvalidate<T>(
    factory: () => Promise<T>,
    keys: string[] = [],
    prefixes: string[] = []
): Promise<T> {
    const result = await factory();
    if (keys.length > 0) {
        invalidateCachedValue(...keys);
    }
    if (prefixes.length > 0) {
        invalidateCachedValueByPrefix(...prefixes);
    }
    return result;
}
