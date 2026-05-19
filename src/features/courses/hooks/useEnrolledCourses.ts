import { useEffect, useMemo, useState } from 'react';
import { getMyAttempts } from '@/shared/api/assessment';
import { getCourses, getEnrolledCoursesPaged, getProgress } from '@/shared/api/learning';
import type { MyCourseCardModel } from '../components/MyCourseCard';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';
import { getCachedValue, setCachedValue } from '@/shared/api/client-cache';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';
import type { AttemptSummaryResponse } from '@/shared/types/assessment';
import type { LearningProgressChangedDetail } from '@/shared/api/learning';
import type { CourseProgressResponse, CourseResponse } from '@/shared/types/learning';
import { useUserStore } from '@/shared/store/useUserStore';
import { getCourseAttemptProgressData, getProgressPercent, toClampedPercent } from '@/shared/utils/learning-progress';

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
    completedContentIds?: string[];
}

export const enrolledCoursesCache = new Map<number, { items: EnrolledCourseListItem[]; total: number }>();

export function clearEnrolledCoursesCache() {
    enrolledCoursesCache.clear();
}

function mapCourseToEnrolledListItem(
    course: CourseResponse,
    attempts: AttemptSummaryResponse[] = [],
    progress?: CourseProgressResponse
): EnrolledCourseListItem {
    const sections = course.sections ?? [];
    const lessonCount =
        course.contentCount ??
        sections.reduce((sum, section) => sum + (section.contents?.length ?? 0), 0);
    const sectionCount = course.sectionCount ?? sections.length;
    const courseAttemptData = getCourseAttemptProgressData(course, attempts);

    return {
        id: course.id,
        name: course.name,
        slug: course.slug,
        description: course.description ?? 'Khóa học đang được cá nhân hóa cho hành trình học tập của bạn.',
        iconFileName: resolveCourseIconSrc(course.iconFileName),
        sectionCount,
        lessonCount,
        completionPercent: courseAttemptData.completionPercent ?? getProgressPercent(progress),
        lastStudiedAt: courseAttemptData.lastStudiedAt ?? progress?.lastStudiedAt ?? null,
        completedContentIds: courseAttemptData.completedContentIds,
    };
}

function mapCoursesToEnrolledListItems(
    courses: CourseResponse[],
    limit: number,
    attempts: AttemptSummaryResponse[] = [],
    progress: CourseProgressResponse[] = []
): EnrolledCourseListItem[] {
    const progressBySlug = new Map(progress.map((item) => [item.courseSlug, item]));
    const progressById = new Map(progress.map((item) => [item.courseId, item]));
    return courses
        .map((course) => mapCourseToEnrolledListItem(course, attempts, progressBySlug.get(course.slug) ?? progressById.get(course.id)))
        .sort(sortEnrolledCourses)
        .slice(0, limit);
}

export function addEnrolledCourseToCache(course: CourseResponse) {
    const firstPage = enrolledCoursesCache.get(1);
    const nextItem = mapCourseToEnrolledListItem(course);

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

function sortEnrolledCourses(a: EnrolledCourseListItem, b: EnrolledCourseListItem) {
    const aCompleted = a.completionPercent >= 100;
    const bCompleted = b.completionPercent >= 100;
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    if (!aCompleted && a.completionPercent !== b.completionPercent) {
        return b.completionPercent - a.completionPercent;
    }
    return 0;
}

function patchCourseProgressFromCompletedAttempt(
    courses: EnrolledCourseListItem[],
    detail: LearningProgressChangedDetail | undefined
): EnrolledCourseListItem[] | null {
    if (!detail?.courseSlug || !detail.contentId) return null;
    if (detail.resultStatus !== 'FINAL' && detail.attemptStatus !== 'FINALIZED') return null;

    let didPatch = false;
    const patched = courses.map((course) => {
        if (course.slug !== detail.courseSlug) return course;

        const completedContentIds = new Set(course.completedContentIds ?? []);
        const wasAlreadyCompleted = completedContentIds.has(detail.contentId!);
        if (detail.passed === true) {
            completedContentIds.add(detail.contentId!);
        }

        const lessonCount = Math.max(1, course.lessonCount);
        const completionPercent = detail.passed !== true || wasAlreadyCompleted
            ? course.completionPercent
            : toClampedPercent(course.completionPercent + (100 / lessonCount));

        didPatch = true;
        return {
            ...course,
            completionPercent,
            lastStudiedAt: detail.completedAt ?? course.lastStudiedAt,
            completedContentIds: [...completedContentIds],
        };
    }).sort(sortEnrolledCourses);

    return didPatch ? patched : null;
}

function patchProgressCacheFromCourse(course: EnrolledCourseListItem, detail: LearningProgressChangedDetail) {
    const cachedProgress = getCachedValue<CourseProgressResponse[]>(cacheKeys.learning.progress());
    if (!cachedProgress) return;

    const nextProgress = cachedProgress.map((progress) => {
        if (progress.courseSlug !== course.slug && progress.courseId !== course.id) {
            return progress;
        }

        return {
            ...progress,
            completionPercent: course.completionPercent,
            lastStudiedAt: detail.completedAt ?? progress.lastStudiedAt,
        };
    });

    setCachedValue(cacheKeys.learning.progress(), nextProgress, CACHE_TTL.SHORT);
}

export function patchEnrolledCoursesCache(detail: LearningProgressChangedDetail | undefined) {
    if (!detail) return false;
    let didPatch = false;
    for (const [page, cached] of enrolledCoursesCache.entries()) {
        const patchedItems = patchCourseProgressFromCompletedAttempt(cached.items, detail);
        if (patchedItems) {
            enrolledCoursesCache.set(page, { ...cached, items: patchedItems });
            const patchedCourse = patchedItems.find((course) => course.slug === detail.courseSlug);
            if (patchedCourse) {
                patchProgressCacheFromCourse(patchedCourse, detail);
            }
            didPatch = true;
        }
    }
    return didPatch;
}

async function fetchAndMapCourses(page: number, limit: number): Promise<{ items: EnrolledCourseListItem[]; total: number }> {
    const storeCourses = useUserStore.getState().courses;
    const [enrolledCourses, progress, attempts, allCourses] = await Promise.all([
        getEnrolledCoursesPaged({ page: page - 1, size: limit }),
        getProgress().catch(() => [] as Awaited<ReturnType<typeof getProgress>>),
        getMyAttempts().catch(() => [] as Awaited<ReturnType<typeof getMyAttempts>>),
        storeCourses.length > 0 ? Promise.resolve(storeCourses) : getCourses().catch(() => [] as CourseResponse[]),
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
        const courseAttemptData = getCourseAttemptProgressData(fullCourse, attempts);

        return {
            id: course.id,
            name: course.name,
            slug: course.slug,
            description: course.description ?? 'Khóa học đang được cá nhân hóa cho hành trình học tập của bạn.',
            iconFileName: resolveCourseIconSrc(course.iconFileName),
            sectionCount,
            lessonCount,
            completionPercent: courseAttemptData.completionPercent ?? getProgressPercent(courseProgress),
            lastStudiedAt: courseAttemptData.lastStudiedAt ?? courseProgress?.lastStudiedAt ?? null,
            completedContentIds: courseAttemptData.completedContentIds,
        };
    }).sort(sortEnrolledCourses);

    const result = { items: mappedCourses, total: enrolledCourses.total };
    enrolledCoursesCache.set(page, result);
    useUserStore.getState().setLearningProgressData(progress, attempts);
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
    const storeCourses = useUserStore((state) => state.courses);
    const storeProgress = useUserStore((state) => state.courseProgress);
    const storeAttempts = useUserStore((state) => state.attempts);
    const initialStoreCourses = useUserStore.getState().courses;
    const initialStoreProgress = useUserStore.getState().courseProgress;
    const initialStoreAttempts = useUserStore.getState().attempts;
    const initialCachedCourses = enrolledCoursesCache.get(1);
    const initialCourses =
        initialCachedCourses?.items ??
        mapCoursesToEnrolledListItems(initialStoreCourses, limit, initialStoreAttempts, initialStoreProgress);
    const initialTotalItems = initialCachedCourses?.total ?? initialStoreCourses.length;

    const [courses, setCourses] = useState<EnrolledCourseListItem[]>(() => initialCourses);
    const [totalItems, setTotalItems] = useState(() => initialTotalItems);
    const [isLoading, setIsLoading] = useState(() => initialCourses.length === 0);

    useEffect(() => {
        let cancelled = false;

        async function fetchEnrolledCourses() {
            // Show cached data instantly if available
            const cached = enrolledCoursesCache.get(page);
            if (cached) {
                setCourses(cached.items);
                setTotalItems(cached.total);
                setIsLoading(false);
            } else if (courses.length === 0) {
                setIsLoading(true);
            } else {
                setIsLoading(false);
            }

            // Always re-fetch to get latest progress
            try {
                const fresh = await fetchAndMapCourses(page, limit);
                if (!cancelled) {
                    setCourses(fresh.items);
                    setTotalItems(fresh.total);
                }
            } catch {
                if (!cancelled && !cached && courses.length === 0) {
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
    }, [courses.length, page]);

    useEffect(() => {
        function handleProgressChanged(event: Event) {
            const detail = event instanceof CustomEvent ? event.detail as LearningProgressChangedDetail | undefined : undefined;
            const patchedCache = patchEnrolledCoursesCache(detail);
            let patchedCurrent = false;
            setCourses((currentCourses) => {
                const patched = patchCourseProgressFromCompletedAttempt(currentCourses, detail);
                if (!patched) return currentCourses;
                patchedCurrent = true;
                return patched;
            });

            if (patchedCurrent || patchedCache) {
                setIsLoading(false);
                return;
            }

            if (courses.length === 0) {
                setIsLoading(true);
            }
            void fetchAndMapCourses(page, limit)
                .then((fresh) => {
                    setCourses(fresh.items);
                    setTotalItems(fresh.total);
                })
                .catch(() => undefined)
                .finally(() => setIsLoading(false));
        }

        window.addEventListener('learning:progress-changed', handleProgressChanged);
        window.addEventListener('learning:courses-changed', handleProgressChanged);
        return () => {
            window.removeEventListener('learning:progress-changed', handleProgressChanged);
            window.removeEventListener('learning:courses-changed', handleProgressChanged);
        };
    }, [courses.length, page]);

    const displayCourses = useMemo(
        () => courses.length > 0
            ? courses
            : page === 1
                ? mapCoursesToEnrolledListItems(storeCourses, limit, storeAttempts, storeProgress)
                : [],
        [courses, page, storeAttempts, storeCourses, storeProgress]
    );
    const displayTotalItems = totalItems > 0 ? totalItems : storeCourses.length;
    const displayIsLoading = isLoading && displayCourses.length === 0;
    const totalPages = Math.max(1, Math.ceil(displayTotalItems / limit));

    const cards = useMemo<MyCourseCardModel[]>(
        () =>
            displayCourses.map((course) => ({
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
        [displayCourses]
    );

    return {
        courses: cards,
        isLoading: displayIsLoading,
        page,
        setPage,
        totalPages,
        totalItems: displayTotalItems,
    };
}
