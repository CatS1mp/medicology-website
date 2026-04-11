import { AdminTopicsScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Topics | Medicology Admin',
    description: 'Quản lý chủ đề học tập Medicology',
};

export default function AdminTopicsPage() {
    return <AdminTopicsScreen />;
}
