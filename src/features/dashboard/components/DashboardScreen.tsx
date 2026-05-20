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

export const DashboardScreen: React.FC = () => {
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const hasSeenDashboardLoading = useUserStore((state) => state.hasSeenDashboardLoading);
    const setHasSeenDashboardLoading = useUserStore((state) => state.setHasSeenDashboardLoading);

    const [lessonActivityDataset, setLessonActivityDataset] = React.useState<LessonActivityDataset | null>(null);
    const [activeRange, setActiveRange] = React.useState<LessonActivityRange>('last7');
    const [isLessonActivityLoading, setIsLessonActivityLoading] = React.useState(true);
    const [learningResults, setLearningResults] = React.useState<LearningResultPoint[]>([]);
    const [learningProgress, setLearningProgress] = React.useState<LearningProgressItem[]>([]);
    const [totalLessons, setTotalLessons] = React.useState(0);
    const [averageScore, setAverageScore] = React.useState(0);
    const [activeCourseCount, setActiveCourseCount] = React.useState(0);
    const [isDashboardLoading, setIsDashboardLoading] = React.useState(true);
    const [showBotOverlay] = React.useState(!hasSeenDashboardLoading);

    const statCards: StatCard[] = [
        { id: 'streak', icon: '🔥', value: streakDays ?? 0, label: 'Chuỗi ngày học', color: 'text-orange-500' },
        { id: 'score', icon: '⭐', value: `${averageScore.toFixed(1)}/10`, label: 'Điểm đánh giá gần đây', color: 'text-yellow-500' },
        { id: 'courses', icon: '📘', value: activeCourseCount, label: 'Khóa học đang theo dõi', color: 'text-blue-500' },
    ];

    React.useEffect(() => {
        let cancelled = false;

        async function run() {
            setIsDashboardLoading(true);
            try {
                const activityDays = 7;
                const dashboardPromise = getDashboardProgress(activityDays);
                const coursesPromise = getCourses().catch(() => []);
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
                const lessonCount = sortedCourses.reduce(
                    (sum, course) =>
                        sum +
                        (course.sections ?? []).reduce(
                            (sectionSum, section) => sectionSum + (section.contents?.length ?? 0),
                            0
                        ),
                    0
                );

                const progress = dashboard.courses ?? [];
                setAverageScore(dashboard.averageScoreOnTenScale ?? 0);
                setActiveCourseCount(progress.length);
                setTotalLessons(lessonCount);
                setLessonActivityDataset(mapActivityToChart(dashboard.activity.activities, 'last7'));
                setLearningResults(
                    (dashboard.recentGradedAttempts ?? []).map((attempt) => ({
                        label: new Date(attempt.submittedAt).toLocaleDateString('vi-VN', { weekday: 'short' }),
                        actual: attempt.scoreOnTenScale,
                        target: 8,
                    }))
                );

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
                setLessonActivityDataset({
                    label: 'last7',
                    data: [{ day: 'Hôm nay', date: new Date().toLocaleDateString('vi-VN'), value: 0 }],
                    totalCompletedLessons: 0,
                });
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
    }, [hasSeenDashboardLoading, setHasSeenDashboardLoading]);

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
