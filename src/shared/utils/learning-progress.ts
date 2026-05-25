import type { AttemptSummaryResponse } from '@/shared/types/assessment';
import type { CourseProgressResponse, CourseResponse } from '@/shared/types/learning';

export function toClampedPercent(value: unknown): number {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function getProgressPercent(progress: CourseProgressResponse | undefined): number {
    if (!progress) return 0;
    const aliases = progress as CourseProgressResponse & {
        completionPercentage?: number;
        completedPercentage?: number;
        progressPercent?: number;
        percentComplete?: number;
    };
    return toClampedPercent(
        aliases.completionPercent ??
        aliases.completionPercentage ??
        aliases.completedPercentage ??
        aliases.progressPercent ??
        aliases.percentComplete
    );
}

export function getAttemptTimestamp(attempt: Pick<AttemptSummaryResponse, 'submittedAt' | 'startedAt'>): number {
    const value = Date.parse(attempt.submittedAt ?? attempt.startedAt);
    return Number.isNaN(value) ? 0 : value;
}

export function getMainFinalizedAttempts(attempts: AttemptSummaryResponse[]): AttemptSummaryResponse[] {
    const attemptsByContentId = new Map<string, AttemptSummaryResponse[]>();
    attempts
        .filter((item) => item.status === 'FINALIZED' && item.score !== null)
        .forEach((attempt) => {
            const current = attemptsByContentId.get(attempt.contentId) ?? [];
            current.push(attempt);
            attemptsByContentId.set(attempt.contentId, current);
        });

    return [...attemptsByContentId.values()].map((contentAttempts) => {
        const passedAttempts = contentAttempts.filter((attempt) => attempt.passed === true);
        const candidates = passedAttempts.length > 0 ? passedAttempts : contentAttempts;
        return candidates.reduce((latest, attempt) => (
            getAttemptTimestamp(attempt) >= getAttemptTimestamp(latest) ? attempt : latest
        ));
    });
}

export function getCourseContentIds(course: CourseResponse): string[] {
    return (course.sections ?? []).flatMap((section) => (section.contents ?? []).map((content) => content.id));
}

export function getCourseAttemptProgressData(course: CourseResponse, attempts: AttemptSummaryResponse[]) {
    const contentIds = getCourseContentIds(course);
    const contentIdSet = new Set(contentIds);
    const mainAttempts = getMainFinalizedAttempts(attempts.filter((attempt) => contentIdSet.has(attempt.contentId)));
    const passedContentIds = new Set(
        mainAttempts
            .filter((attempt) => attempt.passed === true)
            .map((attempt) => attempt.contentId)
    );
    const latestAttempt = attempts
        .filter((attempt) => contentIdSet.has(attempt.contentId))
        .reduce<AttemptSummaryResponse | null>((latest, attempt) => {
            if (!latest || getAttemptTimestamp(attempt) > getAttemptTimestamp(latest)) {
                return attempt;
            }
            return latest;
        }, null);

    return {
        completionPercent: contentIds.length === 0 ? null : toClampedPercent((passedContentIds.size * 100) / contentIds.length),
        lastStudiedAt: latestAttempt?.submittedAt ?? latestAttempt?.startedAt ?? null,
        completedContentIds: [...passedContentIds],
    };
}
