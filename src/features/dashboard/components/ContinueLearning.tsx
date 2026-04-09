'use client';

import React, { useState } from 'react';
import type { CourseCard } from '../types';

interface ContinueLearningProps {
    courses: CourseCard[];
}

export const ContinueLearning: React.FC<ContinueLearningProps> = ({ courses }) => {
    const [startIndex, setStartIndex] = useState(0);
    const visible = courses.slice(startIndex, startIndex + 3);

    const canPrev = startIndex > 0;
    const canNext = startIndex + 3 < courses.length;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Học tiếp thôi nào!</h3>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setStartIndex(Math.max(0, startIndex - 1))}
                        disabled={!canPrev}
                        className={`h-7 w-7 rounded-full border flex items-center justify-center transition-colors ${canPrev ? 'border-gray-300 text-gray-600 hover:bg-gray-100' : 'border-gray-100 text-gray-300 cursor-default'
                            }`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setStartIndex(Math.min(courses.length - 3, startIndex + 1))}
                        disabled={!canNext}
                        className={`h-7 w-7 rounded-full border flex items-center justify-center transition-colors ${canNext ? 'border-gray-300 text-gray-600 hover:bg-gray-100' : 'border-gray-100 text-gray-300 cursor-default'
                            }`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((course) => (
                    <div
                        key={course.id}
                        className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                    >
                        <div className="relative h-28 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                            <div className="absolute inset-0 opacity-30"
                                style={{
                                    backgroundImage: 'repeating-linear-gradient(45deg, #374151 0, #374151 1px, transparent 0, transparent 50%)',
                                    backgroundSize: '8px 8px',
                                }}
                            />
                            <button className="absolute top-2 right-2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-3">
                            <span
                                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                                style={{ backgroundColor: `${course.categoryColor}18`, color: course.categoryColor }}
                            >
                                {course.category}
                            </span>

                            <h4 className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 mb-2 min-h-[2.5rem]">
                                {course.title}
                            </h4>

                            <p className="text-[10px] text-gray-400 mb-1">
                                <span className="text-gray-500 font-medium">Tiếp tục: </span>
                                {course.nextLesson}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                <span>Tiến độ chương: {course.completed}/{course.total} bài</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-400 rounded-full transition-all duration-500"
                                    style={{ width: `${course.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};