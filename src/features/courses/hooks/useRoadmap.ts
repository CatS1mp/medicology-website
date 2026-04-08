import { useEffect, useState } from 'react';
import { getCourses, getProgress } from '@/shared/api/learning';
import { RoadmapData } from '../types';

export const useRoadmap = (slug: string) => {
    const [data, setData] = useState<RoadmapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchRoadmap() {
            setIsLoading(true);
            setData(null);
            try {
                const [courses, progress] = await Promise.all([getCourses(), getProgress().catch(() => [])]);
                const course = courses.find((item) => item.slug === slug);
                if (!course) {
                    if (!cancelled) setData(null);
                    return;
                }
                const sections = (course.sections ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
                const totalLessons = Math.max(
                    1,
                    sections.reduce((sum, section) => sum + (section.lessons?.length ?? 0), 0)
                );
                const completionPercent = progress.find((item) => item.courseSlug === slug)?.completionPercent ?? 0;
                const completedLessons = Math.min(totalLessons, Math.round((completionPercent / 100) * totalLessons));
                let lessonCursor = 0;

                const mapped: RoadmapData = {
                    topicTitle: course.name,
                    progress: {
                        current: completedLessons,
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
                            nodes: (section.lessons ?? []).map((lesson) => {
                                const currentIndex = lessonCursor++;
                                const status =
                                    currentIndex < completedLessons
                                        ? 'completed'
                                        : currentIndex === completedLessons
                                            ? 'active'
                                            : currentIndex === completedLessons + 1
                                                ? 'next'
                                                : 'locked';
                                return {
                                    id: lesson.id,
                                    title: lesson.name,
                                    status,
                                    type: 'lesson' as const,
                                    href: `/courses/${course.slug}/lessons/${lesson.slug}`,
                                    description: lesson.estimatedDurationMinutes
                                        ? `${lesson.estimatedDurationMinutes} phut hoc`
                                        : lesson.difficultyLevel ?? undefined,
                                };
                            }),
                        })),
                    continueLesson: (() => {
                        const flattened = sections.flatMap((section) => section.lessons ?? []);
                        const nextLesson = flattened[Math.min(completedLessons, Math.max(flattened.length - 1, 0))];
                        if (!nextLesson) return undefined;
                        return {
                            courseInfo: course.name,
                            title: nextLesson.name,
                            description: nextLesson.description ?? 'Tiep tuc bai hoc dang dang do.',
                            link: `/courses/${course.slug}/lessons/${nextLesson.slug}`,
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

