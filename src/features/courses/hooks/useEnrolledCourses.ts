import { useEffect, useMemo, useState } from 'react';
import { getCourses, getEnrolledCoursesPaged, getProgress } from '@/shared/api/learning';
import { getMyAttempts } from '@/shared/api/assessment';
import type { MyCourseCardModel } from '../components/MyCourseCard';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';
import { invalidateCachedValue } from '@/shared/api/client-cache';
import { cacheKeys } from '@/shared/api/cache-policy';
import type { AttemptSummaryResponse } from '@/shared/types/assessment';
import type { CourseProgressResponse, CourseResponse } from '@/shared/types/learning';

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

function toClampedPercent(value: unknown): number {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getProgressPercent(progress: CourseProgressResponse | undefined): number {
    if (!progress) return 0;
    const aliases = progress as CourseProgressResponse & {
        completionPercentage?: number;
        completedPercentage?: number;
        progressPercent?: number;
        percentComplete?: number;
    };
    return toClampedPercent(
        aliases.completionPercent ??
        aliases.completionPercentage ??
        aliases.completedPercentage ??
        aliases.progressPercent ??
        aliases.percentComplete
    );
}

function getAttemptCompletionPercent(course: CourseResponse, attempts: AttemptSummaryResponse[]): number {
    const contentIds = (course.sections ?? []).flatMap((section) => (section.contents ?? []).map((content) => content.id));
    if (contentIds.length === 0) return 0;

    const courseContentIds = new Set(contentIds);
    const completedContentIds = new Set(
        attempts
            .filter((attempt) => attempt.status === 'FINALIZED' && attempt.score !== null && courseContentIds.has(attempt.contentId))
            .map((attempt) => attempt.contentId)
    );

    return toClampedPercent((completedContentIds.size * 100) / contentIds.length);
}

async function fetchAndMapCourses(page: number, limit: number): Promise<{ items: EnrolledCourseListItem[]; total: number }> {
    // Always bust the progress cache so we get the latest completion percentages
    invalidateCachedValue(cacheKeys.learning.progress());

    const [enrolledCourses, progress, attempts, allCourses] = await Promise.all([
        getEnrolledCoursesPaged({ page: page - 1, size: limit }),
        getProgress().catch(() => [] as Awaited<ReturnType<typeof getProgress>>),
        getMyAttempts().catch(() => [] as AttemptSummaryResponse[]),
        getCourses().catch(() => [] as CourseResponse[]),
    ]);

    const progressBySlug = new Map(progress.map((item) => [item.courseSlug, item]));
    const progressById = new Map(progress.map((item) => [item.courseId, item]));
    const courseDetailBySlug = new Map(allCourses.map((course) => [course.slug, course]));
    const courseDetailById = new Map(allCourses.map((course) => [course.id, course]));

    const mappedCourses: EnrolledCourseListItem[] = enrolledCourses.items.map((course) => {
        const fullCourse = courseDetailBySlug.get(course.slug) ?? courseDetailById.get(course.id) ?? course;
        const sections = fullCourse.sections ?? course.sections ?? [];
        const lessonCount =
            fullCourse.contentCount ??
            course.contentCount ??
            sections.reduce((sum, section) => sum + (section.contents?.length ?? 0), 0);
        const sectionCount = fullCourse.sectionCount ?? course.sectionCount ?? sections.length;
        const courseProgress = progressBySlug.get(course.slug) ?? progressById.get(course.id);
        const apiPercent = getProgressPercent(courseProgress);
        const attemptPercent = getAttemptCompletionPercent(fullCourse, attempts);
        const completionPercent = Math.max(apiPercent, attemptPercent);

        return {
            id: course.id,
            name: course.name,
            slug: course.slug,
            description: course.description ?? 'Khóa học đang được cá nhân hóa cho hành trình học tập của bạn.',
            iconFileName: resolveCourseIconSrc(course.iconFileName),
            sectionCount,
            lessonCount,
            completionPercent,
            lastStudiedAt: courseProgress?.lastStudiedAt ?? null,
        };
    });

    const result = { items: mappedCourses, total: enrolledCourses.total };
    enrolledCoursesCache.set(page, result);
    return result;
}

export async function preloadEnrolledCourses(page: number, limit: number) {
    // Always re-fetch — don't rely on stale cache for progress
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
            // Show cached data instantly if available
            const cached = enrolledCoursesCache.get(page);
            if (cached) {
                setCourses(cached.items);
                setTotalItems(cached.total);
                setIsLoading(false);
            } else {
                setIsLoading(true);
            }

            // Always re-fetch to get latest progress
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
