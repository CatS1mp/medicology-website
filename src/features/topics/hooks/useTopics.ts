import { useEffect, useMemo, useState } from 'react';
import { Topic, TopicFiltersState } from '../types';
import { getCourses } from '@/shared/api/learning';

function resolveTopicImageUrl(iconFileName: string | null): string {
    if (!iconFileName) {
        return '/images/Others/earth.png';
    }

    // Keep internet URLs intact.
    if (/^https?:\/\//i.test(iconFileName)) {
        return iconFileName;
    }

    return `/images/Icons/${iconFileName}`;
}

export const useTopics = () => {
    const [filters, setFilters] = useState<TopicFiltersState>({
        sortBy: 'Phổ biến nhất',
        level: 'Mọi trình độ',
        category: 'Tất cả',
        courseCount: 'Tất cả'
    });

    const [allTopics, setAllTopics] = useState<Topic[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [page, setPage] = useState(1);
    const limit = 6;

    useEffect(() => {
        let cancelled = false;

        async function fetchThemes() {
            setIsLoading(true);
            try {
                // Backend giờ trả về courses thay vì themes
                const courses = await getCourses();
                console.log('Fetched courses (themes):', courses); // Debug log
                const mapped: Topic[] = courses
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((t) => ({
                        id: t.id,
                        slug: t.slug,
                        title: t.name,
                        description: t.description ?? '',
                        level: 'Cơ bản',
                        category: 'Y học Thường thức',
                        imageUrl: resolveTopicImageUrl(t.iconFileName),
                    }));
                if (!cancelled) setAllTopics(mapped);
            } catch (error) {
                console.error('Error fetching courses:', error); // Debug log
                if (!cancelled) setAllTopics([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchThemes();
        return () => {
            cancelled = true;
        };
    }, []);

    // Simulate API filtering and sorting
    const filteredTopics = useMemo(() => {
        let result = [...allTopics];

        if (filters.level !== 'Mọi trình độ') {
            result = result.filter(t => t.level === filters.level);
        }
        
        if (filters.category !== 'Tất cả') {
            result = result.filter(t => t.category === filters.category);
        }

        if (filters.courseCount !== 'Tất cả') {
            // Only apply when backend provides courseCount.
            if (result.some((t) => typeof t.courseCount === 'number')) {
                if (filters.courseCount === '1-3 khóa học') result = result.filter(t => (t.courseCount ?? 0) >= 1 && (t.courseCount ?? 0) <= 3);
                if (filters.courseCount === '4-7 khóa học') result = result.filter(t => (t.courseCount ?? 0) >= 4 && (t.courseCount ?? 0) <= 7);
                if (filters.courseCount === '+7 khóa học') result = result.filter(t => (t.courseCount ?? 0) > 7);
            }
        }

        if (filters.sortBy === 'Đánh giá cao' && result.some((t) => typeof t.rating === 'number')) {
            result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        }

        return result;
    }, [allTopics, filters]);

    // Simulate pagination
    const totalPages = Math.ceil(filteredTopics.length / limit);
    const paginatedTopics = filteredTopics.slice((page - 1) * limit, page * limit);

    return {
        topics: paginatedTopics,
        filters,
        setFilters: (next: TopicFiltersState) => {
            setFilters(next);
            setPage(1);
        },
        page,
        setPage,
        totalPages,
        totalItems: filteredTopics.length,
        isLoading
    };
};
