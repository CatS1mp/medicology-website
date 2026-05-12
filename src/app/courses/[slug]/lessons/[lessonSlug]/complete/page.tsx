import { LessonCompleteScreen } from '@/features/courses/components/LessonCompleteScreen';

interface Props {
    params: Promise<{ slug: string; lessonSlug: string }>;
}

export default async function LessonCompletePage({ params }: Props) {
    const { slug, lessonSlug } = await params;
    return <LessonCompleteScreen courseSlug={slug} lessonSlug={lessonSlug} />;
}
