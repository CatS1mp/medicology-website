import { useCallback, useEffect, useRef, useState } from 'react';
import { enrollCourse, getCourseSections, getCourses, getProgress, getSectionLessons } from '@/shared/api/learning';
import { Course, Theme, UserCourse } from '@/shared/types/learning';
import { LessonNode, RoadmapData } from '../types';

type SectionWithLessons = {
    id: string;
    name: string;
    orderIndex?: number;
    lessons: Course[];
};

type CurrentCourseRef = {
    id: string;
    slug: string;
    name: string;
};

const LOCAL_ENROLLED_KEY = 'enrolledCoursesLocal';

function sortByOrder<T extends { orderIndex?: number }>(items: T[]): T[] {
    return items.slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

function debugCourseStructure(theme: Theme, sections: SectionWithLessons[], selectedCourseId?: string) {
    console.group('[Roadmap Debug] Selected course structure');
    console.log('selectedCourseId(query):', selectedCourseId ?? '(none)');
    console.log('resolvedCourse(old-theme):', { id: theme.id, slug: theme.slug, name: theme.name });
    console.log('sectionCount:', sections.length);

    sections.forEach((section, sectionIndex) => {
        console.log(`section[${sectionIndex}]`, {
            id: section.id,
            name: section.name,
            orderIndex: section.orderIndex ?? 0,
            lessonCount: section.lessons.length,
        });

        section.lessons.forEach((lesson, lessonIndex) => {
            console.log(`  lesson[${lessonIndex}]`, {
                id: lesson.id,
                name: lesson.name,
                slug: lesson.slug,
                orderIndex: lesson.orderIndex,
                sectionId: lesson.section?.id,
            });
        });
    });

    console.groupEnd();
}

export const useRoadmap = (slug: string, selectedCourseId?: string) => {
    const [data, setData] = useState<RoadmapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const enrollingLessonIdsRef = useRef<Set<string>>(new Set());
    const courseEnrollTriggeredRef = useRef<Set<string>>(new Set());
    const currentCourseRef = useRef<CurrentCourseRef | null>(null);

    const persistLocalEnrolledCourse = useCallback((course: CurrentCourseRef) => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(LOCAL_ENROLLED_KEY);
            const parsed = raw ? (JSON.parse(raw) as Array<{ slug: string; label: string }>) : [];
            const list = Array.isArray(parsed) ? parsed : [];
            if (list.some((item) => item.slug === course.slug)) return;
            list.unshift({ slug: course.slug, label: course.name });
            localStorage.setItem(LOCAL_ENROLLED_KEY, JSON.stringify(list));
        } catch {
            // Keep UX non-blocking.
        }
    }, []);

    const buildRoadmap = useCallback(
        (theme: Theme, sections: SectionWithLessons[], enrolledIds: Set<string>): RoadmapData => {
            const allLessons = sections.flatMap((section) => section.lessons);
            const firstIncomplete = allLessons.find((lesson) => !enrolledIds.has(lesson.id));

            let completedLessonCount = 0;
            let continueLesson: RoadmapData['continueLesson'];

            const mappedSections = sections.map((section) => {
                const lessons = section.lessons;

                const nodes: LessonNode[] = lessons.map((lesson) => {
                    const isCompleted = enrolledIds.has(lesson.id);
                    if (isCompleted) {
                        completedLessonCount += 1;
                    }

                    const status = isCompleted
                        ? 'completed'
                        : firstIncomplete?.id === lesson.id
                            ? 'active'
                            : 'locked';

                    if (!continueLesson && status === 'active') {
                        continueLesson = {
                            courseInfo: `${section.name} - ${lesson.estimatedDurationMinutes ?? 0} phút`,
                            title: lesson.name,
                            description: lesson.description ?? 'Tiếp tục bài học tiếp theo trong lộ trình của bạn.',
                            link: `/courses/${slug}?courseId=${selectedCourseId ?? theme.id}`,
                        };
                    }

                    return {
                        id: lesson.id,
                        title: lesson.name,
                        status,
                        type: 'lesson',
                    };
                });

                return {
                    id: section.id,
                    title: section.name,
                    nodes,
                };
            });

            return {
                topicTitle: theme.name,
                progress: {
                    current: completedLessonCount,
                    total: Math.max(allLessons.length, 1),
                },
                streak: {
                    days: 0,
                    message: 'Bạn đang xây dựng một thói quen học tập vững chắc. Tiếp tục phát huy nhé!',
                },
                sections: mappedSections,
                continueLesson,
            };
        },
        [slug, selectedCourseId]
    );

    useEffect(() => {
        let cancelled = false;

        async function fetchRoadmap() {
            setIsLoading(true);
            setData(null);

            try {
                const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'));

                // Load course(old-theme) list first, then load sections, then load lessons by section one by one.
                const [courses, progress] = await Promise.all([
                    getCourses(),
                    hasToken
                        ? getProgress().catch(() => [] as UserCourse[])
                        : Promise.resolve([] as UserCourse[]),
                ]);

                const themeById = selectedCourseId ? courses.find((item) => item.id === selectedCourseId) : undefined;
                const themeBySlug = courses.find((item) => item.slug === slug);
                const theme = themeById ?? themeBySlug;

                if (!theme) {
                    if (!cancelled) setData(null);
                    return;
                }

                currentCourseRef.current = {
                    id: theme.id,
                    slug: theme.slug,
                    name: theme.name,
                };

                const sectionDtos = await getCourseSections(theme.id).catch(() => []);
                const sortedSectionDtos = sortByOrder(sectionDtos);

                const sections: SectionWithLessons[] = [];
                for (const section of sortedSectionDtos) {
                    const lessons = await getSectionLessons(section.id).catch(() => [] as Course[]);
                    sections.push({
                        id: section.id,
                        name: section.name,
                        orderIndex: section.orderIndex,
                        lessons: sortByOrder(lessons),
                    });
                }

                debugCourseStructure(theme, sections, selectedCourseId);
                const enrolledFromProgress = new Set(progress.map((item) => item.courseId));

                const mapped = buildRoadmap(theme, sections, enrolledFromProgress);

                if (!cancelled) setData(mapped);
            } catch (error) {
                console.error('Error fetching roadmap:', error);
                if (!cancelled) setData(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchRoadmap();
        return () => {
            cancelled = true;
        };
    }, [slug, selectedCourseId, buildRoadmap]);

    const handleLessonClick = useCallback(async (lessonId: string) => {
        const alreadyCompleted = data?.sections.some((section) =>
            section.nodes.some((node) => node.id === lessonId && node.status === 'completed')
        );

        if (alreadyCompleted || enrollingLessonIdsRef.current.has(lessonId)) {
            return;
        }

        setData((prev) => {
            if (!prev) return prev;
            const nextSections = prev.sections.map((section) => ({
                ...section,
                nodes: section.nodes.map((node): LessonNode => {
                    if (node.id === lessonId) {
                        return { ...node, status: 'completed' };
                    }
                    return node;
                }),
            }));

            const completed = nextSections.flatMap((s) => s.nodes).filter((n) => n.status === 'completed').length;
            const allNodes = nextSections.flatMap((s) => s.nodes);
            const firstPending = allNodes.find((n) => n.status !== 'completed');

            const normalizedSections = nextSections.map((section) => ({
                ...section,
                nodes: section.nodes.map((node): LessonNode => {
                    if (node.status === 'completed') return node;
                    const nextStatus: LessonNode['status'] = firstPending && node.id === firstPending.id ? 'active' : 'locked';
                    return { ...node, status: nextStatus };
                }),
            }));

            return {
                ...prev,
                progress: {
                    current: completed,
                    total: Math.max(allNodes.length, 1),
                },
                sections: normalizedSections,
            };
        });

        try {
            enrollingLessonIdsRef.current.add(lessonId);
            const currentCourse = currentCourseRef.current;
            if (currentCourse) {
                persistLocalEnrolledCourse(currentCourse);
                if (!courseEnrollTriggeredRef.current.has(currentCourse.id)) {
                    courseEnrollTriggeredRef.current.add(currentCourse.id);
                    await enrollCourse(currentCourse.id);
                }
            }
        } catch (error) {
            console.error('Enroll on lesson click failed:', error);
        } finally {
            enrollingLessonIdsRef.current.delete(lessonId);
        }
    }, [data, persistLocalEnrolledCourse]);

    return {
        data,
        isLoading,
        handleLessonClick,
    };
};

