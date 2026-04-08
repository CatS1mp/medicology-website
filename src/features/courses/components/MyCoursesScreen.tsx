'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { MyCourseCard } from './MyCourseCard';
import { useEnrolledCourses } from '../hooks/useEnrolledCourses';

export const MyCoursesScreen: React.FC = () => {
    const router = useRouter();
    const { streakDays } = useLearningStreak();
    const { handleLogout } = useLogout();
    const { courses, page, setPage, totalPages, totalItems, isLoading } = useEnrolledCourses();

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            <AppSidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[1200px] mx-auto p-8 lg:p-10 min-h-full flex flex-col">
                        <div className="mb-8">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Khóa học của bạn</h1>
                            <p className="text-gray-500 text-base">
                                Danh sách các khóa học bạn đã đăng ký, sắp xếp theo lần đăng ký gần nhất.
                            </p>
                        </div>

                        {!isLoading && totalItems > 0 && (
                            <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{totalItems} khóa học đang theo dõi</p>
                                    <p className="text-sm text-gray-500">Chọn một khóa học để tiếp tục roadmap của bạn.</p>
                                </div>
                                <div className="rounded-full bg-[#E5F0FF] px-4 py-2 text-sm font-semibold text-[#1CA1F2]">
                                    Học đều mỗi ngày
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 content-start">
                            {isLoading ? (
                                <div className="col-span-full py-20 flex justify-center text-gray-500">Đang tải khóa học...</div>
                            ) : courses.length > 0 ? (
                                courses.map((course) => (
                                    <MyCourseCard
                                        key={course.id}
                                        course={course}
                                        onContinueLearning={(courseSlug) => router.push(`/courses/${courseSlug}`)}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center text-gray-500">
                                    <p className="text-lg font-semibold text-gray-800 mb-2">Bạn chưa đăng ký khóa học nào.</p>
                                    <p className="max-w-md">Hãy vào phần Chủ đề học tập để chọn khóa học phù hợp và bắt đầu hành trình học tập của bạn.</p>
                                </div>
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
                                    }

                                    if (pageNum === page - 2 || pageNum === page + 2) {
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
