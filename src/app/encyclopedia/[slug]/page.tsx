import { ArticleDetailScreen } from '@/features/encyclopedia';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    return {
        title: `Bài viết - Medicology`,
        description: `Đọc bài viết y khoa về ${slug}`,
    };
}

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;
    return <ArticleDetailScreen slug={slug} />;
}
