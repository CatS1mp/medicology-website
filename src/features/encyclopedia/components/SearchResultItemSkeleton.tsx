'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const SearchResultItemSkeleton: React.FC = () => {
  return (
    <div className="block border border-gray-200 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <Skeleton className="h-3 w-28 rounded mb-2" />
          <Skeleton className="h-5 w-3/4 rounded mb-2" />
          <Skeleton className="h-4 w-full rounded mb-1" />
          <Skeleton className="h-4 w-5/6 rounded mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-14 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        <Skeleton className="flex-shrink-0 w-8 h-8 rounded-full" />
      </div>
    </div>
  );
};
