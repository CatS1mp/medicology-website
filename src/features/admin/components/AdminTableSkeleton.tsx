'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

interface AdminTableSkeletonProps {
  columns: Array<{ key: string; width?: string }>;
  rows?: number;
  dense?: boolean;
}

export const AdminTableSkeleton: React.FC<AdminTableSkeletonProps> = ({ columns, rows = 8, dense = false }) => {
  return (
    <div style={{ padding: dense ? '0 16px 12px' : '0 24px 16px' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ textAlign: 'left', padding: dense ? '8px' : '12px' }}>
                  <Skeleton className="h-3 w-16 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={`${i}-${col.key}`} style={{ padding: dense ? '8px' : '12px' }}>
                    <Skeleton className={`h-4 ${col.width ?? 'w-24'} rounded`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
