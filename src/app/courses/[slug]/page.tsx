import { CoursesScreen } from '@/features/courses';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ courseId?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    // In real API: fetch course title by slug
    return {
        title: `Khoá học - Medicology`,
        description: `Bản đồ học tập cho khóa học ${slug}`,
    };
}

export default async function CourseRoadmapPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { courseId } = await searchParams;
    return <CoursesScreen slug={slug} selectedCourseId={courseId} />;
}
