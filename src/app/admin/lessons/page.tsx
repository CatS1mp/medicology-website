import { AdminLessonsScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Lessons | Medicology Admin',
    description: 'Quản lý bài học Medicology',
};

export default function AdminLessonsPage() {
    return <AdminLessonsScreen />;
}
