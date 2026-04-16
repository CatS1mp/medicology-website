'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { useRoadmap } from '../hooks/useRoadmap';
import { RoadmapHeader } from './RoadmapHeader';
import { RoadmapSection } from './RoadmapSection';
import { ContinueLearningBar } from './ContinueLearningBar';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { LessonNode } from '../types';
import { sanitizeAppHref } from '@/shared/utils/navigation';

interface CoursesScreenProps {
    slug: string;
}

export const CoursesScreen: React.FC<CoursesScreenProps> = ({ slug }) => {
    const router = useRouter();
    const { data, isLoading } = useRoadmap(slug);
    const { streakDays } = useLearningStreak();
    const [selectedCompletedLesson, setSelectedCompletedLesson] = useState<LessonNode | null>(null);

    const { handleLogout } = useLogout();

    const handleLessonSelect = useCallback((node: LessonNode) => {
        if (!node.href) return;
        if (node.status === 'completed') {
            setSelectedCompletedLesson(node);
            return;
        }
        router.push(sanitizeAppHref(node.href, `/courses/${slug}`));
    }, [router, slug]);

    const handleRetryLesson = useCallback(() => {
        if (!selectedCompletedLesson?.href) return;
        router.push(sanitizeAppHref(selectedCompletedLesson.href, `/courses/${slug}`));
        setSelectedCompletedLesson(null);
    }, [router, selectedCompletedLesson, slug]);

    const handleViewResult = useCallback(() => {
        if (!selectedCompletedLesson?.href) return;
        const safeHref = sanitizeAppHref(selectedCompletedLesson.href, `/courses/${slug}`);
        router.push(`${safeHref}?mode=review`);
        setSelectedCompletedLesson(null);
    }, [router, selectedCompletedLesson, slug]);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <AppSidebar />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto w-full relative">
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
                                        <RoadmapSection key={section.id} section={section} onLessonSelect={handleLessonSelect} />
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

            {selectedCompletedLesson ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900">Bài học đã hoàn thành</h3>
                        <p className="mt-2 text-sm text-gray-600">Bạn muốn làm lại bài học hay xem lại kết quả đã chấm?</p>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={handleRetryLesson}
                                className="rounded-xl border border-[#2aa4e8] bg-[#f3fbff] px-4 py-2.5 text-sm font-semibold text-[#126b98]"
                            >
                                Làm lại
                            </button>
                            <button
                                type="button"
                                onClick={handleViewResult}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
                            >
                                Xem kết quả
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedCompletedLesson(null)}
                            className="mt-4 w-full rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};