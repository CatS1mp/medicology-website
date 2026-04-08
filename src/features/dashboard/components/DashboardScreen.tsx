'use client';

import React from 'react';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { HeroBanner } from './HeroBanner';
import { StatsCards } from './StatsCards';
import { LessonProgressChart } from './LessonProgressChart';
import { ContinueLearning } from './ContinueLearning';
import { LearningResultsChart } from './LearningResultsChart';
import { LearningProgress } from './LearningProgress';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { getCurrentProfile, getCurrentUser } from '@/features/auth/api';
import { getCourses, getProgress } from '@/shared/api/learning';
import { getMyAttempts } from '@/shared/api/assessment';
import { ChartDataPoint, CourseCard, LearningProgressItem, LearningResultPoint, StatCard } from '../types';

export const DashboardScreen: React.FC = () => {
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const [userName, setUserName] = React.useState('Ban');
    const [statCards, setStatCards] = React.useState<StatCard[]>([
        { id: 'streak', icon: '🔥', value: 0, label: 'Chuỗi ngày học', color: 'text-orange-500' },
        { id: 'score', icon: '⭐', value: '0/10', label: 'Điểm đánh giá gần đây', color: 'text-yellow-500' },
        { id: 'courses', icon: '📘', value: 0, label: 'Khóa học đang theo dõi', color: 'text-blue-500' },
    ]);
    const [weeklyChartData, setWeeklyChartData] = React.useState<ChartDataPoint[]>([]);
    const [courseCards, setCourseCards] = React.useState<CourseCard[]>([]);
    const [learningResults, setLearningResults] = React.useState<LearningResultPoint[]>([]);
    const [learningProgress, setLearningProgress] = React.useState<LearningProgressItem[]>([]);
    const [totalLessons, setTotalLessons] = React.useState(0);
    const [weeklyDelta, setWeeklyDelta] = React.useState(0);

    React.useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const [profile, user, progress, courses, attempts] = await Promise.all([
                    getCurrentProfile().catch(() => null),
                    getCurrentUser().catch(() => null),
                    getProgress().catch(() => []),
                    getCourses().catch(() => []),
                    getMyAttempts().catch(() => []),
                ]);
                if (cancelled) return;

                const name = profile?.displayName || user?.username || 'Ban';
                const averageScore = attempts.filter((item) => item.score !== null).length
                    ? attempts.filter((item) => item.score !== null).reduce((sum, item) => sum + Number(item.score ?? 0), 0) / attempts.filter((item) => item.score !== null).length
                    : 0;
                const sortedCourses = courses.slice().sort((a, b) => a.orderIndex - b.orderIndex);
                const progressBySlug = new Map(progress.map((item) => [item.courseSlug, item]));
                const lessonCount = sortedCourses.reduce((sum, course) => sum + (course.sections ?? []).reduce((sectionSum, section) => sectionSum + (section.lessons?.length ?? 0), 0), 0);

                const today = new Date();
                const week = Array.from({ length: 7 }).map((_, index) => {
                    const date = new Date(today);
                    date.setDate(today.getDate() - (6 - index));
                    const label = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                    const key = date.toISOString().slice(0, 10);
                    const value = attempts.filter((attempt) => (attempt.submittedAt ?? attempt.startedAt)?.slice(0, 10) === key).length;
                    return { day: label, date: date.toLocaleDateString('vi-VN'), value };
                });

                setUserName(name);
                setTotalLessons(lessonCount);
                setWeeklyChartData(week);
                setWeeklyDelta(week.reduce((sum, point) => sum + point.value, 0));
                setStatCards([
                    { id: 'streak', icon: '🔥', value: streakDays ?? 0, label: 'Chuỗi ngày học', color: 'text-orange-500' },
                    { id: 'score', icon: '⭐', value: `${averageScore.toFixed(1)}/10`, label: 'Điểm đánh giá gần đây', color: 'text-yellow-500' },
                    { id: 'courses', icon: '📘', value: progress.length, label: 'Khóa học đang theo dõi', color: 'text-blue-500' },
                ]);
                setCourseCards(sortedCourses.slice(0, 3).map((course) => {
                    const currentProgress = progressBySlug.get(course.slug)?.completionPercent ?? 0;
                    const lessons = course.sections?.flatMap((section) => section.lessons ?? []) ?? [];
                    const completed = Math.round((currentProgress / 100) * Math.max(lessons.length, 1));
                    return {
                        id: course.id,
                        category: course.name.toUpperCase(),
                        categoryColor: course.colorCode || '#3B82F6',
                        title: course.description || course.name,
                        nextLesson: lessons[Math.min(completed, Math.max(lessons.length - 1, 0))]?.name || 'Bat dau khoa hoc',
                        progress: currentProgress,
                        total: Math.max(lessons.length, 1),
                        completed,
                    };
                }));
                setLearningResults(attempts.slice(-6).map((attempt) => ({
                    label: new Date(attempt.submittedAt ?? attempt.startedAt).toLocaleDateString('vi-VN', { weekday: 'short' }),
                    actual: Math.max(0, Math.min(10, Number(attempt.score ?? 0))),
                    target: 8,
                })));
                setLearningProgress(progress.slice(0, 5).map((item) => ({
                    id: item.courseId,
                    subject: item.courseName,
                    completed: item.completionPercent,
                    total: 100,
                    color: sortedCourses.find((course) => course.slug === item.courseSlug)?.colorCode || '#3B82F6',
                    icon: '📘',
                })));
            } catch {
                if (!cancelled) return;
            }
        }
        run();
        return () => { cancelled = true; };
    }, [streakDays]);

    const effectiveStreak = streakDays ?? 0;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <AppHeader streak={effectiveStreak} onLogout={handleLogout} />

                {/* Page body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-5 p-5 min-h-full">
                        {/* Hero Banner — full width across entire content area */}
                        <HeroBanner userName={userName} />

                        {/* Below banner: main content + right panel */}
                        <div className="flex gap-5">
                            {/* Left / center main content */}
                            <div className="flex-1 min-w-0 flex flex-col gap-5">
                                {/* Stats */}
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 mb-3">Thống kê</h2>
                                    <StatsCards cards={statCards} />
                                </div>

                                {/* Lesson progress chart */}
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 mb-3">Tiến độ bài học</h2>
                                    <LessonProgressChart
                                        data={weeklyChartData.length ? weeklyChartData : [{ day: 'Hom nay', date: new Date().toLocaleDateString('vi-VN'), value: 0 }]}
                                        totalLessons={totalLessons}
                                        weeklyDelta={weeklyDelta}
                                    />
                                </div>

                                {/* Continue learning */}
                                <ContinueLearning courses={courseCards} />
                            </div>

                            {/* Right panel */}
                            <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                                <LearningResultsChart
                                    data={learningResults.length ? learningResults : [{ label: 'N/A', actual: 0, target: 8 }]}
                                    currentScore={Number(String(statCards.find((card) => card.id === 'score')?.value ?? '0').split('/')[0])}
                                />
                                <LearningProgress items={learningProgress} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
