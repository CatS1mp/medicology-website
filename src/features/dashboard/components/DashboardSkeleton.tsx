'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="flex min-h-full flex-col gap-5 p-3 sm:p-5">
            <div className="flex flex-col gap-5 xl:flex-row">
                {/* Left column */}
                <div className="flex-1 min-w-0 flex flex-col gap-5">
                    {/* Thống kê – 3 stat cards */}
                    <div>
                        <Skeleton className="h-4 w-16 rounded mb-3" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <Skeleton className="h-6 w-14 rounded mb-1.5" />
                                        <Skeleton className="h-3 w-28 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tiến độ bài học – chart with range tabs */}
                    <div>
                        <Skeleton className="h-4 w-28 rounded mb-3" />
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex flex-col gap-1">
                                    <Skeleton className="h-4 w-36 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>
                                {/* Range tabs */}
                                <div className="flex gap-2">
                                    <Skeleton className="h-7 w-20 rounded-full" />
                                    <Skeleton className="h-7 w-20 rounded-full" />
                                </div>
                            </div>
                            {/* Chart area – line chart with axis labels */}
                            <div className="relative h-40 w-full rounded-xl overflow-hidden">
                                <Skeleton className="absolute inset-0" />
                                {/* Y-axis tick stubs */}
                                <div className="absolute left-0 inset-y-4 flex flex-col justify-between pl-1">
                                    {[0, 1, 2].map((i) => (
                                        <Skeleton key={i} className="h-2.5 w-5 rounded" />
                                    ))}
                                </div>
                            </div>
                            {/* X-axis labels */}
                            <div className="flex justify-between mt-2 px-6">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <Skeleton key={i} className="h-2.5 w-6 rounded" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="w-full flex-shrink-0 flex flex-col gap-4 xl:w-72">
                    {/* Kết quả học tập – bar chart */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        {/* Title + legend row */}
                        <div className="flex items-center justify-between mb-2">
                            <Skeleton className="h-4 w-28 rounded" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-1.5">
                                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                                <Skeleton className="h-2.5 w-10 rounded" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                                <Skeleton className="h-2.5 w-10 rounded" />
                            </div>
                            <div className="ml-auto flex flex-col items-end gap-0.5">
                                <Skeleton className="h-2.5 w-16 rounded" />
                                <Skeleton className="h-4 w-8 rounded" />
                            </div>
                        </div>
                        {/* Bar chart area */}
                        <div className="flex items-end justify-between gap-1.5 h-[130px] px-1">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 justify-end h-full">
                                    <div className="w-full flex gap-0.5 items-end justify-center">
                                        <Skeleton
                                            className="flex-1 rounded-t"
                                            style={{ height: `${40 + Math.round(Math.sin(i) * 30 + 30)}px` }}
                                        />
                                        <Skeleton
                                            className="flex-1 rounded-t"
                                            style={{ height: `${50 + Math.round(Math.cos(i) * 20 + 20)}px` }}
                                        />
                                    </div>
                                    <Skeleton className="h-2 w-5 rounded" />
                                </div>
                            ))}
                        </div>
                        {/* Toggle row */}
                        <div className="flex items-center gap-3 mt-2">
                            <Skeleton className="h-3.5 w-7 rounded-full" />
                            <Skeleton className="h-2.5 w-16 rounded" />
                            <Skeleton className="h-3.5 w-7 rounded-full" />
                            <Skeleton className="h-2.5 w-14 rounded" />
                        </div>
                    </div>

                    {/* Tiến độ học tập – course rows with progress bars */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <Skeleton className="h-4 w-32 rounded mb-3" />
                        <div className="flex flex-col gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-gray-100 bg-white p-3 flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <Skeleton className="h-3 w-28 rounded" />
                                            <Skeleton className="h-4 w-10 rounded-full" />
                                        </div>
                                        <Skeleton className="h-2 w-full rounded-full" />
                                        <Skeleton className="h-2.5 w-20 rounded mt-0.5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-center">
                            <Skeleton className="h-3 w-20 rounded mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
