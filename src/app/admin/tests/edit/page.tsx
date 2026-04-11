import { AdminTestDetailScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Test Editor | Medicology Admin',
    description: 'Chỉnh sửa chi tiết bài kiểm tra Medicology',
};

export default function AdminTestDetailPage() {
    return <AdminTestDetailScreen />;
}
