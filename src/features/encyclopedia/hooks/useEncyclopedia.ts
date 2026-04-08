import { useState, useEffect, useCallback } from 'react';
import { ArticleSummary, ArticleDetail, ArticleCategory, SearchFilters, ArticleComment } from '../types';
import {
    DictionaryArticleResponse,
    DictionaryCommentResponse,
    getArticleBySlug,
    getArticleComments,
    getInteractionSummary,
    getViewStatistics,
    listArticles,
    recordArticleView,
} from '../api';

function stripMarkdown(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[#>*_~\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function estimateReadTimeMin(text: string): number {
    // Roughly 200 wpm. Keep a minimum of 3 minutes for UI consistency.
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.ceil(words / 200));
}

function guessCategory(tags: DictionaryArticleResponse['tags']): ArticleCategory {
    const tagText = (tags ?? []).map(t => t.name.toLowerCase());
    const has = (needle: string) => tagText.some(t => t.includes(needle));

    if (has('tim') || has('mạch')) return 'Tim mạch';
    if (has('cấp cứu') || has('cap cuu')) return 'Cấp cứu';
    if (has('tâm thần') || has('tam than') || has('tâm lý') || has('tam ly')) return 'Sức khỏe Tâm thần';
    if (has('dinh dưỡng') || has('dinh duong')) return 'Dinh dưỡng';
    if (has('sơ cứu') || has('so cuu') || has('cpr')) return 'Sơ cứu';
    return 'Y học Thường thức';
}

function toSummary(a: DictionaryArticleResponse): ArticleSummary {
    const plain = stripMarkdown(a.contentMarkdown ?? '');
    const excerpt = plain.slice(0, 220);
    const tags = (a.tags ?? [])?.map(t => ({ label: t.name, slug: t.id })) ?? [];
    const publishedAt = (a.publishedAt ?? a.createdAt ?? new Date().toISOString()).slice(0, 10);
    const category = guessCategory(a.tags);

    return {
        id: a.id,
        slug: a.slug,
        title: a.name,
        subtitle: 'BÀI VIẾT · MEDICOLOGY',
        excerpt,
        category,
        tags,
        viewCount: 0,
        readTimeMin: estimateReadTimeMin(plain),
        publishedAt,
    };
}

function mapComment(comment: DictionaryCommentResponse): ArticleComment {
    return {
        id: comment.id,
        userId: comment.userId,
        text: comment.commentText,
        createdAt: comment.createdAt,
        replies: (comment.replies ?? []).map(mapComment),
    };
}

function toDetail(
    a: DictionaryArticleResponse,
    all: ArticleSummary[],
    interactionSummary?: { totalViews: number; totalBookmarks: number; totalComments: number },
    lastViewed?: string,
    comments?: DictionaryCommentResponse[]
): ArticleDetail {
    const summary = toSummary(a);
    const content = (a.contentMarkdown ?? '').replace(/^\s*#\s+.*\n+/, '').trim();

    const relatedArticles = all
        .filter(x => x.slug !== summary.slug)
        .slice(0, 5);

    return {
        ...summary,
        viewCount: interactionSummary?.totalViews ?? summary.viewCount,
        lastViewed,
        tableOfContents: [],
        sections: [
            {
                id: 'noi-dung',
                heading: summary.title,
                content,
            },
        ],
        relatedArticles,
        interactionSummary,
        comments: (comments ?? []).map(mapComment),
        isBookmarked: false,
    };
}

// Hook for search screen - replaces all mock logic with an API call later
export const useEncyclopediaSearch = (initialQuery = '') => {
    const [filters, setFilters] = useState<SearchFilters>({
        query: initialQuery,
        category: 'Tất cả',
        sortBy: 'Phù hợp nhất',
        perPage: 3,
    });
    const [results, setResults] = useState<ArticleSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const search = useCallback((query: string) => {
        setFilters(f => ({ ...f, query }));
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!filters.query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const articles = await listArticles();
                const q = filters.query.toLowerCase().trim();
                let data = articles
                    .filter(a => a.isPublished)
                    .map(toSummary)
                    .filter(a =>
                        a.title.toLowerCase().includes(q) ||
                        a.excerpt.toLowerCase().includes(q) ||
                        a.tags.some(t => t.label.toLowerCase().includes(q))
                    );

                if (filters.category !== 'Tất cả') {
                    data = data.filter(a => a.category === filters.category);
                }

                if (filters.sortBy === 'Mới nhất') {
                    data = [...data].sort((a, b) => (b.publishedAt > a.publishedAt ? 1 : -1));
                }

                if (!cancelled) {
                    setResults(data.slice(0, filters.perPage));
                }
            } catch {
                if (!cancelled) setResults([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [filters]);

    return { results, filters, setFilters, search, isLoading };
};

// Hook for article detail screen
export const useArticle = (slug: string) => {
    const [article, setArticle] = useState<ArticleDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setArticle(null);

        async function run() {
            try {
                const [a, list] = await Promise.all([
                    getArticleBySlug(slug),
                    listArticles(),
                ]);

                void recordArticleView(a.id).catch(() => undefined);
                const [summary, viewStats, comments] = await Promise.all([
                    getInteractionSummary(a.id).catch(() => null),
                    getViewStatistics(a.id).catch(() => null),
                    getArticleComments(a.id).catch(() => []),
                ]);

                const summaries = list.filter(x => x.isPublished).map(toSummary);
                const detail = toDetail(
                    a,
                    summaries,
                    summary
                        ? {
                            totalViews: summary.totalViews,
                            totalBookmarks: summary.totalBookmarks,
                            totalComments: summary.totalComments,
                        }
                        : undefined,
                    viewStats?.lastViewedAt
                        ? new Date(viewStats.lastViewedAt).toLocaleString('vi-VN')
                        : undefined,
                    comments
                );
                if (!cancelled) setArticle(detail);
            } catch {
                if (!cancelled) setArticle(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    return { article, isLoading };
};
