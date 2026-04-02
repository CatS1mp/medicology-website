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
import { useDashboard } from '../hooks/useDashboard';

export const DashboardScreen: React.FC = () => {
    const { handleLogout } = useLogout();
    const {
        userName,
        totalLessons,
        statCards,
        weeklyChartData,
        courseCards,
        learningResults,
        learningProgress,
        isLoading,
    } = useDashboard();

    if (isLoading) {
        return (
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                <AppSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Đang tải...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <AppHeader onLogout={handleLogout} />

                {/* Page body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-5 p-5 min-h-full">
                        {/* Hero Banner */}
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
                                        data={weeklyChartData}
                                        totalLessons={totalLessons}
                                        weeklyDelta={0}
                                    />
                                </div>

                                {/* Continue learning */}
                                {courseCards.length > 0 && <ContinueLearning courses={courseCards} />}
                            </div>

                            {/* Right panel */}
                            <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                                <LearningResultsChart
                                    data={learningResults}
                                    currentScore={0}
                                />
                                {learningProgress.length > 0 && (
                                    <LearningProgress items={learningProgress} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
