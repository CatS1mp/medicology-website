import { useEffect, useState } from 'react';
import { getProgress } from '@/shared/api/learning';

interface EnrolledCourse {
    slug: string;
    label: string;
}

const LOCAL_ENROLLED_KEY = 'enrolledCoursesLocal';

function readLocalEnrolledCourses(): EnrolledCourse[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(LOCAL_ENROLLED_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as EnrolledCourse[];
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => Boolean(item?.slug) && Boolean(item?.label));
    } catch {
        return [];
    }
}

function mergeUniqueCourses(primary: EnrolledCourse[], secondary: EnrolledCourse[]): EnrolledCourse[] {
    const map = new Map<string, EnrolledCourse>();
    [...primary, ...secondary].forEach((course) => {
        if (!map.has(course.slug)) {
            map.set(course.slug, course);
        }
    });
    return Array.from(map.values());
}

export function useEnrolledCourses() {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchEnrolledCourses() {
            setIsLoading(true);
            try {
                const progress = await getProgress();
                console.log('Enrolled courses progress:', progress);
                
                // Transform UserCourse[] to EnrolledCourse[]
                const enrolled: EnrolledCourse[] = progress
                    .filter(p => p.course) // Chỉ lấy những course có data
                    .map(p => ({
                        slug: p.course.slug || p.courseId,
                        label: p.course.name || 'Untitled Course',
                    }));

                const localEnrolled = readLocalEnrolledCourses();
                const merged = mergeUniqueCourses(localEnrolled, enrolled);

                if (!cancelled) setCourses(merged);
            } catch (error) {
                console.error('Error fetching enrolled courses:', error);
                const localEnrolled = readLocalEnrolledCourses();
                if (!cancelled) setCourses(localEnrolled);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchEnrolledCourses();
        return () => {
            cancelled = true;
        };
    }, []);

    return { courses, isLoading };
}
