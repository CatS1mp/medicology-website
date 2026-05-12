import { AdminTestDetailScreen } from '@/features/admin';
import { RouteLoadingSkeleton } from '@/shared/components/RouteLoadingSkeleton';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Test Editor | Medicology Admin',
    description: 'Chỉnh sửa chi tiết bài kiểm tra Medicology',
};

export default function AdminTestDetailPage() {
    return (
        <Suspense fallback={<RouteLoadingSkeleton />}>
            <AdminTestDetailScreen />
        </Suspense>
    );
}
