import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const NotebookScreen = dynamic(() => import('@/features/notebook').then((mod) => mod.NotebookScreen));

export const metadata: Metadata = {
    title: 'Sổ tay lưu trữ - Medicology',
    description: 'Danh sách bài viết đã lưu',
};

export default function NotebookPage() {
    return <NotebookScreen />;
}
