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

/** Content đã nộp attempt (có submittedAt) được coi là đã hoàn thành trên roadmap. */
function buildCompletedContentIdsFromAttempts(
    attempts: { contentId: string; submittedAt: string | null; status: string }[],
    courseContentIds: Set<string>
): Set<string> {
    const done = new Set<string>();
    for (const a of attempts) {
        if (!courseContentIds.has(a.contentId) || !a.submittedAt) continue;
        if (a.status === 'IN_PROGRESS') continue;
        done.add(a.contentId);
    }
    return done;
}

export const useRoadmap = (slug: string) => {
    const [data, setData] = useState<RoadmapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchRoadmap() {
            setIsLoading(true);
            setData(null);
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
                if (!course) {
                    if (!cancelled) setData(null);
                    return;
                }
                const sections = (course.sections ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
                const flattenedLessons = sections.flatMap((section) =>
                    (section.contents ?? []).slice().sort((x, y) => x.orderIndex - y.orderIndex)
                );
                const courseContentIds = new Set(flattenedLessons.map((c) => c.id));
                const completedContentIds = buildCompletedContentIdsFromAttempts(myAttempts, courseContentIds);
                const completedCount = flattenedLessons.filter((c) => completedContentIds.has(c.id)).length;
                const totalLessons = Math.max(1, flattenedLessons.length);
                const incompleteOrdered = flattenedLessons.filter((c) => !completedContentIds.has(c.id));
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

                if (!cancelled) setData(mapped);
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

    return {
        data,
        isLoading
    };
};
