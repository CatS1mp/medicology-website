'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="flex min-h-full flex-col gap-5 p-3 sm:p-5">
            <div className="flex flex-col gap-5 xl:flex-row">
                <div className="flex-1 min-w-0 flex flex-col gap-5">
                    {/* Thống kê */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-800 mb-3">Thống kê</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-16 rounded mb-2" />
                                        <Skeleton className="h-3 w-24 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tiến độ bài học */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-800 mb-3">Tiến độ bài học</h2>
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <Skeleton className="h-5 w-40 rounded" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="w-full flex-shrink-0 flex flex-col gap-4 xl:w-72 mt-8 xl:mt-0">
                    {/* LearningResultsChart */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <Skeleton className="h-5 w-32 rounded mx-auto mb-6" />
                        <div className="flex justify-center">
                            <Skeleton className="h-48 w-48 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-40 rounded mx-auto mt-6" />
                    </div>

                    {/* LearningProgress */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <Skeleton className="h-5 w-48 rounded mb-5" />
                        <div className="space-y-4">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-3/4 rounded mb-2" />
                                        <Skeleton className="h-2 w-full rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
