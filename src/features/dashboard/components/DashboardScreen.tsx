'use client';

import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { HeroBanner } from './HeroBanner';
import { StatsCards } from './StatsCards';
import { LessonProgressChart } from './LessonProgressChart';
import { ContinueLearning } from './ContinueLearning';
import { LearningResultsChart } from './LearningResultsChart';
import { LearningProgress } from './LearningProgress';
import {
    mockUser,
    mockStatCards,
    mockWeeklyChartData,
    mockCourseCards,
    mockLearningResults,
    mockLearningProgress,
} from '../data/mockData';

export const DashboardScreen: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <DashboardSidebar />

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <DashboardHeader streak={mockUser.streak} />

                {/* Page body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-5 p-5 min-h-full">
                        {/* Hero Banner — full width across entire content area */}
                        <HeroBanner userName={mockUser.name} />

                        {/* Below banner: main content + right panel */}
                        <div className="flex gap-5">
                            {/* Left / center main content */}
                            <div className="flex-1 min-w-0 flex flex-col gap-5">
                                {/* Stats */}
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 mb-3">Thống kê</h2>
                                    <StatsCards cards={mockStatCards} />
                                </div>

                                {/* Lesson progress chart */}
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 mb-3">Tiến độ bài học</h2>
                                    <LessonProgressChart
                                        data={mockWeeklyChartData}
                                        totalLessons={mockUser.totalLessons}
                                        weeklyDelta={12}
                                    />
                                </div>

                                {/* Continue learning */}
                                <ContinueLearning courses={mockCourseCards} />
                            </div>

                            {/* Right panel */}
                            <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                                <LearningResultsChart
                                    data={mockLearningResults}
                                    currentScore={mockUser.score}
                                />
                                <LearningProgress items={mockLearningProgress} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
