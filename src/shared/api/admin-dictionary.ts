import { buildHeaders, requestApi, unwrapSpringData } from '@/shared/api/http';
import type { DictionaryArticleResponse, DictionaryTagResponse } from '@/features/encyclopedia/api';

const DICTIONARY = '/api/dictionary';

export async function adminListArticles(): Promise<DictionaryArticleResponse[]> {
    const rawBody = await requestApi<unknown>(
        `${DICTIONARY}/articles`,
        { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
        { unwrapData: false }
    );
    const data = unwrapSpringData<unknown>(rawBody);
    return Array.isArray(data) ? (data as DictionaryArticleResponse[]) : [];
}

export async function adminListTags(): Promise<DictionaryTagResponse[]> {
    try {
        const rawBody = await requestApi<unknown>(
            `${DICTIONARY}/tags`,
            { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
            { unwrapData: false }
        );
        const data = unwrapSpringData<unknown>(rawBody);
        return Array.isArray(data) ? (data as DictionaryTagResponse[]) : [];
    } catch {
        return [];
    }
}

export async function adminCreateArticle(body: {
    themeId: string;
    name: string;
    slug: string;
    contentMarkdown: string;
    authorAdminId?: string;
    isPublished?: boolean;
}): Promise<DictionaryArticleResponse> {
    return requestApi<DictionaryArticleResponse>(`${DICTIONARY}/articles`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body),
    });
}

export async function adminUpdateArticle(
    articleId: string,
    body: Partial<{
        themeId: string;
        name: string;
        slug: string;
        contentMarkdown: string;
        isPublished: boolean;
    }>
): Promise<DictionaryArticleResponse> {
    return requestApi<DictionaryArticleResponse>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(body),
    });
}

export async function adminDeleteArticle(articleId: string): Promise<void> {
    await requestApi<void>(
        `${DICTIONARY}/articles/${encodeURIComponent(articleId)}`,
        {
            method: 'DELETE',
            headers: buildHeaders({ includeJsonContentType: false }),
        },
        { unwrapData: false }
    );
}

export async function adminPublishArticle(articleId: string, publish: boolean): Promise<DictionaryArticleResponse> {
    return requestApi<DictionaryArticleResponse>(
        `${DICTIONARY}/articles/${encodeURIComponent(articleId)}/publish`,
        {
            method: 'PATCH',
            headers: buildHeaders(),
            body: JSON.stringify({ publish }),
        }
    );
}
