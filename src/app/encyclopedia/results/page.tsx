'use client';

import { Suspense } from 'react';
import { SearchResultsScreen } from '@/features/encyclopedia';
import { RouteLoadingSkeleton } from '@/shared/components/RouteLoadingSkeleton';

export default function EncyclopediaResultsPage() {
    return (
        <Suspense fallback={<RouteLoadingSkeleton />}>
            <SearchResultsScreen />
        </Suspense>
    );
}
