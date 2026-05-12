import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const EncyclopediaLanding = dynamic(() => import('@/features/encyclopedia').then((mod) => mod.EncyclopediaLanding));

export const metadata: Metadata = {
    title: 'Bách khoa Y học - Medicology',
    description: 'Tìm kiếm bài viết, bệnh lý, phương pháp điều trị và hơn thế nữa',
};

export default function EncyclopediaPage() {
    return <EncyclopediaLanding />;
}
