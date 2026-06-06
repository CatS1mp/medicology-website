'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const RoadmapSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 lg:px-12 flex flex-col min-h-full pb-32">
      {/* Course header */}
      <div className="mb-10">
        <Skeleton className="h-9 w-3/4 rounded mb-3" />
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="flex-1 h-2 rounded-full max-w-xs" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
        <Skeleton className="h-3 w-36 rounded" />
      </div>

      {/* Sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-10 relative">
          {/* Section title with blue left accent */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-1.5 h-6 rounded-r-md" />
            <Skeleton className="h-6 w-44 rounded" />
          </div>

          {/* Lesson nodes – timeline style */}
          <div className="relative">
            {Array.from({ length: 3 }).map((__, j) => {
              const isLast = j === 2;
              return (
                <div key={j} className="relative flex gap-4 mb-4">
                  {/* Connector line + icon column */}
                  <div className="flex flex-col items-center flex-shrink-0 w-12">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    {!isLast && <Skeleton className="flex-1 w-0.5 rounded mt-1" style={{ minHeight: 24 }} />}
                  </div>
                  {/* Card */}
                  <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3 min-h-[72px]">
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-3/4 rounded mb-2" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-3 w-12 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-28 rounded-xl flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dashed divider between sections (except last) */}
          {i < 2 && (
            <div className="mt-8 flex items-center justify-center w-full max-w-2xl mx-auto">
              <Skeleton className="flex-1 h-px rounded" />
              <Skeleton className="mx-4 h-3 w-20 rounded" />
              <Skeleton className="flex-1 h-px rounded" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
