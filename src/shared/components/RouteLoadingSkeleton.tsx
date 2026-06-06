import React from 'react';
import { Skeleton } from './Skeleton';

export function RouteLoadingSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fa] font-sans">
      {/* Sidebar skeleton */}
      <div className="w-[72px] shrink-0 hidden md:flex flex-col items-center gap-4 py-5 bg-white border-r border-gray-100">
        <Skeleton className="h-9 w-9 rounded-xl mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-xl" />
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header skeleton */}
        <div className="h-14 shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-5 gap-4">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Page content skeleton */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Page title + action */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-44 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          {/* Banner / summary card */}
          <Skeleton className="h-20 w-full rounded-2xl" />
          {/* Content grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          {/* Large content block */}
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
