import type { Metadata } from 'next';
import { AdminArticleTemplateSelectScreen } from '@/features/admin';

export const metadata: Metadata = {
    title: 'Chọn Mẫu Bài Viết | Medicology Admin',
    description: 'Chọn template để khởi tạo bài viết dictionary mới',
};

export default function AdminArticleTemplateSelectPage() {
    return <AdminArticleTemplateSelectScreen />;
}
