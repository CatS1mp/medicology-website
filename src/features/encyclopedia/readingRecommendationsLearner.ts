import { getMyAttempts } from '@/shared/api/assessment';
import { getCourses } from '@/shared/api/learning';
import type { AttemptSummaryResponse } from '@/shared/types/assessment';
import type { CourseResponse } from '@/shared/types/learning';
import {
    recommendArticlesFromAttempts,
    type DictionaryArticleRecommendationRequest,
    type DictionaryArticleRecommendationResponse,
} from '@/features/encyclopedia/api';

type ContentMeta = { courseName: string; sectionName: string; name: string };

export function buildContentMetaByIdFromCourses(courses: CourseResponse[]): Map<string, ContentMeta> {
    const contentById = new Map<string, ContentMeta>();
    courses.forEach((courseItem) => {
        (courseItem.sections ?? []).forEach((section) => {
            (section.contents ?? []).forEach((content) => {
                contentById.set(content.id, {
                    courseName: courseItem.name,
                    sectionName: section.name,
                    name: content.name,
                });
            });
        });
    });
    return contentById;
}

export function mapAttemptsToRecommendationPayload(
    attempts: AttemptSummaryResponse[],
    courses: CourseResponse[]
): NonNullable<DictionaryArticleRecommendationRequest['recentAttempts']> {
    const contentById = buildContentMetaByIdFromCourses(courses);
    return attempts
        .filter((attempt) => attempt.status === 'FINALIZED' && !!attempt.submittedAt)
        .sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime())
        .slice(0, 8)
        .map((attempt) => {
            const mapped = contentById.get(attempt.contentId);
            const tags = [mapped?.courseName, mapped?.sectionName].filter(Boolean) as string[];
            return {
                contentId: attempt.contentId,
                contentName: mapped?.name ?? attempt.contentId,
                tags,
                submittedAt: attempt.submittedAt,
                passed: attempt.passed,
            };
        });
}

export async function fetchLearnerReadingRecommendations(): Promise<DictionaryArticleRecommendationResponse> {
    const courses = await getCourses();
    const attempts = await getMyAttempts();
    const recentAttempts = mapAttemptsToRecommendationPayload(attempts, courses);
    return recommendArticlesFromAttempts({
        recentAttempts,
        limit: 3,
    });
}
