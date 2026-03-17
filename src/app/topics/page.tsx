import { TopicsScreen } from '@/features/topics';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Chủ đề Học tập - Medicology',
    description: 'Hành trình hiểu về cơ thể và tâm trí qua các chủ đề học tập thiết thực',
};

export default function TopicsPage() {
    return <TopicsScreen />;
}
