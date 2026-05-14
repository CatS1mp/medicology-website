import type { DictionaryArticleRecommendationItem, DictionaryArticleRecommendationResponse } from '@/features/encyclopedia/api';

const SESSION_READING_RECO_PREFIX = 'medicology:dict:reading-reco:v1';

export function readingRecoSessionKey(courseSlug: string, lessonSlug: string, attemptId: string | null): string {
    return `${SESSION_READING_RECO_PREFIX}:${courseSlug}:${lessonSlug}:${attemptId ?? 'none'}`;
}

/** Cache riêng trang chủ Bách khoa (không trùng key với trang hoàn thành bài học). */
export const encyclopediaLandingRecoCacheKey = (): string => readingRecoSessionKey('encyclopedia', 'landing', null);

export function readReadingRecoFromSession(key: string): DictionaryArticleRecommendationResponse | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(key);
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
    if (typeof sessionStorage === 'undefined') return;
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
        // quota / private mode
    }
}
