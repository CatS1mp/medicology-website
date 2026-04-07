// Requests go through the local Next.js proxy (/api/dictionary/*)
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

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            return res.json() as Promise<T>;
        }
        return res.text() as unknown as T;
    }

    // Keep error handling local to this feature (no cross-feature imports).
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`Dictionary API error (${res.status}): ${message || res.statusText}`);
}

function withAuth(accessToken?: string): HeadersInit {
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
}

export function listArticles(accessToken?: string): Promise<DictionaryArticleResponse[]> {
    return fetch(`${DICTIONARY}/articles`, {
        method: 'GET',
        headers: withAuth(accessToken),
    }).then((res) => handleResponse<DictionaryArticleResponse[]>(res));
}

export function getArticleBySlug(slug: string, accessToken?: string): Promise<DictionaryArticleResponse> {
    return fetch(`${DICTIONARY}/articles/${encodeURIComponent(slug)}`, {
        method: 'GET',
        headers: withAuth(accessToken),
    }).then((res) => handleResponse<DictionaryArticleResponse>(res));
}
