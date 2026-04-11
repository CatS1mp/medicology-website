import { AdminCoursesScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Courses | Medicology Admin',
    description: 'Quản lý khoá học Medicology',
};

export default function AdminCoursesPage() {
    return <AdminCoursesScreen />;
}
