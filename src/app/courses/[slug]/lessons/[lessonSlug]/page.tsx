import { Suspense } from 'react';
import { LessonScreen } from '@/features/courses/components/LessonScreen';
import { Skeleton } from '@/shared/components/Skeleton';

interface Props {
    params: Promise<{ slug: string; lessonSlug: string }>;
}

function LessonPageFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-8">
            <Skeleton className="h-72 w-full max-w-4xl rounded-3xl" />
        </div>
    );
}

export default async function CourseLessonPage({ params }: Props) {
    const { slug, lessonSlug } = await params;
    return (
        <Suspense fallback={<LessonPageFallback />}>
            <LessonScreen courseSlug={slug} lessonSlug={lessonSlug} />
        </Suspense>
    );
}
