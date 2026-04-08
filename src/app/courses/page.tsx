'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCourses } from '@/shared/api/learning';

// /courses has no content of its own — redirect to the first available course.
// We do this on the client because auth tokens are stored in localStorage.
export default function CoursesIndexPage() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                const courses = await getCourses();
                const first = courses.slice().sort((a, b) => a.orderIndex - b.orderIndex)[0];
                if (!cancelled && first) {
                    router.replace(`/courses/${first.slug}`);
                    return;
                }
            } catch {
                // ignore
            }
            if (!cancelled) router.replace('/topics');
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [router]);

    return null;
}
