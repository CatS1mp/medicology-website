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
import { getCourses, getProgress } from '@/shared/api/learning';
import { getMyAttempts } from '@/shared/api/assessment';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';
import { useUserStore } from '@/shared/store/useUserStore';
import { ChartDataPoint, LearningProgressItem, LearningResultPoint, LessonActivityDataset, LessonActivityRange, StatCard } from '../types';

function scoreToTenScale(score: number, maxScore: number): number {
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
        return 0;
    }

    return Math.max(0, Math.min(10, (score / maxScore) * 10));
}

export const DashboardScreen: React.FC = () => {
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const hasSeenDashboardLoading = useUserStore(state => state.hasSeenDashboardLoading);
    const setHasSeenDashboardLoading = useUserStore(state => state.setHasSeenDashboardLoading);
    
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
                const promises: Promise<any>[] = [
                    getProgress().catch(() => []),
                    getCourses().catch(() => []),
                    getMyAttempts().catch(() => []),
                ];
                
                if (!hasSeenDashboardLoading) {
                    promises.push(new Promise(resolve => setTimeout(resolve, 2000)));
                }

                const [progress, courses, attempts] = (await Promise.all(promises)) as [any[], any[], any[]];
                if (cancelled) return;

                // Preload courses and roadmaps in background to make subsequent visits instant!
                if (!hasSeenDashboardLoading) {
                    (async () => {
                        try {
                            const { preloadEnrolledCourses, enrolledCoursesCache } = await import('@/features/courses/hooks/useEnrolledCourses');
                            const { preloadRoadmap } = await import('@/features/courses/hooks/useRoadmap');
                            
                            await preloadEnrolledCourses(1, 6);
                            
                            const cached = enrolledCoursesCache.get(1);
                            if (cached && cached.items) {
                                const topSlugs = cached.items.slice(0, 3).map(c => c.slug);
                                for (const slug of topSlugs) {
                                    await preloadRoadmap(slug).catch(() => {});
                                }
                            }
                        } catch (e) {
                            console.error('Failed to preload courses', e);
                        }
                    })();
                }

                const finalizedAttempts = attempts.filter((item: any) => item.status === 'FINALIZED' && item.score !== null);
                const sortedCourses = courses.slice().sort((a: any, b: any) => a.orderIndex - b.orderIndex);
                const finalizedGradedAttempts = finalizedAttempts.filter(
                    (item: any) => typeof item.maxScore === 'number' && item.maxScore > 0
                );
                const finalizedAttemptsOnTenScale = finalizedGradedAttempts.map((item) => {
                    const score = Number(item.score ?? 0);
                    const maxScore = typeof item.maxScore === 'number' && item.maxScore > 0 ? item.maxScore : 0;
                    const scoreOnTenScale = scoreToTenScale(score, maxScore);

                    return {
                        ...item,
                        scoreOnTenScale,
                    };
                });

                const averageScore = finalizedAttemptsOnTenScale.length
                    ? finalizedAttemptsOnTenScale.reduce((sum, item) => sum + item.scoreOnTenScale, 0) /
                      finalizedAttemptsOnTenScale.length
                    : 0;
                const finalizedContentIds = new Set(finalizedAttempts.map((item) => item.contentId));
                const completionByCourseId = new Map<string, number>();
                sortedCourses.forEach((course: any) => {
                    const contentIds = (course.sections ?? []).flatMap((section: any) => (section.contents ?? []).map((content: any) => content.id));
                    const completed = contentIds.filter((id: string) => finalizedContentIds.has(id)).length;
                    completionByCourseId.set(course.id, contentIds.length === 0 ? 0 : Math.min(100, Math.round((completed * 100) / contentIds.length)));
                });
                const lessonCount = sortedCourses.reduce((sum: number, course: any) => sum + (course.sections ?? []).reduce((sectionSum: number, section: any) => sectionSum + (section.contents?.length ?? 0), 0), 0);

                setAverageScore(averageScore);
                setActiveCourseCount(progress.length);
                setTotalLessons(lessonCount);
                setLearningResults(finalizedAttemptsOnTenScale.slice(-6).map((attempt) => ({
                    label: new Date(attempt.submittedAt ?? attempt.startedAt).toLocaleDateString('vi-VN', { weekday: 'short' }),
                    actual: attempt.scoreOnTenScale,
                    target: 8,
                })));
                const resolvedProgressItems = progress
                        .filter((item) => item.courseName.trim().toLowerCase() !== 'học tiếp thôi nào!')
                        .slice(0, 5)
                        .map((item) => ({
                            id: item.courseId,
                            subject: item.courseName,
                            courseSlug: item.courseSlug,
                            completionPercent: completionByCourseId.get(item.courseId) ?? 0,
                            color: sortedCourses.find((course) => course.slug === item.courseSlug)?.colorCode || '#3B82F6',
                            icon: '📘',
                            imageUrl: resolveCourseIconSrc(
                                sortedCourses.find((course) => course.id === item.courseId || course.slug === item.courseSlug)?.iconFileName
                            ),
                        }));

                setLearningProgress(resolvedProgressItems);

                // Preload the Supabase course images so they appear instantly when the loading screen drops
                const urlsToPreload = resolvedProgressItems.map(item => item.imageUrl).filter(Boolean) as string[];
                await Promise.all(urlsToPreload.map(url => new Promise((resolve) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = resolve;
                    img.src = url;
                })));
            } catch {
                if (cancelled) return;
            } finally {
                if (!cancelled) {
                    setIsDashboardLoading(false);
                    if (!hasSeenDashboardLoading) {
                        setHasSeenDashboardLoading(true);
                    }
                }
            }
        }
        run();
        return () => { cancelled = true; };
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        async function loadLessonActivity() {
            setIsLessonActivityLoading(true);
            try {
                const days = activeRange === 'last7' ? 7 : 14;
                const attempts = await getMyAttempts().catch(() => []);
                if (cancelled) return;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = new Date(today);
                startDate.setDate(today.getDate() - (days - 1));

                const completedByDay = new Map<string, number>();
                attempts
                    .filter((item) => item.status === 'FINALIZED' && item.submittedAt)
                    .forEach((item) => {
                        const submitted = new Date(item.submittedAt as string);
                        submitted.setHours(0, 0, 0, 0);
                        if (submitted < startDate || submitted > today) return;
                        const key = submitted.toISOString().slice(0, 10);
                        completedByDay.set(key, (completedByDay.get(key) ?? 0) + 1);
                    });

                const activity: ChartDataPoint[] = [];
                for (let offset = 0; offset < days; offset += 1) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + offset);
                    const key = date.toISOString().slice(0, 10);
                    activity.push({
                        day: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
                        date: date.toLocaleDateString('vi-VN'),
                        value: completedByDay.get(key) ?? 0,
                    });
                }
                const totalCompletedLessons = activity.reduce((sum, item) => sum + item.value, 0);

                setLessonActivityDataset({
                    label: activeRange,
                    data: activity,
                    totalCompletedLessons,
                });
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

        loadLessonActivity();
        return () => {
            cancelled = true;
        };
    }, [activeRange]);

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
