import { CoursesScreen } from '@/features/courses';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    // In real API: fetch course title by slug
    return {
        title: `Khoá học - Medicology`,
        description: `Bản đồ học tập cho khóa học ${slug}`,
    };
}

export default async function CourseRoadmapPage({ params }: Props) {
    const { slug } = await params;
    return <CoursesScreen slug={slug} />;
}
