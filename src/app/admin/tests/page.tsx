import { AdminTestsScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Assessments | Medicology Admin',
    description: 'Quản lý bài kiểm tra và đánh giá Medicology',
};

export default function AdminTestsPage() {
    return <AdminTestsScreen />;
}
