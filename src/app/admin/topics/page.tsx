import { AdminTopicsScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Courses | Medicology Admin',
    description: 'Quản lý khóa học Medicology',
};

export default function AdminTopicsPage() {
    return <AdminTopicsScreen />;
}
