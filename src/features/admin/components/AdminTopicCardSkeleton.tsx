'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

export const AdminTopicCardSkeleton: React.FC = () => {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16, background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton className="h-5 w-2/3 rounded" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full rounded mb-2" />
      <Skeleton className="h-4 w-5/6 rounded mb-4" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
      </div>
    </div>
  );
};
