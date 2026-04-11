import { AdminStudentsScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Student Profiles | Medicology Admin',
    description: 'Quản lý hồ sơ học viên và trạng thái tài khoản',
};

export default function AdminStudentsPage() {
    return <AdminStudentsScreen />;
}
