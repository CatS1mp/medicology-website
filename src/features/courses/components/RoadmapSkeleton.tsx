'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const RoadmapSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 lg:px-12 flex flex-col min-h-full pb-32">
      <div className="mb-6">
        <Skeleton className="h-8 w-2/3 rounded" />
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-8">
          <Skeleton className="h-6 w-40 rounded mb-3" />
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-2/3 rounded mb-1" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
