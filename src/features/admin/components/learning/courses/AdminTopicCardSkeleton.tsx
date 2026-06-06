'use client';

import React from 'react';
import { Skeleton } from '@/shared/components/Skeleton';
import styles from '@/features/admin/admin.module.css';

export const AdminTopicCardSkeleton: React.FC = () => {
  return (
    <div className={styles.topicCard}>
      {/* Cover image area with positioned badge placeholders */}
      <div className={styles.cardImageContainer}>
        <Skeleton className="absolute inset-0 rounded-none" />
        <span className={`${styles.cardBadge} ${styles.badgeLeft}`}>
          <Skeleton className="h-4 w-20 rounded" />
        </span>
        <span className={`${styles.cardBadge} ${styles.badgeRight}`}>
          <Skeleton className="h-4 w-14 rounded" />
        </span>
      </div>

      {/* Card content */}
      <div className={styles.cardContent}>
        {/* Title row */}
        <div className={styles.cardTitle}>
          <Skeleton className="h-5 w-4/5 rounded" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-11/12 rounded" />
        </div>

        {/* Metrics grid (label + value pairs) */}
        <div className={styles.cardMeta}>
          {Array.from({ length: 5 }).map((_, i) => (
            <React.Fragment key={i}>
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </React.Fragment>
          ))}
        </div>

        {/* Action buttons */}
        <div className={styles.cardActions}>
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg col-span-2" />
        </div>
      </div>
    </div>
  );
};
