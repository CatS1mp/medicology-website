import { buildHeaders, requestApi, unwrapSpringData } from '@/shared/api/http';
import type {
    DictionaryArticleResponse,
    DictionaryArticleTemplateResponse,
    DictionaryComponentDefinitionResponse,
    DictionaryTagResponse,
} from '@/features/encyclopedia/api';
import { cachedGet, mutateAndInvalidate } from '@/shared/api/cached-request';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';

const DICTIONARY = '/api/dictionary';

export async function adminListArticles(): Promise<DictionaryArticleResponse[]> {
    return cachedGet(cacheKeys.admin.dictionaryArticles(), CACHE_TTL.SHORT, async () => {
        const rawBody = await requestApi<unknown>(
            `${DICTIONARY}/articles`,
            { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
            { unwrapData: false }
        );
        const data = unwrapSpringData<unknown>(rawBody);
        return Array.isArray(data) ? (data as DictionaryArticleResponse[]) : [];
    });
}

export async function adminListTags(): Promise<DictionaryTagResponse[]> {
    return cachedGet(cacheKeys.admin.dictionaryTags(), CACHE_TTL.LONG, async () => {
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
    });
}

export async function adminCreateArticle(body: {
    name: string;
    slug: string;
    contentJson: string;
    contentVersion?: number;
    contentMarkdown?: string;
    authorAdminId?: string;
}): Promise<string> {
    return mutateAndInvalidate(
        () =>
            requestApi<string>(`${DICTIONARY}/articles`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.dictionaryPrefix(), cacheKeys.dictionary.articles()]
    );
}

export async function adminUpdateArticle(
    articleId: string,
    body: Partial<{
        name: string;
        slug: string;
        contentJson: string;
        contentVersion: number;
        contentMarkdown: string;
    }>
): Promise<void> {
    return mutateAndInvalidate(
        () =>
            requestApi<void>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}`, {
                method: 'PUT',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.dictionaryPrefix(), cacheKeys.dictionary.articles(), cacheKeys.dictionary.articlePrefix()]
    );
}

export async function adminDeleteArticle(articleId: string): Promise<void> {
    await mutateAndInvalidate(
        () =>
            requestApi<void>(
                `${DICTIONARY}/articles/${encodeURIComponent(articleId)}`,
                {
                    method: 'DELETE',
                    headers: buildHeaders({ includeJsonContentType: false }),
                },
                { unwrapData: false }
            ),
        [],
        [cacheKeys.admin.dictionaryPrefix(), cacheKeys.dictionary.articles(), cacheKeys.dictionary.articlePrefix()]
    );
}

export async function adminGetArticleById(articleId: string): Promise<DictionaryArticleResponse> {
    return cachedGet(cacheKeys.admin.dictionaryArticleDetail(articleId), CACHE_TTL.SHORT, async () => {
        try {
            const rawBody = await requestApi<unknown>(
                `${DICTIONARY}/articles/id/${encodeURIComponent(articleId)}`,
                { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
                { unwrapData: false }
            );
            return unwrapSpringData<DictionaryArticleResponse>(rawBody);
        } catch (error) {
            const articles = await adminListArticles();
            const matched = articles.find((article) => article.id === articleId);
            if (matched) {
                return matched;
            }
            throw error;
        }
    });
}

export async function adminListTemplates(activeOnly = true): Promise<DictionaryArticleTemplateResponse[]> {
    return cachedGet(cacheKeys.admin.dictionaryTemplates(activeOnly), CACHE_TTL.LONG, async () => {
        const rawBody = await requestApi<unknown>(
            `${DICTIONARY}/templates?activeOnly=${activeOnly}`,
            { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
            { unwrapData: false }
        );
        const data = unwrapSpringData<unknown>(rawBody);
        return Array.isArray(data) ? (data as DictionaryArticleTemplateResponse[]) : [];
    });
}

export async function adminListComponents(activeOnly = true): Promise<DictionaryComponentDefinitionResponse[]> {
    return cachedGet(cacheKeys.admin.dictionaryComponents(activeOnly), CACHE_TTL.LONG, async () => {
        const rawBody = await requestApi<unknown>(
            `${DICTIONARY}/components?activeOnly=${activeOnly}`,
            { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
            { unwrapData: false }
        );
        const data = unwrapSpringData<unknown>(rawBody);
        return Array.isArray(data) ? (data as DictionaryComponentDefinitionResponse[]) : [];
    });
}

export async function adminAssignArticleTags(articleId: string, tagIds: string[]): Promise<void> {
    await mutateAndInvalidate(
        () =>
            requestApi<void>(`${DICTIONARY}/articles/${encodeURIComponent(articleId)}/tags`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(tagIds),
            }),
        [],
        [cacheKeys.admin.dictionaryPrefix(), cacheKeys.dictionary.articlePrefix()]
    );
}

export async function adminPublishArticle(articleId: string): Promise<void> {
    return mutateAndInvalidate(
        () =>
            requestApi<void>(
                `${DICTIONARY}/articles/${encodeURIComponent(articleId)}/publish`,
                {
                    method: 'POST',
                    headers: buildHeaders({ includeJsonContentType: false }),
                }
            ),
        [],
        [cacheKeys.admin.dictionaryPrefix(), cacheKeys.dictionary.articles(), cacheKeys.dictionary.articlePrefix()]
    );
}

export async function adminUnpublishArticle(articleId: string): Promise<void> {
    return mutateAndInvalidate(
        () =>
            requestApi<void>(
                `${DICTIONARY}/articles/${encodeURIComponent(articleId)}/unpublish`,
                {
                    method: 'PATCH',
                    headers: buildHeaders({ includeJsonContentType: false }),
                }
            ),
        [],
        [cacheKeys.admin.dictionaryPrefix(), cacheKeys.dictionary.articles(), cacheKeys.dictionary.articlePrefix()]
    );
}
