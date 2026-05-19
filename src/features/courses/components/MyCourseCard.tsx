'use client';

import React from 'react';
import { Button } from '@/shared/components/Button';
import { LazyImage } from '@/shared/components/LazyImage';
import { DEFAULT_COURSE_ICON } from '@/shared/utils/course-icon';

export interface MyCourseCardModel {
    id: string;
    slug: string;
    title: string;
    description: string;
    imageUrl: string;
    sectionCount: number;
    lessonCount: number;
    completionPercent: number;
    lastStudiedAt: string | null;
}

interface MyCourseCardProps {
    course: MyCourseCardModel;
    onContinueLearning?: (slug: string) => void;
}

function formatLastStudied(lastStudiedAt: string | null): string {
    if (!lastStudiedAt) return 'Chưa bắt đầu học';
    const date = new Date(lastStudiedAt);
    if (Number.isNaN(date.getTime())) return 'Đang theo dõi';
    return `Học gần nhất ${date.toLocaleDateString('vi-VN')}`;
}

export const MyCourseCard: React.FC<MyCourseCardProps> = ({ course, onContinueLearning }) => {
    const completionPercent = Math.max(0, Math.min(100, Math.round(course.completionPercent)));
    const isCompleted = completionPercent >= 100;

    return (
        <div className="bg-white rounded-[24px] overflow-hidden relative border border-gray-100 flex flex-col h-full shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
            {/* Image section */}
            <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-[24px] bg-[#E5F0FF] isolate">
                <LazyImage
                    src={course.imageUrl}
                    alt={course.title}
                    fallbackSrc={DEFAULT_COURSE_ICON}
                    className="absolute inset-0 size-full object-cover object-center pointer-events-none select-none"
                />
                {/* Completed overlay on image */}
                {isCompleted && (
                    <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center z-10">
                        <div className="bg-white rounded-full p-3 shadow-lg">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col p-5">
                <div className="mb-2 flex min-w-0 items-start gap-3">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                            isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-100'
                        }`}
                    >
                        <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-[#1CA1F2]'}`}></div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="break-words text-base font-bold leading-tight text-gray-900 [overflow-wrap:anywhere]">{course.title}</h3>
                        {isCompleted && (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                ✓ Đã hoàn thành
                            </span>
                        )}
                    </div>
                </div>

                <p className="mb-4 mt-1 line-clamp-2 min-h-[40px] break-words text-[13px] leading-relaxed text-gray-500 [overflow-wrap:anywhere]">
                    {course.description}
                </p>

                <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-gray-500">
                        <span>Tiến độ</span>
                        <span className={isCompleted ? 'text-emerald-600' : 'text-[#1CA1F2]'}>{completionPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-[#1CA1F2]'}`}
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>

                <div className="mb-4 mt-auto flex min-w-0 items-center justify-between gap-3 text-xs font-medium text-gray-500">
                    <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                        <span>{course.sectionCount} chặng, {course.lessonCount} bài</span>
                    </div>
                    <div className="min-w-0 break-words text-right text-[12px] text-gray-400 [overflow-wrap:anywhere]">
                        {formatLastStudied(course.lastStudiedAt)}
                    </div>
                </div>

                {/* Action button */}
                <Button
                    fullWidth
                    className={
                        isCompleted
                            ? 'py-2.5 text-[13px] font-bold tracking-wide uppercase bg-emerald-500 shadow-[0_4px_0_0_#059669] hover:bg-emerald-400 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#059669] active:translate-y-[4px] active:shadow-none transition-all'
                            : 'py-2.5 text-[13px] font-bold tracking-wide uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none transition-all'
                    }
                    onClick={() => onContinueLearning?.(course.slug)}
                >
                    <div className="flex min-w-0 items-center justify-center gap-2 text-white">
                        {isCompleted ? (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Xem lại khóa học
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Tiếp tục học
                            </>
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
};
