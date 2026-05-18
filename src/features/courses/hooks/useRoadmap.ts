import { useEffect, useState } from 'react';
import { getCourseDetail, getCourses } from '@/shared/api/learning';
import { getMyAttempts, getMyInProgressAttempts } from '@/shared/api/assessment';
import { CourseResponse } from '@/shared/types/learning';
import { LessonStatus, RoadmapData } from '../types';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';

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
function buildLatestFinalizedOutcomeByContentId(
    attempts: AttemptSummaryLite[],
    courseContentIds: Set<string>
): Map<string, 'completed' | 'failed'> {
    const latestAttemptByContentId = new Map<string, AttemptSummaryLite>();
    for (const attempt of attempts) {
        if (!courseContentIds.has(attempt.contentId)) continue;
        if (attempt.status !== 'FINALIZED') continue;
        if (attempt.score === null) continue;
        if (!attempt.submittedAt) continue;
        const prev = latestAttemptByContentId.get(attempt.contentId);
        if (!prev || toAttemptTimestamp(attempt) >= toAttemptTimestamp(prev)) {
            latestAttemptByContentId.set(attempt.contentId, attempt);
        }
    }

    const outcome = new Map<string, 'completed' | 'failed'>();
    for (const [contentId, attempt] of latestAttemptByContentId.entries()) {
        outcome.set(contentId, attempt.passed ? 'completed' : 'failed');
    }
    return outcome;
}

export const roadmapCache = new Map<string, RoadmapData>();

export function clearRoadmapCache(slug?: string) {
    if (slug) {
        roadmapCache.delete(slug);
        return;
    }
    roadmapCache.clear();
}

export async function preloadRoadmap(slug: string, options?: { force?: boolean }) {
    if (!options?.force && roadmapCache.has(slug)) return;
    try {
        const key = normalizeRouteParam(slug);
        const byId = isLikelyCourseUuid(key);
        const [courses, courseById, inProgress, myAttempts] = await Promise.all([
            byId ? Promise.resolve<CourseResponse[]>([]) : getCourses().catch(() => [] as CourseResponse[]),
            byId ? getCourseDetail(key).catch(() => null) : Promise.resolve(null),
            getMyInProgressAttempts().catch(() => []),
            getMyAttempts().catch(() => []),
        ]);
        const attemptByContentId = new Map(inProgress.map((a) => [a.contentId, a.attemptId]));
        const course = byId
            ? courseById ?? undefined
            : courses.find(
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
        const finalizedOutcomeByContentId = buildLatestFinalizedOutcomeByContentId(myAttempts, courseContentIds);
        const completedContentIds = new Set(
            [...finalizedOutcomeByContentId.entries()]
                .filter(([, outcome]) => outcome === 'completed')
                .map(([contentId]) => contentId)
        );
        const failedContentIds = new Set(
            [...finalizedOutcomeByContentId.entries()]
                .filter(([, outcome]) => outcome === 'failed')
                .map(([contentId]) => contentId)
        );
        const finalizedContentIds = new Set([...completedContentIds, ...failedContentIds]);
        const completedCount = flattenedLessons.filter((c) => finalizedContentIds.has(c.id)).length;
        const totalLessons = Math.max(1, flattenedLessons.length);
        const incompleteOrdered = flattenedLessons.filter((c) => !finalizedContentIds.has(c.id));
        const firstOpen = incompleteOrdered[0];
        const secondOpen = incompleteOrdered[1];
        let lessonOrder = 0;
        const mapped: RoadmapData = {
            topicTitle: course.name,
            courseImageUrl: resolveCourseIconSrc(course.iconFileName),
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
                        return {
                            id: lesson.id,
                            orderIndex: ++lessonOrder,
                            title: lesson.name,
                            status,
                            type: 'lesson' as const,
                            href: attemptId ? `${hrefBase}?attempt=${encodeURIComponent(attemptId)}` : hrefBase,
                            inProgressAttemptId: attemptId,
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
    const [data, setData] = useState<RoadmapData | null>(() => roadmapCache.get(slug) || null);
    const [isLoading, setIsLoading] = useState(() => !roadmapCache.has(slug));

    useEffect(() => {
        let cancelled = false;

        async function fetchRoadmap() {
            if (roadmapCache.has(slug)) {
                setData(roadmapCache.get(slug)!);
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
                if (!cancelled) setData(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchRoadmap();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    useEffect(() => {
        let cancelled = false;

        async function refreshRoadmap() {
            clearRoadmapCache(slug);
            setIsLoading(true);
            try {
                await preloadRoadmap(slug, { force: true });
                if (!cancelled) {
                    setData(roadmapCache.get(slug) ?? null);
                }
            } catch {
                if (!cancelled) setData(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        window.addEventListener('learning:progress-changed', refreshRoadmap);
        return () => {
            cancelled = true;
            window.removeEventListener('learning:progress-changed', refreshRoadmap);
        };
    }, [slug]);

    return {
        data,
        isLoading
    };
};
