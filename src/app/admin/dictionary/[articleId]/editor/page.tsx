import type { Metadata } from 'next';
import { AdminArticleEditorScreen } from '@/features/admin';

export const metadata: Metadata = {
    title: 'Soạn Thảo Bài Viết | Medicology Admin',
    description: 'Soạn thảo bài viết dictionary theo contentJson',
};

export default function AdminArticleEditorPage() {
    return <AdminArticleEditorScreen />;
}
