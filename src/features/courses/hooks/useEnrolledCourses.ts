import { useEffect, useMemo, useState } from 'react';
import { getEnrolledCoursesPaged, getProgress } from '@/shared/api/learning';
import type { MyCourseCardModel } from '../components/MyCourseCard';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';
import { invalidateCachedValue } from '@/shared/api/client-cache';
import { cacheKeys } from '@/shared/api/cache-policy';
import type { CourseProgressResponse } from '@/shared/types/learning';

interface EnrolledCourseListItem {
    id: string;
    name: string;
    slug: string;
    description: string;
    iconFileName: string;
    sectionCount: number;
    lessonCount: number;
    completionPercent: number;
    lastStudiedAt: string | null;
}

export const enrolledCoursesCache = new Map<number, { items: EnrolledCourseListItem[]; total: number }>();

export function clearEnrolledCoursesCache() {
    enrolledCoursesCache.clear();
}

export function addEnrolledCourseToCache(course: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    iconFileName?: string | null;
    sectionCount?: number | null;
    contentCount?: number | null;
    sections?: unknown[] | null;
}) {
    const firstPage = enrolledCoursesCache.get(1);
    const nextItem: EnrolledCourseListItem = {
        id: course.id,
        name: course.name,
        slug: course.slug,
        description: course.description ?? 'Khóa học đang được cá nhân hóa cho hành trình học tập của bạn.',
        iconFileName: resolveCourseIconSrc(course.iconFileName),
        sectionCount: course.sectionCount ?? course.sections?.length ?? 0,
        lessonCount: course.contentCount ?? 0,
        completionPercent: 0,
        lastStudiedAt: null,
    };

    if (!firstPage) {
        enrolledCoursesCache.set(1, { items: [nextItem], total: 1 });
        return;
    }

    if (firstPage.items.some((item) => item.id === course.id || item.slug === course.slug)) {
        return;
    }

    enrolledCoursesCache.set(1, {
        items: [nextItem, ...firstPage.items].slice(0, 6),
        total: firstPage.total + 1,
    });
}

function toClampedPercent(value: unknown): number {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

async function fetchAndMapCourses(page: number, limit: number): Promise<{ items: EnrolledCourseListItem[]; total: number }> {
    invalidateCachedValue(cacheKeys.learning.progress());

    const [enrolledCourses, progress] = await Promise.all([
        getEnrolledCoursesPaged({ page: page - 1, size: limit }),
        getProgress().catch(() => [] as CourseProgressResponse[]),
    ]);

    const progressBySlug = new Map(progress.map((item) => [item.courseSlug, item]));
    const progressById = new Map(progress.map((item) => [item.courseId, item]));

    const mappedCourses: EnrolledCourseListItem[] = enrolledCourses.items.map((course) => {
        const courseProgress = progressBySlug.get(course.slug) ?? progressById.get(course.id);

        return {
            id: course.id,
            name: course.name,
            slug: course.slug,
            description: course.description ?? 'Khóa học đang được cá nhân hóa cho hành trình học tập của bạn.',
            iconFileName: resolveCourseIconSrc(course.iconFileName),
            sectionCount: course.sectionCount ?? course.sections?.length ?? 0,
            lessonCount: course.contentCount ?? 0,
            completionPercent: toClampedPercent(courseProgress?.completionPercent ?? 0),
            lastStudiedAt: courseProgress?.lastStudiedAt ?? null,
        };
    });

    const result = { items: mappedCourses, total: enrolledCourses.total };
    enrolledCoursesCache.set(page, result);
    return result;
}

export async function preloadEnrolledCourses(page: number, limit: number) {
    try {
        await fetchAndMapCourses(page, limit);
    } catch {
        // fail silently for preload
    }
}

export function useEnrolledCourses() {
    const [page, setPage] = useState(1);
    const limit = 6;

    const [courses, setCourses] = useState<EnrolledCourseListItem[]>(() => enrolledCoursesCache.get(1)?.items ?? []);
    const [totalItems, setTotalItems] = useState(() => enrolledCoursesCache.get(1)?.total ?? 0);
    const [isLoading, setIsLoading] = useState(() => !enrolledCoursesCache.has(1));

    useEffect(() => {
        let cancelled = false;

        async function fetchEnrolledCourses() {
            const cached = enrolledCoursesCache.get(page);
            if (cached) {
                setCourses(cached.items);
                setTotalItems(cached.total);
                setIsLoading(false);
            } else {
                setIsLoading(true);
            }

            try {
                const fresh = await fetchAndMapCourses(page, limit);
                if (!cancelled) {
                    setCourses(fresh.items);
                    setTotalItems(fresh.total);
                }
            } catch {
                if (!cancelled && !cached) {
                    setCourses([]);
                    setTotalItems(0);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchEnrolledCourses();
        return () => {
            cancelled = true;
        };
    }, [page]);

    useEffect(() => {
        function handleProgressChanged() {
            clearEnrolledCoursesCache();
            setIsLoading(true);
            void fetchAndMapCourses(page, limit)
                .then((fresh) => {
                    setCourses(fresh.items);
                    setTotalItems(fresh.total);
                })
                .catch(() => undefined)
                .finally(() => setIsLoading(false));
        }

        window.addEventListener('learning:progress-changed', handleProgressChanged);
        return () => window.removeEventListener('learning:progress-changed', handleProgressChanged);
    }, [page]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    const cards = useMemo<MyCourseCardModel[]>(
        () =>
            courses.map((course) => ({
                id: course.id,
                slug: course.slug,
                title: course.name,
                description: course.description ?? '',
                imageUrl: course.iconFileName,
                sectionCount: course.sectionCount ?? 0,
                lessonCount: course.lessonCount ?? 0,
                completionPercent: course.completionPercent ?? 0,
                lastStudiedAt: course.lastStudiedAt ?? null,
            })),
        [courses]
    );

    return {
        courses: cards,
        isLoading,
        page,
        setPage,
        totalPages,
        totalItems,
    };
}
