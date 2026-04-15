import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Manage Lessons | Medicology Admin',
    description: 'Điều hướng sang màn hình quản lý khóa học thống nhất',
};

export default function AdminLessonsPage() {
    redirect('/admin/topics');
}
