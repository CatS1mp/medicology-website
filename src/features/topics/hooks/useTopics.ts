import { useEffect, useMemo, useState } from 'react';
import { Topic, TopicFiltersState } from '../types';
import { enrollCourse, getAvailableStudentCoursesPaged } from '@/shared/api/learning';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';

export const useTopics = () => {
    const [filters, setFilters] = useState<TopicFiltersState>({
        sortBy: 'Phổ biến nhất',
        level: 'Mọi trình độ',
        category: 'Tất cả',
        courseCount: 'Tất cả'
    });

    const [allTopics, setAllTopics] = useState<Topic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingTopicId, setEnrollingTopicId] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    const [page, setPage] = useState(1);
    const limit = 6;

    useEffect(() => {
        let cancelled = false;

        async function fetchThemes() {
            setIsLoading(true);
            try {
                const themes = await getAvailableStudentCoursesPaged({ page: page - 1, size: limit });
                const mapped: Topic[] = themes
                    .items.slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((t) => {
                        const sectionCount =
                            t.sectionCount ??
                            t.sections?.length ??
                            0;
                        const lessonCount =
                            t.contentCount ??
                            (t.sections?.reduce((sum, s) => sum + (s.contents?.length ?? 0), 0) ?? 0);
                        return {
                            id: t.id,
                            slug: t.slug,
                            title: t.name,
                            description: t.description ?? '',
                            level: 'Cơ bản',
                            category: 'Y học Thường thức',
                            sectionCount,
                            lessonCount,
                            courseCount: lessonCount,
                            imageUrl: resolveCourseIconSrc(t.iconFileName),
                        };
                    });
                if (!cancelled) setAllTopics(mapped);
                if (!cancelled) setTotalItems(themes.total);
            } catch {
                if (!cancelled) {
                    setAllTopics([]);
                    setTotalItems(0);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchThemes();
        return () => {
            cancelled = true;
        };
    }, [page]);

    const filteredTopics = useMemo(() => {
        let result = [...allTopics];

        if (filters.level !== 'Mọi trình độ') {
            result = result.filter(t => t.level === filters.level);
        }
        
        if (filters.category !== 'Tất cả') {
            result = result.filter(t => t.category === filters.category);
        }

        if (filters.courseCount !== 'Tất cả') {
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

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const paginatedTopics = filteredTopics;

    async function handleEnroll(topicId: string) {
        if (enrollingTopicId) return;

        setEnrollingTopicId(topicId);
        try {
            await enrollCourse(topicId);
            setAllTopics((current) => current.filter((topic) => topic.id !== topicId));
        } finally {
            setEnrollingTopicId(null);
        }
    }

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
        totalItems,
        isLoading,
        enrollingTopicId,
        enrollTopic: handleEnroll,
    };
};
