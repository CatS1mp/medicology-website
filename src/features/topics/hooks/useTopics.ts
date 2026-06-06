import { useEffect, useState } from 'react';
import { Topic } from '../types';
import { enrollCourse, getAvailableStudentCoursesPaged } from '@/shared/api/learning';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';
import { addEnrolledCourseToCache } from '@/features/courses/hooks/useEnrolledCourses';
import { useUserStore } from '@/shared/store/useUserStore';

const topicsCache = new Map<number, { items: Topic[], total: number }>();

export function clearTopicsCache() {
    topicsCache.clear();
}

export const useTopics = () => {
    const [page, setPage] = useState(1);
    const limit = 6;

    const [allTopics, setAllTopics] = useState<Topic[]>(() => topicsCache.get(page)?.items || []);
    const [isLoading, setIsLoading] = useState(() => !topicsCache.has(page));
    const [enrollingTopicId, setEnrollingTopicId] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(() => topicsCache.get(page)?.total || 0);

    useEffect(() => {
        let cancelled = false;

        async function fetchThemes() {
            if (topicsCache.has(page)) {
                const cached = topicsCache.get(page)!;
                setAllTopics(cached.items);
                setTotalItems(cached.total);
                setIsLoading(false);
            } else {
                setIsLoading(true);
            }

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
                if (!cancelled) {
                    setAllTopics(mapped);
                    setTotalItems(themes.total);
                    topicsCache.set(page, { items: mapped, total: themes.total });
                }
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

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const paginatedTopics = allTopics;

    async function handleEnroll(topicId: string) {
        if (enrollingTopicId) return;

        setEnrollingTopicId(topicId);
        try {
            const enrolledCourse = await enrollCourse(topicId);
            addEnrolledCourseToCache(enrolledCourse);
            useUserStore.getState().addEnrolledCourse(enrolledCourse);
            setAllTopics((current) => current.filter((topic) => topic.id !== topicId));
            topicsCache.forEach((cached, cachePage) => {
                topicsCache.set(cachePage, {
                    items: cached.items.filter((topic) => topic.id !== topicId),
                    total: Math.max(0, cached.total - 1),
                });
            });
        } finally {
            setEnrollingTopicId(null);
        }
    }

    return {
        topics: paginatedTopics,
        page,
        setPage,
        totalPages,
        totalItems,
        isLoading,
        enrollingTopicId,
        enrollTopic: handleEnroll,
    };
};
