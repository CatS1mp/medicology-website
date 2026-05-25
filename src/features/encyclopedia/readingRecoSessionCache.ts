import type { DictionaryArticleRecommendationItem, DictionaryArticleRecommendationResponse } from '@/features/encyclopedia/api';

const SESSION_READING_RECO_PREFIX = 'medicology:dict:reading-reco:v1';

function canUseSessionStorage() {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function readingRecoSessionKey(courseSlug: string, lessonSlug: string, attemptId: string | null): string {
    return `${SESSION_READING_RECO_PREFIX}:${courseSlug}:${lessonSlug}:${attemptId ?? 'none'}`;
}

/** Cache riêng trang chủ Bách khoa (không trùng key với trang hoàn thành bài học). */
export const encyclopediaLandingRecoCacheKey = (): string => readingRecoSessionKey('encyclopedia', 'landing', null);

export function readReadingRecoFromSession(key: string): DictionaryArticleRecommendationResponse | null {
    if (!canUseSessionStorage()) return null;
    try {
        const raw = window.sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object') return null;
        const obj = parsed as Record<string, unknown>;
        const strategy = obj.strategy;
        if (strategy !== 'ai' && strategy !== 'fallback_popular_unread') return null;
        if (!Array.isArray(obj.items)) return null;
        return { strategy, items: obj.items as DictionaryArticleRecommendationItem[] };
    } catch {
        return null;
    }
}

export function writeReadingRecoToSession(key: string, data: DictionaryArticleRecommendationResponse): void {
    if (!canUseSessionStorage()) return;
    try {
        window.sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
        // quota / private mode
    }
}

export function clearReadingRecoSessionCache() {
    if (!canUseSessionStorage()) return;
    try {
        const keys = Object.keys(window.sessionStorage).filter((key) =>
            key.startsWith(SESSION_READING_RECO_PREFIX)
        );
        keys.forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
        // Storage can be unavailable in private/restricted browser modes.
    }
}
