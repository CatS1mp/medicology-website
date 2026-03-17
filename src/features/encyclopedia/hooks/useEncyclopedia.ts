import { useState, useEffect, useCallback } from 'react';
import { ArticleSummary, ArticleDetail, SearchFilters } from '../types';
import { searchArticles, mockArticles } from '../data/mockArticles';

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
        if (!filters.query.trim()) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        // Simulate async API call — swap with: fetch(`/api/encyclopedia/search?q=${filters.query}`)
        const timer = setTimeout(() => {
            let data = searchArticles(filters.query);
            if (filters.category !== 'Tất cả') {
                data = data.filter(a => a.category === filters.category);
            }
            setResults(data.slice(0, filters.perPage));
            setIsLoading(false);
        }, 350);
        return () => clearTimeout(timer);
    }, [filters]);

    return { results, filters, setFilters, search, isLoading };
};

// Hook for article detail screen
export const useArticle = (slug: string) => {
    const [article, setArticle] = useState<ArticleDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        setArticle(null);
        // Simulate async API call — swap with: fetch(`/api/encyclopedia/${slug}`)
        const timer = setTimeout(() => {
            setArticle(mockArticles[slug] ?? null);
            setIsLoading(false);
        }, 350);
        return () => clearTimeout(timer);
    }, [slug]);

    return { article, isLoading };
};
