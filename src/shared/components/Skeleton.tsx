'use client';

import React from 'react';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = '', ...rest }: SkeletonProps) {
  const cls = `animate-pulse motion-reduce:animate-none bg-gray-100 ${className}`.trim();
  return <div role="status" aria-busy={true} className={cls} {...rest} />;
}
