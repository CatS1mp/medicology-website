import { redirect } from 'next/navigation';
import { enrolledCourses } from '@/features/courses/data/mockRoadmap';

// /courses has no content of its own — redirect to the first enrolled course.
// When API is integrated, fetch the user's most recent course and redirect there.
export default function CoursesIndexPage() {
    const firstCourse = enrolledCourses[0];
    if (firstCourse) {
        redirect(`/courses/${firstCourse.slug}`);
    }
    // Fallback if no enrolled courses
    redirect('/topics');
}
