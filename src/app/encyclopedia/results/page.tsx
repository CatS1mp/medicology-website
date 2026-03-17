'use client';

import { Suspense } from 'react';
import { SearchResultsScreen } from '@/features/encyclopedia';

export default function EncyclopediaResultsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-gray-400">Đang tải...</div>}>
            <SearchResultsScreen />
        </Suspense>
    );
}
