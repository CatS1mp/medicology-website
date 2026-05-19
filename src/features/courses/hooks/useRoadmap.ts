import { useEffect, useState } from 'react';

import { getLearnerRoadmap, invalidateLearnerRoadmapCache } from '@/shared/api/learning';

import { resolveCourseIconSrc } from '@/shared/utils/course-icon';

import { LessonStatus, RoadmapData } from '../types';

import type { CourseRoadmapApiResponse } from '@/shared/types/learning';

import { normalizeCourseRouteParam, resolveCourseRoadmapKey } from '../utils/course-route';



function toLessonStatus(status: string): LessonStatus {

    if (status === 'completed' || status === 'failed' || status === 'active' || status === 'locked' || status === 'next') {

        return status;

    }

    return 'locked';

}



function mapRoadmapResponse(api: CourseRoadmapApiResponse): RoadmapData {

    const courseSlug = api.courseSlug;

    return {

        topicTitle: api.topicTitle,

        courseImageUrl: resolveCourseIconSrc(api.courseImageUrl),

        progress: api.progress,

        streak: {

            days: 0,

            message: 'Bạn đang xây dựng một thói quen học tập vững chắc. Tiếp tục phát huy nhé!',

        },

        sections: api.sections.map((section) => ({

            id: section.id,

            title: section.title,

            nodes: section.nodes.map((node) => {

                const hrefBase = `/courses/${courseSlug}/lessons/${node.slug}`;

                const attemptId = node.inProgressAttemptId ?? undefined;

                return {

                    id: node.id,

                    orderIndex: node.orderIndex,

                    title: node.title,

                    status: toLessonStatus(node.status),

                    type: 'lesson' as const,

                    href: attemptId ? `${hrefBase}?attempt=${encodeURIComponent(attemptId)}` : hrefBase,

                    inProgressAttemptId: attemptId,

                    description: node.description ?? undefined,

                };

            }),

        })),

        continueLesson: api.continueLesson

            ? (() => {

                  const cl = api.continueLesson!;

                  const base = `/courses/${courseSlug}/lessons/${cl.contentSlug}`;

                  const link = cl.inProgressAttemptId

                      ? `${base}?attempt=${encodeURIComponent(cl.inProgressAttemptId)}`

                      : base;

                  return {

                      courseInfo: cl.courseInfo,

                      title: cl.title,

                      description: cl.description,

                      link,

                  };

              })()

            : undefined,

    };

}



export const roadmapCache = new Map<string, RoadmapData>();



export function clearRoadmapCache(slug?: string) {

    if (slug) {

        const key = normalizeCourseRouteParam(slug);

        roadmapCache.delete(key);

        invalidateLearnerRoadmapCache(key);

        return;

    }

    roadmapCache.clear();

    invalidateLearnerRoadmapCache();

}



export async function preloadRoadmap(slug: string, options?: { force?: boolean }) {

    const routeKey = normalizeCourseRouteParam(slug);

    if (!routeKey) return;

    if (!options?.force && roadmapCache.has(routeKey)) return;



    try {

        const apiKey = await resolveCourseRoadmapKey(routeKey);

        const api = await getLearnerRoadmap(apiKey);

        const mapped = mapRoadmapResponse(api);

        roadmapCache.set(routeKey, mapped);

        if (apiKey !== routeKey) {

            roadmapCache.set(apiKey, mapped);

        }

    } catch {

        // preload — im lặng

    }

}



export const useRoadmap = (slug: string) => {

    const routeKey = normalizeCourseRouteParam(slug);

    const [data, setData] = useState<RoadmapData | null>(() => roadmapCache.get(routeKey) || null);

    const [isLoading, setIsLoading] = useState(() => !roadmapCache.has(routeKey));

    const [error, setError] = useState<string | null>(null);



    useEffect(() => {

        let cancelled = false;



        async function fetchRoadmap() {

            if (!routeKey) {

                setData(null);

                setError('Thiếu thông tin khóa học trên đường dẫn.');

                setIsLoading(false);

                return;

            }



            if (roadmapCache.has(routeKey)) {

                setData(roadmapCache.get(routeKey)!);

                setError(null);

                setIsLoading(false);

            } else {

                setIsLoading(true);

            }



            try {

                const apiKey = await resolveCourseRoadmapKey(routeKey);

                const api = await getLearnerRoadmap(apiKey);

                const mapped = mapRoadmapResponse(api);

                if (cancelled) return;

                roadmapCache.set(routeKey, mapped);

                if (apiKey !== routeKey) {

                    roadmapCache.set(apiKey, mapped);

                }

                setData(mapped);

                setError(null);

            } catch (e) {

                if (!cancelled) {

                    setData(null);

                    setError(e instanceof Error ? e.message : 'Không tải được lộ trình khóa học.');

                }

            } finally {

                if (!cancelled) setIsLoading(false);

            }

        }



        void fetchRoadmap();

        return () => {

            cancelled = true;

        };

    }, [routeKey]);



    useEffect(() => {

        let cancelled = false;



        async function refreshRoadmap() {

            clearRoadmapCache(routeKey);

            setIsLoading(true);

            try {

                const apiKey = await resolveCourseRoadmapKey(routeKey);

                const api = await getLearnerRoadmap(apiKey);

                const mapped = mapRoadmapResponse(api);

                if (cancelled) return;

                roadmapCache.set(routeKey, mapped);

                if (apiKey !== routeKey) {

                    roadmapCache.set(apiKey, mapped);

                }

                setData(mapped);

                setError(null);

            } catch (e) {

                if (!cancelled) {

                    setData(null);

                    setError(e instanceof Error ? e.message : 'Không tải được lộ trình khóa học.');

                }

            } finally {

                if (!cancelled) setIsLoading(false);

            }

        }



        window.addEventListener('learning:progress-changed', refreshRoadmap);

        return () => {

            cancelled = true;

            window.removeEventListener('learning:progress-changed', refreshRoadmap);

        };

    }, [routeKey]);



    return {

        data,

        isLoading,

        error,

    };

};


