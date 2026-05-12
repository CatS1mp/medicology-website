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
import { RoadmapSkeleton } from './RoadmapSkeleton';
import { DEFAULT_COURSE_ICON } from '@/shared/utils/course-icon';

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

    const roadmapBackgroundImage = data?.courseImageUrl || DEFAULT_COURSE_ICON;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <AppSidebar lockScroll />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />

                <div className="relative flex-1 overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                        <div
                            className="absolute inset-0 roadmap-course-bg transition-all duration-500 ease-out"
                            style={{
                                backgroundImage: `url("${roadmapBackgroundImage}")`,
                            }}
                        />
                        <div className="absolute inset-0 backdrop-blur-[1px]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/70 to-gray-50/92" />
                    </div>

                    <div className="relative z-10 h-full w-full overflow-y-auto">
                        <div className="w-full max-w-4xl mx-auto px-6 py-12 lg:px-12 flex flex-col min-h-full pb-32">
                            {isLoading ? (
                                <RoadmapSkeleton />
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

                                    <div className="mx-auto w-full max-w-2xl mt-8">
                                        {data.sections.map((section) => (
                                            <RoadmapSection key={section.id} section={section} onLessonSelect={handleLessonSelect} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {!isLoading && data?.continueLesson && (
                    <ContinueLearningBar data={data.continueLesson} />
                )}
            </div>

            {selectedCompletedLesson ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#bfe6fb] bg-white shadow-[0_24px_64px_-12px_rgba(28,161,242,0.35)]"
                        role="dialog"
                        aria-labelledby="roadmap-complete-dialog-title"
                        aria-describedby="roadmap-complete-dialog-desc"
                    >
                        <div className="border-b border-[#bfe6fb] bg-gradient-to-r from-[#e8f6fe] via-[#f3fbff] to-[#eef9ff] px-6 py-5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2aa4e8]">Xác nhận vào học</p>
                            <h3 id="roadmap-complete-dialog-title" className="mt-2 text-xl font-extrabold text-[#126b98]">
                                {selectedCompletedLesson.title}
                            </h3>
                        </div>
                        <div className="px-6 py-5">
                            <p id="roadmap-complete-dialog-desc" className="text-sm leading-relaxed text-gray-600">
                                Bạn đã hoàn thành nội dung này. Bạn muốn <span className="font-semibold text-gray-800">vào học lại</span> từ đầu,{' '}
                                <span className="font-semibold text-gray-800">xem kết quả / bài đã chấm</span>, hay đóng hộp thoại?
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleRetryLesson}
                                    className="w-full rounded-xl border border-[#1CA1F2] bg-gradient-to-b from-[#1CA1F2] to-[#1999e5] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_0_#126b98] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_2px_0_0_#126b98]"
                                >
                                    Vào học lại
                                </button>
                                <button
                                    type="button"
                                    onClick={handleViewResult}
                                    className="w-full rounded-xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm font-semibold text-[#126b98] shadow-sm transition hover:bg-[#e8f6fe]"
                                >
                                    Xem kết quả
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCompletedLesson(null)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
