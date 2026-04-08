import { useEffect, useMemo, useState } from 'react';
import { getEnrolledCourses, getProgress } from '@/shared/api/learning';
import type { MyCourseCardModel } from '../components/MyCourseCard';

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
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 6;

    useEffect(() => {
        let cancelled = false;

        async function fetchEnrolledCourses() {
            setIsLoading(true);
            try {
                const [enrolledCourses, progress] = await Promise.all([
                    getEnrolledCourses(),
                    getProgress().catch(() => []),
                ]);

                if (cancelled) return;

                const progressBySlug = new Map(progress.map((item) => [item.courseSlug, item]));
                const mappedCourses = enrolledCourses.map((course) => {
                    const sections = course.sections ?? [];
                    const lessonCount = sections.reduce(
                        (sum, section) => sum + (section.lessons?.length ?? 0),
                        0
                    );
                    const courseProgress = progressBySlug.get(course.slug);

                    return {
                        id: course.id,
                        name: course.name,
                        slug: course.slug,
                        description: course.description ?? 'Khóa học đang được cá nhân hóa cho hành trình học tập của bạn.',
                        iconFileName: course.iconFileName ?? '/images/Others/earth.png',
                        sectionCount: sections.length,
                        lessonCount,
                        completionPercent: courseProgress?.completionPercent ?? 0,
                        lastStudiedAt: courseProgress?.lastStudiedAt ?? null,
                    };
                });

                setCourses(mappedCourses);
            } catch {
                if (!cancelled) setCourses([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchEnrolledCourses();
        return () => {
            cancelled = true;
        };
    }, []);

    const totalPages = Math.ceil(courses.length / limit);
    const paginatedCourses = useMemo(
        () => courses.slice((page - 1) * limit, page * limit),
        [courses, page]
    );

    const cards = useMemo<MyCourseCardModel[]>(
        () =>
            paginatedCourses.map((course) => ({
                id: course.id,
                slug: course.slug,
                title: course.name,
                description: course.description ?? '',
                imageUrl: course.iconFileName ?? '/images/Others/earth.png',
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
        totalItems: courses.length,
    };
}
