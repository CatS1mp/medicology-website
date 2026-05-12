'use client';

import React from 'react';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { Skeleton } from '@/shared/components/Skeleton';

export const ArticleDetailSkeleton: React.FC<{ streak: number; onLogout: () => void }> = ({ streak, onLogout }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader streak={streak} onLogout={onLogout} />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1360px] gap-6 px-4 py-6 md:px-6 lg:px-8">
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-[0_20px_56px_rgba(13,38,76,0.14)] md:px-8 md:py-7">
                <div className="mb-6 flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="ml-auto h-9 w-28 rounded-xl" />
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full" />
                  ))}
                </div>

                <Skeleton className="h-10 w-2/3 rounded mb-6" />

                <div className="mb-8 grid gap-3 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>

                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                      <Skeleton className="h-6 w-1.5 rounded" />
                      <Skeleton className="h-8 w-1/2 rounded" />
                    </div>
                    <Skeleton className="w-full aspect-[3/2] rounded-2xl mb-6" />
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-5/6 rounded" />
                      <Skeleton className="h-4 w-4/6 rounded" />
                    </div>
                    <hr className="mt-10 border-gray-200" />
                  </div>
                ))}

                <div className="mb-2 overflow-x-hidden rounded-2xl border border-gray-200 bg-[#f8f9fb] p-5 md:p-7">
                  <Skeleton className="h-10 w-1/3 rounded mb-2" />
                  <Skeleton className="h-4 w-2/3 rounded mb-6" />

                  <div className="mb-6 flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <div className="mt-3 flex justify-end">
                        <Skeleton className="h-9 w-36 rounded-xl" />
                      </div>
                    </div>
                  </div>

                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-gray-300 bg-white p-4 shadow-sm mb-3">
                      <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="min-w-0 flex-1">
                          <Skeleton className="h-5 w-40 rounded mb-1" />
                          <Skeleton className="h-3 w-24 rounded mb-2" />
                          <Skeleton className="h-12 w-full rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden w-[280px] flex-shrink-0 lg:flex flex-col gap-6">
              <div className="sticky top-6">
                <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                  <Skeleton className="h-4 w-20 rounded mb-3" />
                  <div className="flex flex-col gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-3 w-full rounded" />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                  <Skeleton className="h-4 w-28 rounded mb-3" />
                  <div className="flex flex-col gap-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
