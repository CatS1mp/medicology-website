'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const MyCourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 flex flex-col h-full shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Image area */}
      <div className="relative h-48 w-full shrink-0 bg-[#E5F0FF]">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Icon + title */}
        <div className="flex items-start gap-3 mb-2">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-3/4 rounded mb-1.5" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>

        {/* Description */}
        <div className="mt-1 mb-4 space-y-2 min-h-[40px]">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Meta row: section/lesson count + last studied */}
        <div className="mb-4 mt-auto flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-3 w-28 rounded" />
        </div>

        {/* CTA button */}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
};
