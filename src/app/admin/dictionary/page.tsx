import { AdminDictionaryScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Dictionary | Medicology Admin',
    description: 'Quản lý từ điển Medicology',
};

export default function AdminDictionaryPage() {
    return <AdminDictionaryScreen />;
}
