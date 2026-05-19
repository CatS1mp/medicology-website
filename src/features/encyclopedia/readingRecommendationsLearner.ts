import { getRecommendationContext } from '@/shared/api/learning';
import { recommendArticlesFromAttempts, type DictionaryArticleRecommendationResponse } from '@/features/encyclopedia/api';

export async function fetchLearnerReadingRecommendations(): Promise<DictionaryArticleRecommendationResponse> {
    const recentAttempts = await getRecommendationContext(8);
    return recommendArticlesFromAttempts({
        recentAttempts: recentAttempts.map((item) => ({
            contentId: item.contentId,
            contentName: item.contentName,
            tags: [item.courseName, item.sectionName].filter(Boolean) as string[],
            submittedAt: item.submittedAt,
            passed: item.passed,
        })),
        limit: 3,
    });
}
