'use client';

import React from 'react';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { TopicFilters } from './TopicFilters';
import { TopicCard } from './TopicCard';
import { useTopics } from '../hooks/useTopics';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';

export const TopicsScreen: React.FC = () => {
    const { streakDays } = useLearningStreak();

    const { handleLogout } = useLogout();

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
    } = useTopics();

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />

                {/* Page body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[1200px] mx-auto p-8 lg:p-10 min-h-full flex flex-col">
                        {/* Page Title */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Chủ đề Học tập</h1>
                            <p className="text-gray-500 text-base">Hành trình hiểu về cơ thể và tâm trí qua các chủ đề học tập thiết thực</p>
                        </div>

                        {/* Filters */}
                        <TopicFilters filters={filters} onChange={setFilters} />

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 content-start">
                            {isLoading ? (
                                <div className="col-span-full py-20 flex justify-center text-gray-500">Đang tải...</div>
                            ) : topics.length > 0 ? (
                                topics.map(topic => (
                                    <TopicCard 
                                        key={topic.id} 
                                        topic={topic} 
                                        isEnrolling={enrollingTopicId === topic.id}
                                        onEnroll={enrollTopic}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex justify-center text-gray-500">Không tìm thấy chủ đề nào phù hợp.</div>
                            )}
                        </div>

                        {/* Pagination */}
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
                                    // Show first, last, current, and adjacent pages
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
        </div>
    );
};
