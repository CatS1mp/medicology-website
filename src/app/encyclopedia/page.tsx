import { EncyclopediaLanding } from '@/features/encyclopedia';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Bách khoa Y học - Medicology',
    description: 'Tìm kiếm bài viết, bệnh lý, phương pháp điều trị và hơn thế nữa',
};

export default function EncyclopediaPage() {
    return <EncyclopediaLanding />;
}
