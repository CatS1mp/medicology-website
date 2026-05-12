import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const TopicsScreen = dynamic(() => import('@/features/topics').then((mod) => mod.TopicsScreen));

export const metadata: Metadata = {
    title: 'Chủ đề Học tập - Medicology',
    description: 'Hành trình hiểu về cơ thể và tâm trí qua các chủ đề học tập thiết thực',
};

export default function TopicsPage() {
    return <TopicsScreen />;
}
