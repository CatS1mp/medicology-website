import { LessonScreen } from '@/features/courses/components/LessonScreen';

interface Props {
    params: Promise<{ slug: string; lessonSlug: string }>;
}

export default async function CourseLessonPage({ params }: Props) {
    const { slug, lessonSlug } = await params;
    return <LessonScreen courseSlug={slug} lessonSlug={lessonSlug} />;
}
