import { NotebookScreen } from '@/features/notebook';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sổ tay lưu trữ - Medicology',
    description: 'Danh sách bài viết đã lưu',
};

export default function NotebookPage() {
    return <NotebookScreen />;
}
