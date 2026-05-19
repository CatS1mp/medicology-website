import { useEffect, useMemo, useState } from 'react';
import { getCourseDetail, getCourses } from '@/shared/api/learning';
import type { LearningProgressChangedDetail } from '@/shared/api/learning';
import { getMyAttempts, getMyInProgressAttempts } from '@/shared/api/assessment';
import type { AttemptSummaryResponse } from '@/shared/types/assessment';
import { CourseProgressResponse, CourseResponse } from '@/shared/types/learning';
import { LessonStatus, RoadmapData } from '../types';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';
import { getCachedValue, setCachedValue } from '@/shared/api/client-cache';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';
import { useUserStore } from '@/shared/store/useUserStore';

function isLikelyCourseUuid(param: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
}

function normalizeRouteParam(param: string): string {
    try {
        return decodeURIComponent(param).trim();
    } catch {
        return param.trim();
    }
}

type AttemptSummaryLite = {
    attemptId: string;
    contentId: string;
    submittedAt: string | null;
    startedAt: string;
    status: string;
    score: number | null;
    passed: boolean | null;
};

function toAttemptTimestamp(attempt: AttemptSummaryLite): number {
    const value = Date.parse(attempt.submittedAt ?? attempt.startedAt);
    return Number.isNaN(value) ? 0 : value;
}

/**
 * Quy ước roadmap:
 * - completed: attempt FINALIZED mới nhất có passed=true
 * - failed: attempt FINALIZED mới nhất có passed=false
 */
function buildMainFinalizedAttemptByContentId(
    attempts: AttemptSummaryLite[],
    courseContentIds: Set<string>
): Map<string, AttemptSummaryLite> {
    const finalizedAttemptsByContentId = new Map<string, AttemptSummaryLite[]>();
    for (const attempt of attempts) {
        if (!courseContentIds.has(attempt.contentId)) continue;
        if (attempt.status !== 'FINALIZED') continue;
        if (attempt.score === null) continue;

        const current = finalizedAttemptsByContentId.get(attempt.contentId) ?? [];
        current.push(attempt);
        finalizedAttemptsByContentId.set(attempt.contentId, current);
    }

    const mainAttemptByContentId = new Map<string, AttemptSummaryLite>();
    for (const [contentId, contentAttempts] of finalizedAttemptsByContentId.entries()) {
        const passedAttempts = contentAttempts.filter((attempt) => attempt.passed === true);
        const candidates = passedAttempts.length > 0 ? passedAttempts : contentAttempts;

        const latestAttempt = candidates.reduce<AttemptSummaryLite | null>((latest, attempt) => {
            if (!latest || toAttemptTimestamp(attempt) >= toAttemptTimestamp(latest)) {
                return attempt;
            }
            return latest;
        }, null);
        if (latestAttempt) {
            mainAttemptByContentId.set(contentId, latestAttempt);
        }
    }
    return mainAttemptByContentId;
}

export const roadmapCache = new Map<string, RoadmapData>();
const roadmapImagePreloadCache = new Set<string>();

function preloadRoadmapImage(src: string | undefined) {
    if (typeof window === 'undefined' || !src || roadmapImagePreloadCache.has(src)) return;
    roadmapImagePreloadCache.add(src);
    const image = new Image();
    image.src = src;
}

function findCourseBySlugOrId(courses: CourseResponse[], slug: string): CourseResponse | undefined {
    const key = normalizeRouteParam(slug);
    return courses.find(
        (item) =>
            item.slug === key ||
            item.slug?.toLowerCase() === key.toLowerCase() ||
            item.id === key
    );
}

function hasCourseLessonContents(course: CourseResponse | undefined): boolean {
    return Boolean(course?.sections?.some((section) => (section.contents?.length ?? 0) > 0));
}

function findBestCourseSnapshot(courses: CourseResponse[], roadmapCourses: CourseResponse[], slug: string): CourseResponse | undefined {
    const enrolledCourse = findCourseBySlugOrId(courses, slug);
    const roadmapCourse = findCourseBySlugOrId(roadmapCourses, slug);
    return hasCourseLessonContents(enrolledCourse) ? enrolledCourse : roadmapCourse ?? enrolledCourse;
}

function findUserDataCourse(slug: string): CourseResponse | undefined {
    const { courses, roadmap } = useUserStore.getState();
    return findBestCourseSnapshot(courses, roadmap?.courses ?? [], slug);
}

function mapCourseToInitialRoadmap(course: CourseResponse, attempts: AttemptSummaryResponse[] = []): RoadmapData {
    const sections = (course.sections ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    const flattenedLessons = sections.flatMap((section) =>
        (section.contents ?? []).slice().sort((x, y) => x.orderIndex - y.orderIndex)
    );
    const courseContentIds = new Set(flattenedLessons.map((lesson) => lesson.id));
    const mainFinalizedAttemptByContentId = buildMainFinalizedAttemptByContentId(attempts, courseContentIds);
    const completedContentIds = new Set(
        [...mainFinalizedAttemptByContentId.entries()]
            .filter(([, attempt]) => attempt.passed === true)
            .map(([contentId]) => contentId)
    );
    const failedContentIds = new Set(
        [...mainFinalizedAttemptByContentId.entries()]
            .filter(([, attempt]) => attempt.passed !== true)
            .map(([contentId]) => contentId)
    );
    const incompleteOrdered = flattenedLessons.filter((lesson) => !completedContentIds.has(lesson.id));
    const firstOpen = incompleteOrdered[0];
    const secondOpen = incompleteOrdered[1];
    const totalLessons = Math.max(1, flattenedLessons.length);
    const courseImageUrl = resolveCourseIconSrc(course.iconFileName);
    preloadRoadmapImage(courseImageUrl);
    let lessonOrder = 0;

    return {
        topicTitle: course.name,
        courseImageUrl,
        progress: {
            current: completedContentIds.size,
            total: totalLessons,
        },
        streak: {
            days: 0,
            message: 'Tiếp tục học đều mỗi ngày.',
        },
        sections: sections.map((section) => ({
            id: section.id,
            title: section.name,
            nodes: [...(section.contents ?? [])]
                .sort((x, y) => x.orderIndex - y.orderIndex)
                .map((lesson) => {
                    let status: LessonStatus;
                    if (completedContentIds.has(lesson.id)) {
                        status = 'completed';
                    } else if (failedContentIds.has(lesson.id)) {
                        status = 'failed';
                    } else if (firstOpen && lesson.id === firstOpen.id) {
                        status = 'active';
                    } else if (secondOpen && lesson.id === secondOpen.id) {
                        status = 'next';
                    } else {
                        status = 'locked';
                    }
                    const finalizedAttempt = mainFinalizedAttemptByContentId.get(lesson.id);
                    return {
                        id: lesson.id,
                        orderIndex: ++lessonOrder,
                        title: lesson.name,
                        status,
                        type: 'lesson' as const,
                        href: `/courses/${course.slug}/lessons/${lesson.slug}`,
                        finalizedAttemptId: finalizedAttempt?.attemptId,
                        resultHref: finalizedAttempt ? `/attempts/${encodeURIComponent(finalizedAttempt.attemptId)}/result` : undefined,
                        description: lesson.estimatedDurationMinutes
                            ? `${lesson.estimatedDurationMinutes} phút học`
                            : lesson.difficultyLevel ?? undefined,
                    };
                }),
        })),
        continueLesson: incompleteOrdered[0]
            ? {
                courseInfo: course.name,
                title: incompleteOrdered[0].name,
                description: flattenedLessons[0].description ?? 'Tiếp tục bài học tiếp theo.',
                link: `/courses/${course.slug}/lessons/${incompleteOrdered[0].slug}`,
            }
            : undefined,
    };
}

export function clearRoadmapCache(slug?: string) {
    if (slug) {
        roadmapCache.delete(slug);
        return;
    }
    roadmapCache.clear();
}

function getNextOpenStatuses(data: RoadmapData, completedContentId: string) {
    const nodes = data.sections.flatMap((section) => section.nodes);
    const incompleteNodes = nodes.filter((node) => node.id !== completedContentId && node.status !== 'completed' && node.status !== 'failed');
    return {
        firstOpenId: incompleteNodes[0]?.id,
        secondOpenId: incompleteNodes[1]?.id,
    };
}

function patchRoadmapFromCompletedAttempt(
    data: RoadmapData | null,
    detail: LearningProgressChangedDetail | undefined
): RoadmapData | null {
    if (!data || !detail?.contentId) return null;
    if (detail.resultStatus !== 'FINAL' && detail.attemptStatus !== 'FINALIZED') return null;

    const { firstOpenId, secondOpenId } = getNextOpenStatuses(data, detail.contentId);
    let didPatch = false;
    let wasCounted = false;
    const completedStatus: LessonStatus = detail.passed === false ? 'failed' : 'completed';

    const sections = data.sections.map((section) => ({
        ...section,
        nodes: section.nodes.map((node) => {
            if (node.id === detail.contentId) {
                wasCounted = node.status === 'completed' || node.status === 'failed';
                didPatch = true;
                return {
                    ...node,
                    status: completedStatus,
                    inProgressAttemptId: undefined,
                    finalizedAttemptId: detail.attemptId,
                    resultHref: detail.attemptId ? `/attempts/${encodeURIComponent(detail.attemptId)}/result` : node.resultHref,
                    href: node.href?.split('?')[0],
                };
            }

            if (node.id === firstOpenId) {
                return { ...node, status: 'active' as LessonStatus };
            }

            if (node.id === secondOpenId) {
                return { ...node, status: 'next' as LessonStatus };
            }

            return node;
        }),
    }));

    if (!didPatch) return null;

    const nodes = sections.flatMap((section) => section.nodes);
    const continueNode = nodes.find((node) => (node.status === 'active' || node.status === 'next') && !!node.href);
    return {
        ...data,
        progress: {
            ...data.progress,
            current: wasCounted || completedStatus !== 'completed'
                ? data.progress.current
                : Math.min(data.progress.total, data.progress.current + 1),
        },
        sections,
        continueLesson: continueNode
            ? {
                courseInfo: data.topicTitle,
                title: continueNode.title,
                description: continueNode.status === 'active'
                    ? 'Tiếp tục bài học tiếp theo.'
                    : 'Bài học tiếp theo.',
                link: continueNode.href!,
            }
            : undefined,
    };
}

export function patchRoadmapCache(slug: string, detail: LearningProgressChangedDetail | undefined): RoadmapData | null {
    const cached = roadmapCache.get(slug);
    const patched = patchRoadmapFromCompletedAttempt(cached ?? null, detail);
    if (patched) {
        roadmapCache.set(slug, patched);
        if (detail) {
            patchProgressCacheFromRoadmap(slug, patched, detail);
        }
    }
    return patched;
}

function patchProgressCacheFromRoadmap(slug: string, data: RoadmapData, detail: LearningProgressChangedDetail) {
    const cachedProgress = getCachedValue<CourseProgressResponse[]>(cacheKeys.learning.progress());
    if (!cachedProgress) return;

    const completionPercent = Math.max(
        0,
        Math.min(100, Math.round((data.progress.current * 100) / Math.max(1, data.progress.total)))
    );
    const normalizedSlug = normalizeRouteParam(slug).toLowerCase();
    const normalizedDetailSlug = detail.courseSlug ? normalizeRouteParam(detail.courseSlug).toLowerCase() : null;

    const nextProgress = cachedProgress.map((progress) => {
        const normalizedProgressSlug = normalizeRouteParam(progress.courseSlug).toLowerCase();
        if (normalizedProgressSlug !== normalizedSlug && normalizedProgressSlug !== normalizedDetailSlug) {
            return progress;
        }

        return {
            ...progress,
            completionPercent,
            lastStudiedAt: detail.completedAt ?? progress.lastStudiedAt,
        };
    });

    setCachedValue(cacheKeys.learning.progress(), nextProgress, CACHE_TTL.SHORT);
}

export function patchRoadmapCaches(detail: LearningProgressChangedDetail | undefined): boolean {
    if (!detail?.contentId) return false;
    let didPatch = false;

    for (const [cacheKey, cached] of roadmapCache.entries()) {
        if (detail.courseSlug && cacheKey !== detail.courseSlug) {
            const normalizedCacheKey = normalizeRouteParam(cacheKey).toLowerCase();
            const normalizedCourseSlug = normalizeRouteParam(detail.courseSlug).toLowerCase();
            if (normalizedCacheKey !== normalizedCourseSlug) {
                continue;
            }
        }

        const patched = patchRoadmapFromCompletedAttempt(cached, detail);
        if (patched) {
            roadmapCache.set(cacheKey, patched);
            patchProgressCacheFromRoadmap(cacheKey, patched, detail);
            didPatch = true;
        }
    }

    return didPatch;
}

export async function preloadRoadmap(slug: string, options?: { force?: boolean }) {
    if (!options?.force && roadmapCache.has(slug)) return;
    try {
        const key = normalizeRouteParam(slug);
        const byId = isLikelyCourseUuid(key);
        const storeCourse = byId ? undefined : findUserDataCourse(key);
        const storeCourseHasLessons = hasCourseLessonContents(storeCourse);
        const [courses, courseById, inProgress, myAttempts] = await Promise.all([
            byId || storeCourseHasLessons ? Promise.resolve<CourseResponse[]>([]) : getCourses().catch(() => [] as CourseResponse[]),
            byId
                ? getCourseDetail(key).catch(() => null)
                : storeCourse && !storeCourseHasLessons
                    ? getCourseDetail(storeCourse.id).catch(() => null)
                    : Promise.resolve(null),
            getMyInProgressAttempts().catch(() => []),
            getMyAttempts().catch(() => []),
        ]);
        const course = byId
            ? courseById ?? undefined
            : courseById ?? (storeCourseHasLessons ? storeCourse : undefined) ?? courses.find(
                  (item) =>
                      item.slug === key ||
                      item.slug?.toLowerCase() === key.toLowerCase() ||
                      item.id === key
              );
        if (!course) return;

        const sections = (course.sections ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
        const flattenedLessons = sections.flatMap((section) =>
            (section.contents ?? []).slice().sort((x, y) => x.orderIndex - y.orderIndex)
        );
        const courseContentIds = new Set(flattenedLessons.map((c) => c.id));
        const mainFinalizedAttemptByContentId = buildMainFinalizedAttemptByContentId(myAttempts, courseContentIds);
        const completedContentIds = new Set(
            [...mainFinalizedAttemptByContentId.entries()]
                .filter(([, attempt]) => attempt.passed === true)
                .map(([contentId]) => contentId)
        );
        const failedContentIds = new Set(
            [...mainFinalizedAttemptByContentId.entries()]
                .filter(([, attempt]) => attempt.passed !== true)
                .map(([contentId]) => contentId)
        );
        const finalizedContentIds = new Set([...completedContentIds, ...failedContentIds]);
        const attemptByContentId = new Map(
            inProgress
                .filter((attempt) => !finalizedContentIds.has(attempt.contentId))
                .map((attempt) => [attempt.contentId, attempt.attemptId])
        );
        const completedCount = flattenedLessons.filter((c) => completedContentIds.has(c.id)).length;
        const totalLessons = Math.max(1, flattenedLessons.length);
        const incompleteOrdered = flattenedLessons.filter((c) => !completedContentIds.has(c.id));
        const firstOpen = incompleteOrdered[0];
        const secondOpen = incompleteOrdered[1];
        let lessonOrder = 0;
        const courseImageUrl = resolveCourseIconSrc(course.iconFileName);
        preloadRoadmapImage(courseImageUrl);

        const mapped: RoadmapData = {
            topicTitle: course.name,
            courseImageUrl,
            progress: {
                current: completedCount,
                total: totalLessons,
            },
            streak: {
                days: 0,
                message: 'Bạn đang xây dựng một thói quen học tập vững chắc. Tiếp tục phát huy nhé!',
            },
            sections: sections
                .map((section) => ({
                    id: section.id,
                    title: section.name,
                    nodes: [...(section.contents ?? [])]
                        .sort((x, y) => x.orderIndex - y.orderIndex)
                        .map((lesson) => {
                        const attemptId = attemptByContentId.get(lesson.id);

                        let status: LessonStatus;
                        if (completedContentIds.has(lesson.id)) {
                            status = 'completed';
                        } else if (attemptId) {
                            status = 'active';
                        } else if (failedContentIds.has(lesson.id)) {
                            status = 'failed';
                        } else if (firstOpen && lesson.id === firstOpen.id) {
                            status = 'active';
                        } else if (secondOpen && lesson.id === secondOpen.id) {
                            status = 'next';
                        } else {
                            status = 'locked';
                        }

                        const hrefBase = `/courses/${course.slug}/lessons/${lesson.slug}`;
                        const finalizedAttempt = mainFinalizedAttemptByContentId.get(lesson.id);
                        return {
                            id: lesson.id,
                            orderIndex: ++lessonOrder,
                            title: lesson.name,
                            status,
                            type: 'lesson' as const,
                            href: attemptId ? `${hrefBase}?attempt=${encodeURIComponent(attemptId)}` : hrefBase,
                            inProgressAttemptId: attemptId,
                            finalizedAttemptId: finalizedAttempt?.attemptId,
                            resultHref: finalizedAttempt ? `/attempts/${encodeURIComponent(finalizedAttempt.attemptId)}/result` : undefined,
                            description: lesson.estimatedDurationMinutes
                                ? `${lesson.estimatedDurationMinutes} phút học`
                                : lesson.difficultyLevel ?? undefined,
                        };
                    }),
                })),
            continueLesson: (() => {
                const inProgressLesson = flattenedLessons.find((c) => attemptByContentId.has(c.id));
                const target = inProgressLesson ?? incompleteOrdered[0];
                if (!target) return undefined;
                const aid = attemptByContentId.get(target.id);
                const base = `/courses/${course.slug}/lessons/${target.slug}`;
                const link = aid ? `${base}?attempt=${encodeURIComponent(aid)}` : base;
                return {
                    courseInfo: course.name,
                    title: target.name,
                    description:
                        target.description ??
                        (inProgressLesson
                            ? 'Tiếp tục bài học đang làm dở.'
                            : 'Tiếp tục bài học tiếp theo.'),
                    link,
                };
            })(),
        };

        roadmapCache.set(slug, mapped);
    } catch {
        // fail silently for preload
    }
}

export const useRoadmap = (slug: string) => {
    const storeCourses = useUserStore((state) => state.courses);
    const storeRoadmapCourses = useUserStore((state) => state.roadmap?.courses ?? []);
    const storeAttempts = useUserStore((state) => state.attempts);
    const initialRoadmap = (() => {
        const cached = roadmapCache.get(slug);
        if (cached) return cached;
        const course = findUserDataCourse(slug);
        if (!course || !hasCourseLessonContents(course)) return null;
        return mapCourseToInitialRoadmap(course, useUserStore.getState().attempts);
    })();
    const [data, setData] = useState<RoadmapData | null>(() => initialRoadmap);
    const [isLoading, setIsLoading] = useState(() => !initialRoadmap);
    const storeRoadmap = useMemo(() => {
        if (roadmapCache.has(slug)) return null;
        const course = findBestCourseSnapshot(storeCourses, storeRoadmapCourses, slug);
        return course && hasCourseLessonContents(course) ? mapCourseToInitialRoadmap(course, storeAttempts) : null;
    }, [slug, storeAttempts, storeCourses, storeRoadmapCourses]);

    useEffect(() => {
        let cancelled = false;

        async function fetchRoadmap() {
            const cached = roadmapCache.get(slug);
            if (cached) {
                setData(cached);
                setIsLoading(false);
            } else if (storeRoadmap) {
                setIsLoading(false);
            } else {
                setIsLoading(true);
            }
            
            try {
                await preloadRoadmap(slug);
                if (!cancelled && roadmapCache.has(slug)) {
                    setData(roadmapCache.get(slug)!);
                }
            } catch {
                if (!cancelled && !storeRoadmap) setData(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchRoadmap();
        return () => {
            cancelled = true;
        };
    }, [slug, storeRoadmap]);

    useEffect(() => {
        let cancelled = false;

        async function refreshRoadmap(event: Event) {
            const detail = event instanceof CustomEvent ? event.detail as LearningProgressChangedDetail | undefined : undefined;
            const patched = patchRoadmapCache(slug, detail);
            if (patched) {
                setData(patched);
                setIsLoading(false);
                return;
            }

            clearRoadmapCache(slug);
            setIsLoading(true);
            try {
                await preloadRoadmap(slug, { force: true });
                if (!cancelled) {
                    setData(roadmapCache.get(slug) ?? null);
                }
            } catch {
                if (!cancelled && !storeRoadmap) setData(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        window.addEventListener('learning:progress-changed', refreshRoadmap);
        return () => {
            cancelled = true;
            window.removeEventListener('learning:progress-changed', refreshRoadmap);
        };
    }, [slug, storeRoadmap]);

    const displayData = data ?? storeRoadmap;

    return {
        data: displayData,
        isLoading: isLoading && !displayData
    };
};
