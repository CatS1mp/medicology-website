'use client';

import React from 'react';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { useRoadmap } from '../hooks/useRoadmap';
import { RoadmapHeader } from './RoadmapHeader';
import { RoadmapSection } from './RoadmapSection';
import { ContinueLearningBar } from './ContinueLearningBar';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';

interface CoursesScreenProps {
    slug: string;
}

import { BaseUserLayout } from '@/shared/components/BaseUserLayout';

export const CoursesScreen: React.FC<CoursesScreenProps> = ({ slug }) => {
    const { data, isLoading } = useRoadmap(slug);
    const { streakDays } = useLearningStreak();

    return (
        <BaseUserLayout streak={streakDays ?? 0} padding={0}>
            <div className="flex-1 flex flex-col relative">
                <div className="flex-1 w-full relative">
                    <div className="w-full max-w-4xl mx-auto px-6 py-12 lg:px-12 flex flex-col min-h-full pb-32">
                        {isLoading ? (
                            <div className="flex-1 flex justify-center items-center text-gray-500">
                                Đang tải bản đồ khóa học...
                            </div>
                        ) : !data ? (
                            <div className="flex-1 flex justify-center items-center text-gray-500">
                                Không tìm thấy khóa học.
                            </div>
                        ) : (
                            <>
                                <RoadmapHeader 
                                    title={data.topicTitle} 
                                    progress={data.progress} 
                                    streak={{ ...data.streak, days: streakDays ?? data.streak.days }} 
                                />

                                <div className="mt-8">
                                    {data.sections.map((section) => (
                                        <RoadmapSection key={section.id} section={section} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {!isLoading && data?.continueLesson && (
                    <ContinueLearningBar data={data.continueLesson} />
                )}
            </div>
        </BaseUserLayout>
    );
};