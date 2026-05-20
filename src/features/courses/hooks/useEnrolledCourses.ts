import { useEffect, useMemo, useState } from 'react';
import { getMyAttempts } from '@/shared/api/assessment';
import { getEnrolledCoursesPaged, getProgress } from '@/shared/api/learning';
import type { MyCourseCardModel } from '../components/MyCourseCard';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';
import type { AttemptSummaryResponse } from '@/shared/types/assessment';
import type { LearningProgressChangedDetail } from '@/shared/api/learning';
import type { CourseProgressResponse, CourseResponse } from '@/shared/types/learning';
import { useUserStore } from '@/shared/store/useUserStore';
import { getCourseAttemptProgressData, getProgressPercent } from '@/shared/utils/learning-progress';

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

function sortEnrolledCourses(a: EnrolledCourseListItem, b: EnrolledCourseListItem) {
    const aCompleted = a.completionPercent >= 100;
    const bCompleted = b.completionPercent >= 100;
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    if (!aCompleted && a.completionPercent !== b.completionPercent) {
        return b.completionPercent - a.completionPercent;
    }
    return 0;
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
    const { attempts, courseProgress } = useUserStore.getState();
    const nextItem = mapCoursesToEnrolledListItems([course], 1, attempts, courseProgress)[0];

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

function getStoreMappedPage(limit: number) {
    const { courses, attempts, courseProgress } = useUserStore.getState();
    return {
        items: mapCoursesToEnrolledListItems(courses, limit, attempts, courseProgress),
        total: courses.length,
    };
}

async function fetchAndMapCourses(page: number, limit: number): Promise<{ items: EnrolledCourseListItem[]; total: number }> {
    const storeCourses = useUserStore.getState().courses;
    const storeCourseBySlug = new Map(storeCourses.map((course) => [course.slug, course]));
    const storeCourseById = new Map(storeCourses.map((course) => [course.id, course]));
    const [enrolledCourses, progress, attempts] = await Promise.all([
        getEnrolledCoursesPaged({ page: page - 1, size: limit }),
        getProgress().catch(() => [] as CourseProgressResponse[]),
        getMyAttempts().catch(() => [] as AttemptSummaryResponse[]),
    ]);
    useUserStore.getState().setLearningProgressData(progress, attempts);

    const progressBySlug = new Map(progress.map((item) => [item.courseSlug, item]));
    const progressById = new Map(progress.map((item) => [item.courseId, item]));
    const mappedCourses = enrolledCourses.items
        .map((course) => {
            const fullCourse = storeCourseBySlug.get(course.slug) ?? storeCourseById.get(course.id) ?? course;
            return mapCourseToEnrolledListItem(
                fullCourse,
                attempts,
                progressBySlug.get(course.slug) ?? progressById.get(course.id)
            );
        })
        .sort(sortEnrolledCourses);

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
    const storeCourses = useUserStore((state) => state.courses);
    const storeProgress = useUserStore((state) => state.courseProgress);
    const storeAttempts = useUserStore((state) => state.attempts);
    const initialCachedCourses = enrolledCoursesCache.get(1);
    const initialStorePage = getStoreMappedPage(limit);

    const [courses, setCourses] = useState<EnrolledCourseListItem[]>(() => initialCachedCourses?.items ?? initialStorePage.items);
    const [totalItems, setTotalItems] = useState(() => initialCachedCourses?.total ?? initialStorePage.total);
    const [isLoading, setIsLoading] = useState(() => (initialCachedCourses?.items.length ?? initialStorePage.items.length) === 0);

    useEffect(() => {
        let cancelled = false;

        async function fetchEnrolledCourses() {
            const cached = enrolledCoursesCache.get(page);
            const storePage = page === 1 ? getStoreMappedPage(limit) : { items: [] as EnrolledCourseListItem[], total: 0 };
            if (cached) {
                setCourses(cached.items);
                setTotalItems(cached.total);
                setIsLoading(false);
            } else if (storePage.items.length > 0) {
                setCourses(storePage.items);
                setTotalItems(storePage.total);
                setIsLoading(false);
            } else if (courses.length === 0) {
                setIsLoading(true);
            }

            try {
                const fresh = await fetchAndMapCourses(page, limit);
                if (!cancelled) {
                    setCourses(fresh.items);
                    setTotalItems(fresh.total);
                }
            } catch {
                if (!cancelled && !cached && storePage.items.length === 0 && courses.length === 0) {
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
    }, [courses.length, page, storeAttempts, storeCourses, storeProgress]);

    useEffect(() => {
        function handleProgressChanged(event: Event) {
            const detail = event instanceof CustomEvent ? event.detail as LearningProgressChangedDetail | undefined : undefined;
            if (detail?.contentId) {
                useUserStore.getState().recordLearningProgressChange(detail);
            }
            const storePage = getStoreMappedPage(limit);
            if (page === 1 && storePage.items.length > 0) {
                enrolledCoursesCache.set(1, storePage);
                setCourses(storePage.items);
                setTotalItems(storePage.total);
                setIsLoading(false);
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
    }, [page]);

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
