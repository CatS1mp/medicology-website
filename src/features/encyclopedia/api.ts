import { ApiTransportError, buildHeaders, requestApi } from '@/shared/api/http';

const DICTIONARY = `/api/dictionary`;

export interface DictionaryTagResponse {
    id: string;
    name: string;
    createdAt: string;
}

export interface DictionaryArticleResponse {
    id: string;
    themeId: string;
    name: string;
    slug: string;
    contentMarkdown: string;
    authorAdminId: string;
    isPublished: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    tags?: DictionaryTagResponse[] | null;
}

export interface DictionaryCommentResponse {
    id: string;
    articleId: string;
    parentCommentId: string | null;
    userId: string;
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

export function listArticles(): Promise<DictionaryArticleResponse[]> {
    return getJson<DictionaryArticleResponse[]>(`${DICTIONARY}/articles`);
}

export function getArticleBySlug(slug: string): Promise<DictionaryArticleResponse> {
    return getJson<DictionaryArticleResponse>(`${DICTIONARY}/articles/${encodeURIComponent(slug)}`);
}

export function recordArticleView(articleId: string): Promise<void> {
    return postJson<void>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/view`);
}

export function bookmarkArticle(articleId: string): Promise<void> {
    return postJson<void>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/bookmark`);
}

export function unbookmarkArticle(articleId: string): Promise<void> {
    return deleteJson<void>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/bookmark`);
}

export function getInteractionSummary(articleId: string): Promise<DictionaryInteractionSummaryResponse> {
    return getJson<DictionaryInteractionSummaryResponse>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/interactions/summary`);
}

export function getViewStatistics(articleId: string): Promise<DictionaryViewStatisticsResponse> {
    return getJson<DictionaryViewStatisticsResponse>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/views`);
}

export function getArticleComments(articleId: string): Promise<DictionaryCommentResponse[]> {
    return getJson<DictionaryCommentResponse[]>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/comments`);
}

export function createArticleComment(articleId: string, commentText: string): Promise<string> {
    return postJson<string>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/comments`, { commentText });
}

export function replyArticleComment(commentId: string, commentText: string): Promise<string> {
    return postJson<string>(`${DICTIONARY}/comments/${encodeURIComponent(commentId)}/reply`, { commentText });
}

export function voteComment(commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
    return postJson<void>(`${DICTIONARY}/comments/${encodeURIComponent(commentId)}/vote`, { voteType });
}

export function listBookmarkedArticles(): Promise<DictionaryBookmarkArticleResponse[]> {
    return getJson<DictionaryBookmarkArticleResponse[]>(`${DICTIONARY}/users/me/bookmarks`);
}
