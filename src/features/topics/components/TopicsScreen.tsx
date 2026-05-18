'use client';

import React from 'react';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { TopicFilters } from './TopicFilters';
import { TopicCard } from './TopicCard';
import { useTopics } from '../hooks/useTopics';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { TopicCardSkeleton } from './TopicCardSkeleton';

export const TopicsScreen: React.FC = () => {
    const { streakDays } = useLearningStreak();

    const { handleLogout } = useLogout();
    const [enrollStatusCard, setEnrollStatusCard] = React.useState<{
        state: 'loading' | 'done' | 'error';
        title: string;
        message: string;
    } | null>(null);

    const {
        topics,
        filters,
        setFilters,
        page,
        setPage,
        totalPages,
        isLoading,
        enrollingTopicId,
        enrollTopic,
        totalItems,
    } = useTopics();

    const handleEnrollTopic = React.useCallback(async (topicId: string) => {
        const topic = topics.find((item) => item.id === topicId);
        const topicTitle = topic?.title ?? 'chủ đề này';

        setEnrollStatusCard({
            state: 'loading',
            title: 'Đang đăng ký chủ đề',
            message: topicTitle,
        });

        try {
            await enrollTopic(topicId);
            setEnrollStatusCard({
                state: 'done',
                title: 'Đăng ký thành công',
                message: topicTitle,
            });
        } catch {
            setEnrollStatusCard({
                state: 'error',
                title: 'Không thể đăng ký',
                message: 'Vui lòng thử lại sau.',
            });
        }
    }, [enrollTopic, topics]);

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            <AppSidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[1200px] mx-auto p-8 lg:p-10 min-h-full flex flex-col">
                        <div className="mb-6">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Chủ đề Học tập</h1>
                            <p className="text-gray-500 text-base">Hành trình hiểu về cơ thể và tâm trí qua các chủ đề học tập thiết thực</p>
                        </div>

                        <TopicFilters filters={filters} onChange={setFilters} />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 content-start">
                            {isLoading ? (
                                Array.from({ length: Math.min(6, Math.max(1, totalItems || 3)) }).map((_, i) => <TopicCardSkeleton key={`topic-skeleton-${i}`} />)
                            ) : topics.length > 0 ? (
                                topics.map(topic => (
                                    <TopicCard 
                                        key={topic.id} 
                                        topic={topic} 
                                        isEnrolling={enrollingTopicId === topic.id}
                                        onEnroll={handleEnrollTopic}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex justify-center text-gray-500">Không tìm thấy chủ đề nào phù hợp.</div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-12 mb-6 flex justify-center items-center gap-2">
                                <button 
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        Math.abs(pageNum - page) <= 1
                                    ) {
                                        return (
                                            <button 
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-medium transition-colors ${
                                                    page === pageNum 
                                                        ? 'bg-[#1CA1F2] text-white shadow-md' 
                                                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        pageNum === page - 2 || 
                                        pageNum === page + 2
                                    ) {
                                        return <span key={pageNum} className="text-gray-400">...</span>;
                                    }
                                    return null;
                                })}

                                <button 
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {enrollStatusCard ? (
                <TopicEnrollStatusCard
                    state={enrollStatusCard.state}
                    title={enrollStatusCard.title}
                    message={enrollStatusCard.message}
                    onOk={() => setEnrollStatusCard(null)}
                />
            ) : null}
        </div>
    );
};

function TopicEnrollStatusCard({
    state,
    title,
    message,
    onOk,
}: {
    state: 'loading' | 'done' | 'error';
    title: string;
    message: string;
    onOk: () => void;
}) {
    const isLoading = state === 'loading';
    const isError = state === 'error';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/25 px-4">
            <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
                <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                        isLoading ? 'bg-sky-50 text-[#1CA1F2]' : isError ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}
                >
                    {isLoading ? (
                        <span className="h-7 w-7 animate-spin rounded-full border-3 border-current border-t-transparent" />
                    ) : isError ? (
                        <span className="text-2xl font-black">!</span>
                    ) : (
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>

                <h2 className="mt-4 text-xl font-extrabold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{message}</p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            isError ? 'bg-rose-500' : isLoading ? 'w-2/3 animate-pulse bg-[#1CA1F2]' : 'w-full bg-emerald-500'
                        }`}
                    />
                </div>

                {!isLoading ? (
                    <button
                        type="button"
                        onClick={onOk}
                        className={`mt-6 w-full rounded-full px-5 py-3 text-sm font-bold text-white transition-colors ${
                            isError ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                    >
                        OK
                    </button>
                ) : null}
            </div>
        </div>
    );
}
