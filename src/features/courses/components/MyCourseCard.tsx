'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/shared/components/Button';

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

function formatLastStudied(lastStudiedAt: string | null) {
    if (!lastStudiedAt) {
        return 'Chưa bắt đầu học';
    }

    const date = new Date(lastStudiedAt);
    if (Number.isNaN(date.getTime())) {
        return 'Đang theo dõi';
    }

    return `Học gần nhất ${date.toLocaleDateString('vi-VN')}`;
}

export const MyCourseCard: React.FC<MyCourseCardProps> = ({ course, onContinueLearning }) => {
    return (
        <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 flex flex-col h-full shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="relative h-48 w-full bg-[#E5F0FF] flex items-center justify-center p-6 mix-blend-multiply">
                <div className="absolute top-4 right-4 z-10 bg-white/85 backdrop-blur-md text-[#1CA1F2] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {course.completionPercent}% hoàn thành
                </div>

                <Image
                    src={course.imageUrl}
                    alt={course.title}
                    width={180}
                    height={180}
                    className="object-contain w-full h-full mix-blend-darken filter drop-shadow-md"
                />
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100">
                        <div className="w-3 h-3 rounded-full bg-[#1CA1F2]"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                            {course.title}
                        </h3>
                    </div>
                </div>

                <p className="text-[13px] text-gray-500 line-clamp-2 mt-1 mb-4 min-h-[40px] leading-relaxed">
                    {course.description}
                </p>

                <div className="mt-auto flex items-center justify-between text-xs text-gray-500 font-medium mb-4 gap-3">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>{course.sectionCount} chặng, {course.lessonCount} bài</span>
                    </div>

                    <div className="text-right text-[12px] text-gray-400">
                        {formatLastStudied(course.lastStudiedAt)}
                    </div>
                </div>

                <Button
                    fullWidth
                    className="py-2.5 text-[13px] font-bold tracking-wide uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none transition-all"
                    onClick={() => onContinueLearning?.(course.slug)}
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tiếp tục học
                    </div>
                </Button>
            </div>
        </div>
    );
};
