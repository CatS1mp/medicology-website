import { AdminReportScreen } from '@/features/admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'System Reports | Medicology Admin',
    description: 'Báo cáo tổng quan hệ thống Medicology',
};

export default function AdminReportsPage() {
    return <AdminReportScreen />;
}
