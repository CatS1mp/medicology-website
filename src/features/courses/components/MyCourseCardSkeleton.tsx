'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const MyCourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 flex flex-col h-full shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="relative h-48 w-full bg-[#E5F0FF] flex items-center justify-center p-6 mix-blend-multiply">
        <div className="absolute top-4 right-4 z-10">
          <Skeleton className="h-6 w-28 rounded-full bg-white/80" />
        </div>
        <Skeleton className="w-full h-full rounded-xl bg-gray-200" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-2">
          <Skeleton className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100" />
          <div className="flex-1">
            <Skeleton className="h-4 w-2/3 rounded bg-gray-100" />
          </div>
        </div>

        <div className="space-y-2 mt-1 mb-4 min-h-[40px]">
          <Skeleton className="h-3 w-full rounded bg-gray-100" />
          <Skeleton className="h-3 w-5/6 rounded bg-gray-100" />
        </div>

        <div className="mt-auto flex items-center justify-between text-xs font-medium mb-4 gap-3">
          <Skeleton className="h-6 w-36 rounded-md bg-gray-100" />
          <Skeleton className="h-6 w-28 rounded-md bg-gray-100" />
        </div>

        <Skeleton className="h-10 w-full rounded-xl bg-gray-200" />
      </div>
    </div>
  );
};
