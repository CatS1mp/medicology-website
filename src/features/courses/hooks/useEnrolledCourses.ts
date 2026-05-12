import { useEffect, useMemo, useState } from 'react';
import { getEnrolledCoursesPaged, getProgress } from '@/shared/api/learning';
import type { MyCourseCardModel } from '../components/MyCourseCard';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';

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

export function useEnrolledCourses() {
    const [courses, setCourses] = useState<EnrolledCourseListItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 6;

    useEffect(() => {
        let cancelled = false;

        async function fetchEnrolledCourses() {
            setIsLoading(true);
            try {
                const [enrolledCourses, progress] = await Promise.all([
                    getEnrolledCoursesPaged({ page: page - 1, size: limit }),
                    getProgress().catch(() => []),
                ]);

                if (cancelled) return;

                const progressBySlug = new Map(progress.map((item) => [item.courseSlug, item]));
                const mappedCourses = enrolledCourses.items.map((course) => {
                    const sections = course.sections ?? [];
                    const lessonCount =
                        course.contentCount ??
                        sections.reduce((sum, section) => sum + (section.contents?.length ?? 0), 0);
                    const sectionCount = course.sectionCount ?? sections.length;
                    const courseProgress = progressBySlug.get(course.slug);

                    return {
                        id: course.id,
                        name: course.name,
                        slug: course.slug,
                        description: course.description ?? 'Khóa học đang được cá nhân hóa cho hành trình học tập của bạn.',
                        iconFileName: resolveCourseIconSrc(course.iconFileName),
                        sectionCount,
                        lessonCount,
                        completionPercent: courseProgress?.completionPercent ?? 0,
                        lastStudiedAt: courseProgress?.lastStudiedAt ?? null,
                    };
                });

                setCourses(mappedCourses);
                setTotalItems(enrolledCourses.total);
            } catch {
                if (!cancelled) {
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

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const paginatedCourses = useMemo(() => courses, [courses]);

    const cards = useMemo<MyCourseCardModel[]>(
        () =>
            paginatedCourses.map((course) => ({
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
        [paginatedCourses]
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
