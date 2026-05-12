'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="flex min-h-full flex-col gap-5 p-3 sm:p-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <Skeleton className="h-8 w-1/3 rounded" />
                <Skeleton className="mt-3 h-4 w-1/2 rounded" />
            </div>

            <div className="flex flex-col gap-5 xl:flex-row">
                <div className="flex min-w-0 flex-1 flex-col gap-5">
                    <div>
                        <Skeleton className="mb-3 h-4 w-24 rounded" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-gray-100 bg-white px-5 py-4">
                                    <Skeleton className="h-6 w-20 rounded" />
                                    <Skeleton className="mt-2 h-4 w-28 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <Skeleton className="mb-4 h-4 w-32 rounded" />
                        <Skeleton className="h-44 w-full rounded-xl" />
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <Skeleton className="mb-4 h-4 w-36 rounded" />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-gray-100 p-3">
                                    <Skeleton className="h-20 w-full rounded" />
                                    <Skeleton className="mt-3 h-3 w-2/3 rounded" />
                                    <Skeleton className="mt-2 h-3 w-1/2 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-shrink-0 flex-col gap-4 xl:w-72">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="mt-4 h-40 w-full rounded-xl" />
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <Skeleton className="h-4 w-28 rounded" />
                        <div className="mt-4 space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full rounded" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
