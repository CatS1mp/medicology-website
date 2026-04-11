import { AdminDashboardScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Medicology',
    description: 'Bảng điều khiển quản trị viên Medicology',
};

export default function AdminPage() {
    return <AdminDashboardScreen />;
}
