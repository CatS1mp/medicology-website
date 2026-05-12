import { ApiTransportError, buildHeaders, requestApi } from '@/shared/api/http';
import { cachedGet, mutateAndInvalidate } from '@/shared/api/cached-request';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';
import { normalizeSpringListPayload } from '@/shared/types/admin';

const DICTIONARY = `/api/dictionary`;

export interface DictionaryTagResponse {
    id: string;
    name: string;
    createdAt: string;
}

export interface DictionaryArticleResponse {
    id: string;
    name: string;
    slug: string;
    contentJson?: string | null;
    contentVersion?: number | null;
    contentMarkdown?: string | null;
    authorAdminId: string;
    isPublished: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    tags?: DictionaryTagResponse[] | null;
}

export interface DictionaryArticleTemplateResponse {
    id: string;
    code: string;
    name: string;
    description: string;
    defaultContentJson?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DictionaryComponentDefinitionResponse {
    id: string;
    code: string;
    name: string;
    componentType: string;
    schemaJson?: string | null;
    defaultDataJson?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DictionaryCommentResponse {
    id: string;
    articleId: string;
    parentCommentId: string | null;
    userId: string;
    username?: string | null;
    displayName?: string | null;
    commentText: string;
    isApproved: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
    replies: DictionaryCommentResponse[];
}

export interface DictionaryInteractionSummaryResponse {
    totalViews: number;
    uniqueViewers: number;
    totalBookmarks: number;
    totalComments: number;
}

export interface DictionaryViewStatisticsResponse {
    totalViews: number;
    uniqueViewers: number;
    lastViewedAt: string | null;
}

export interface DictionaryBookmarkArticleResponse extends DictionaryArticleResponse {
    bookmarkedAt?: string | null;
}

function normalizeDictionaryError(error: unknown) {
    if (error instanceof ApiTransportError) {
        throw new Error(`Dictionary API error (${error.status}): ${error.message}`);
    }
    throw error instanceof Error ? error : new Error('Unknown dictionary error');
}

function getJson<T>(url: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'GET',
        headers: buildHeaders(),
    }).catch((error: unknown) => {
        normalizeDictionaryError(error);
        throw error;
    });
}

function postJson<T>(url: string, body?: unknown): Promise<T> {
    return requestApi<T>(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
    }).catch((error: unknown) => {
        normalizeDictionaryError(error);
        throw error;
    });
}

function deleteJson<T>(url: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'DELETE',
        headers: buildHeaders({ includeJsonContentType: false }),
    }).catch((error: unknown) => {
        normalizeDictionaryError(error);
        throw error;
    });
}

/**
 * Backend `dictionary-service`: `GET /api/dictionary/articles` returns PaginatedResponse (`content`, `totalElements`),
 * not a bare array. Same shape as Spring `Page` consumers already handle via `normalizeSpringListPayload`.
 */
async function fetchDictionaryArticlesCatalog(): Promise<DictionaryArticleResponse[]> {
    const pageSize = 500;
    let page = 0;
    const acc: DictionaryArticleResponse[] = [];
    let reportedTotal = 0;

    for (let guard = 0; guard < 40; guard += 1) {
        const qs = new URLSearchParams({ page: String(page), size: String(pageSize) });
        const raw = await getJson<unknown>(`${DICTIONARY}/articles?${qs}`);
        const { items, total } = normalizeSpringListPayload<DictionaryArticleResponse>(raw);
        reportedTotal = total;
        if (items.length === 0) break;
        acc.push(...items);
        if (acc.length >= reportedTotal) break;
        page += 1;
    }

    return acc;
}

export function listArticles(): Promise<DictionaryArticleResponse[]> {
    return cachedGet(cacheKeys.dictionary.articles(), CACHE_TTL.MEDIUM, fetchDictionaryArticlesCatalog);
}

export function listTermArticles(): Promise<DictionaryArticleResponse[]> {
    return listArticles();
}

export function getArticleBySlug(slug: string): Promise<DictionaryArticleResponse> {
    return cachedGet(cacheKeys.dictionary.articleBySlug(slug), CACHE_TTL.MEDIUM, () =>
        getJson<DictionaryArticleResponse>(`${DICTIONARY}/articles/${encodeURIComponent(slug)}`)
    );
}

export function recordArticleView(articleId: string): Promise<void> {
    return mutateAndInvalidate(
        () => postJson<void>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/view`),
        [cacheKeys.dictionary.articleViews(articleId), cacheKeys.dictionary.articleInteractions(articleId)]
    );
}

export function bookmarkArticle(articleId: string): Promise<void> {
    return mutateAndInvalidate(
        () => postJson<void>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/bookmark`),
        [cacheKeys.dictionary.bookmarks(), cacheKeys.dictionary.articleInteractions(articleId)]
    );
}

export function unbookmarkArticle(articleId: string): Promise<void> {
    return mutateAndInvalidate(
        () => deleteJson<void>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/bookmark`),
        [cacheKeys.dictionary.bookmarks(), cacheKeys.dictionary.articleInteractions(articleId)]
    );
}

export function getInteractionSummary(articleId: string): Promise<DictionaryInteractionSummaryResponse> {
    return cachedGet(cacheKeys.dictionary.articleInteractions(articleId), CACHE_TTL.SHORT, () =>
        getJson<DictionaryInteractionSummaryResponse>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/interactions/summary`)
    );
}

export function getViewStatistics(articleId: string): Promise<DictionaryViewStatisticsResponse> {
    return cachedGet(cacheKeys.dictionary.articleViews(articleId), CACHE_TTL.SHORT, () =>
        getJson<DictionaryViewStatisticsResponse>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/views`)
    );
}

export function getArticleComments(articleId: string): Promise<DictionaryCommentResponse[]> {
    return cachedGet(cacheKeys.dictionary.articleComments(articleId), CACHE_TTL.SHORT, () =>
        getJson<DictionaryCommentResponse[]>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/comments`)
    );
}

export function createArticleComment(articleId: string, commentText: string): Promise<string> {
    return mutateAndInvalidate(
        () => postJson<string>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/comments`, { commentText }),
        [cacheKeys.dictionary.articleComments(articleId), cacheKeys.dictionary.articleInteractions(articleId)]
    );
}

export function replyArticleComment(commentId: string, commentText: string): Promise<string> {
    return mutateAndInvalidate(
        () => postJson<string>(`${DICTIONARY}/comments/${encodeURIComponent(commentId)}/reply`, { commentText }),
        [],
        [cacheKeys.dictionary.articlePrefix()]
    );
}

export function approveArticleComment(commentId: string): Promise<void> {
    return mutateAndInvalidate(
        () => postJson<void>(`${DICTIONARY}/comments/${encodeURIComponent(commentId)}/approve`),
        [],
        [cacheKeys.dictionary.articlePrefix()]
    );
}

export function voteComment(commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
    return mutateAndInvalidate(
        () => postJson<void>(`${DICTIONARY}/comments/${encodeURIComponent(commentId)}/vote`, { voteType }),
        [],
        [cacheKeys.dictionary.articlePrefix()]
    );
}

export function listBookmarkedArticles(): Promise<DictionaryBookmarkArticleResponse[]> {
    return cachedGet(cacheKeys.dictionary.bookmarks(), CACHE_TTL.SHORT, () =>
        getJson<DictionaryBookmarkArticleResponse[]>(`${DICTIONARY}/users/me/bookmarks`)
    );
}
