import { CoursesScreen } from '@/features/courses';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Khoá học của bạn - Medicology',
    description: 'Bản đồ học tập và tiến trình khóa học của bạn',
};

export default function CoursesPage() {
    return <CoursesScreen />;
}
