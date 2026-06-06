'use client';

import React from 'react';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { StatsCards } from './StatsCards';
import { LessonProgressChart } from './LessonProgressChart';
import { LearningResultsChart } from './LearningResultsChart';
import { LearningProgress } from './LearningProgress';
import { DashboardLoadingScreen } from '@/shared/components/DashboardLoadingScreen';
import { DashboardSkeleton } from './DashboardSkeleton';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { getContentActivity, getCourses, getDashboardProgress } from '@/shared/api/learning';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';
import { useUserStore } from '@/shared/store/useUserStore';
import { ChartDataPoint, LearningProgressItem, LearningResultPoint, LessonActivityDataset, LessonActivityRange, StatCard } from '../types';
import type { AttemptSummaryResponse } from '@/shared/types/assessment';
import type { CourseProgressResponse, CourseResponse } from '@/shared/types/learning';
import { getCourseAttemptProgressData, getMainFinalizedAttempts } from '@/shared/utils/learning-progress';

function mapActivityToChart(
    activities: { date: string; completedContents: number }[],
    label: LessonActivityRange
): LessonActivityDataset {
    const data: ChartDataPoint[] = activities.map((item) => {
        const date = new Date(item.date);
        return {
            day: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
            date: date.toLocaleDateString('vi-VN'),
            value: item.completedContents ?? 0,
        };
    });
    const totalCompletedLessons = data.reduce((sum, item) => sum + item.value, 0);
    return { label, data, totalCompletedLessons };
}

function scoreToTenScale(score: number, maxScore: number): number {
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
    return Math.max(0, Math.min(10, (score / maxScore) * 10));
}

function getLessonCount(courses: CourseResponse[]): number {
    return courses.reduce(
        (sum, course) =>
            sum +
            (course.sections ?? []).reduce(
                (sectionSum, section) => sectionSum + (section.contents?.length ?? 0),
                0
            ),
        0
    );
}

function buildRecentResults(attempts: AttemptSummaryResponse[]): LearningResultPoint[] {
    return getMainFinalizedAttempts(attempts)
        .filter((attempt) => typeof attempt.maxScore === 'number' && attempt.maxScore > 0)
        .slice(-6)
        .map((attempt) => ({
            label: new Date(attempt.submittedAt ?? attempt.startedAt).toLocaleDateString('vi-VN', { weekday: 'short' }),
            actual: scoreToTenScale(Number(attempt.score ?? 0), Number(attempt.maxScore ?? 0)),
            target: 8,
        }));
}

function buildProgressItems(
    courses: CourseResponse[],
    progress: CourseProgressResponse[],
    attempts: AttemptSummaryResponse[]
): LearningProgressItem[] {
    const sortedCourses = courses.slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const courseBySlug = new Map(sortedCourses.map((course) => [course.slug, course]));
    const courseById = new Map(sortedCourses.map((course) => [course.id, course]));

    return progress
        .filter((item) => item.courseName.trim().toLowerCase() !== 'học tiếp thôi nào!')
        .map((item) => {
            const course = courseById.get(item.courseId) ?? courseBySlug.get(item.courseSlug);
            const attemptProgress = course ? getCourseAttemptProgressData(course, attempts) : null;
            return {
                id: item.courseId,
                subject: item.courseName,
                courseSlug: item.courseSlug,
                completionPercent: attemptProgress?.completionPercent ?? item.completionPercent ?? 0,
                color: course?.colorCode || '#3B82F6',
                icon: '📘',
                imageUrl: resolveCourseIconSrc(course?.iconFileName),
            };
        })
        .sort((a, b) => {
            const aCompleted = a.completionPercent >= 100;
            const bCompleted = b.completionPercent >= 100;
            if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
            if (!aCompleted && a.completionPercent !== b.completionPercent) {
                return b.completionPercent - a.completionPercent;
            }
            return 0;
        })
        .slice(0, 5);
}

export const DashboardScreen: React.FC = () => {
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const hasSeenDashboardLoading = useUserStore((state) => state.hasSeenDashboardLoading);
    const setHasSeenDashboardLoading = useUserStore((state) => state.setHasSeenDashboardLoading);
    const storeCourses = useUserStore((state) => state.courses);
    const storeProgress = useUserStore((state) => state.courseProgress);
    const storeAttempts = useUserStore((state) => state.attempts);
    const canRenderFromUserData = hasSeenDashboardLoading && (storeProgress.length > 0 || storeCourses.length > 0);
    const initialResults = canRenderFromUserData ? buildRecentResults(storeAttempts) : [];
    const initialProgressItems = canRenderFromUserData
        ? buildProgressItems(storeCourses, storeProgress, storeAttempts)
        : [];

    const [lessonActivityDataset, setLessonActivityDataset] = React.useState<LessonActivityDataset | null>(null);
    const [activeRange, setActiveRange] = React.useState<LessonActivityRange>('last7');
    const [isLessonActivityLoading, setIsLessonActivityLoading] = React.useState(!canRenderFromUserData);
    const [learningResults, setLearningResults] = React.useState<LearningResultPoint[]>(initialResults);
    const [learningProgress, setLearningProgress] = React.useState<LearningProgressItem[]>(initialProgressItems);
    const [totalLessons, setTotalLessons] = React.useState(() => canRenderFromUserData ? getLessonCount(storeCourses) : 0);
    const [averageScore, setAverageScore] = React.useState(() => {
        const values = initialResults.map((item) => item.actual);
        return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    });
    const [activeCourseCount, setActiveCourseCount] = React.useState(() =>
        canRenderFromUserData ? (storeProgress.length || storeCourses.length) : 0
    );
    const [isDashboardLoading, setIsDashboardLoading] = React.useState(!canRenderFromUserData);
    const [showBotOverlay] = React.useState(!hasSeenDashboardLoading);
    const [hasDataError, setHasDataError] = React.useState(false);

    const statCards: StatCard[] = [
        { id: 'streak', icon: '🔥', value: streakDays ?? 0, label: 'Chuỗi ngày học', color: 'text-orange-500' },
        { id: 'score', icon: '⭐', value: `${averageScore.toFixed(1)}/10`, label: 'Điểm đánh giá gần đây', color: 'text-yellow-500' },
        { id: 'courses', icon: '📘', value: activeCourseCount, label: 'Khóa học đang theo dõi', color: 'text-blue-500' },
    ];

    React.useEffect(() => {
        let cancelled = false;

        async function run() {
            setIsDashboardLoading(!canRenderFromUserData);
            try {
                const activityDays = 7;
                const dashboardPromise = getDashboardProgress(activityDays);
                const coursesPromise = storeCourses.length > 0
                    ? Promise.resolve(storeCourses)
                    : getCourses().catch(() => []);
                const minimumLoadingPromise = hasSeenDashboardLoading
                    ? Promise.resolve()
                    : new Promise((resolve) => window.setTimeout(resolve, 2000));

                const [dashboard, courses] = await Promise.all([
                    dashboardPromise,
                    coursesPromise,
                    minimumLoadingPromise,
                ]).then(([dashboardResult, coursesResult]) => [dashboardResult, coursesResult] as const);

                if (cancelled) return;

                const sortedCourses = courses.slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
                const progress = dashboard.courses ?? [];
                const resolvedProgressItems = progress
                    .filter((item) => item.courseName.trim().toLowerCase() !== 'học tiếp thôi nào!')
                    .slice(0, 5)
                    .map((item) => {
                        const course = sortedCourses.find(
                            (candidate) => candidate.id === item.courseId || candidate.slug === item.courseSlug
                        );
                        return {
                            id: item.courseId,
                            subject: item.courseName,
                            courseSlug: item.courseSlug,
                            completionPercent: item.completionPercent ?? 0,
                            color: course?.colorCode || '#3B82F6',
                            icon: '📘',
                            imageUrl: resolveCourseIconSrc(course?.iconFileName),
                        };
                    });

                setAverageScore(dashboard.averageScoreOnTenScale ?? 0);
                setActiveCourseCount(progress.length);
                setTotalLessons(getLessonCount(sortedCourses));
                setLessonActivityDataset(mapActivityToChart(dashboard.activity.activities, 'last7'));
                setLearningResults(
                    (dashboard.recentGradedAttempts ?? []).map((attempt) => ({
                        label: new Date(attempt.submittedAt).toLocaleDateString('vi-VN', { weekday: 'short' }),
                        actual: attempt.scoreOnTenScale,
                        target: 8,
                    }))
                );
                setLearningProgress(resolvedProgressItems);

                const urlsToPreload = resolvedProgressItems.map((item) => item.imageUrl).filter(Boolean) as string[];
                await Promise.all(
                    urlsToPreload.map(
                        (url) =>
                            new Promise((resolve) => {
                                const img = new Image();
                                img.onload = resolve;
                                img.onerror = resolve;
                                img.src = url;
                            })
                    )
                );

                if (!hasSeenDashboardLoading) {
                    setHasSeenDashboardLoading(true);
                }
            } catch {
                if (cancelled) return;
                if (!canRenderFromUserData) {
                    setHasDataError(true);
                    setLessonActivityDataset({
                        label: 'last7',
                        data: [{ day: 'Hôm nay', date: new Date().toLocaleDateString('vi-VN'), value: 0 }],
                        totalCompletedLessons: 0,
                    });
                }
            } finally {
                if (!cancelled) {
                    setIsDashboardLoading(false);
                }
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [canRenderFromUserData, hasSeenDashboardLoading, setHasSeenDashboardLoading, storeCourses]);

    React.useEffect(() => {
        let cancelled = false;
        async function loadLessonActivity() {
            setIsLessonActivityLoading(true);
            try {
                const days = activeRange === 'last7' ? 7 : 14;
                const activity = await getContentActivity(days);
                if (cancelled) return;
                setLessonActivityDataset(mapActivityToChart(activity.activities, activeRange));
            } catch {
                if (!cancelled) {
                    setLessonActivityDataset({
                        label: activeRange,
                        data: [{ day: 'Hôm nay', date: new Date().toLocaleDateString('vi-VN'), value: 0 }],
                        totalCompletedLessons: 0,
                    });
                }
            } finally {
                if (!cancelled) setIsLessonActivityLoading(false);
            }
        }

        if (!isDashboardLoading) {
            loadLessonActivity();
        }
        return () => {
            cancelled = true;
        };
    }, [activeRange, isDashboardLoading]);

    const effectiveStreak = streakDays ?? 0;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {isDashboardLoading && showBotOverlay && <DashboardLoadingScreen />}
            <AppSidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={effectiveStreak} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto">
                    {hasDataError && (
                        <div className="mx-3 mt-3 sm:mx-5 sm:mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.</span>
                        </div>
                    )}
                    {isDashboardLoading ? (
                        <DashboardSkeleton />
                    ) : (
                        <div className="flex min-h-full flex-col gap-5 p-3 sm:p-5">
                            <div className="flex flex-col gap-5 xl:flex-row">
                                <div className="flex-1 min-w-0 flex flex-col gap-5">
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-800 mb-3">Thống kê</h2>
                                        <StatsCards cards={statCards} />
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-bold text-gray-800 mb-3">Tiến độ bài học</h2>
                                        <LessonProgressChart
                                            datasets={lessonActivityDataset ? [lessonActivityDataset] : [{
                                                label: activeRange,
                                                data: [{ day: 'Hôm nay', date: new Date().toLocaleDateString('vi-VN'), value: 0 }],
                                                totalCompletedLessons: 0,
                                            }]}
                                            totalLessons={totalLessons}
                                            activeRange={activeRange}
                                            onRangeChange={setActiveRange}
                                            isLoading={isLessonActivityLoading}
                                        />
                                    </div>
                                </div>

                                <div className="w-full flex-shrink-0 flex flex-col gap-4 xl:w-72">
                                    <LearningResultsChart
                                        data={learningResults.length ? learningResults : [{ label: 'N/A', actual: 0, target: 8 }]}
                                        currentScore={Number(String(statCards.find((card) => card.id === 'score')?.value ?? '0').split('/')[0])}
                                    />
                                    <LearningProgress items={learningProgress} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
