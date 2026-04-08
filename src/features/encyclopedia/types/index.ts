export interface ArticleTag {
    label: string;
    slug: string;
}

export type ArticleCategory = 'Tim mạch' | 'Cấp cứu' | 'Sức khỏe Tâm thần' | 'Dinh dưỡng' | 'Sơ cứu' | 'Y học Thường thức';

export interface ArticleSummary {
    id: string;
    slug: string;
    title: string;
    subtitle: string; // category type (e.g. "ARTICLE · CARDIOVASCULAR HEALTH")
    excerpt: string;
    category: ArticleCategory;
    tags: ArticleTag[];
    viewCount: number;
    readTimeMin: number;
    publishedAt: string;
}

export interface TableOfContentsItem {
    id: string;
    label: string;
    level: 1 | 2;
}

export interface ArticleSection {
    id: string;
    heading: string;
    content: string; // can contain HTML later from API
    imageUrl?: string;
}

export interface ArticleDetail extends ArticleSummary {
    lastViewed?: string;
    tableOfContents: TableOfContentsItem[];
    sections: ArticleSection[];
    relatedArticles: ArticleSummary[];
    interactionSummary?: {
        totalViews: number;
        totalBookmarks: number;
        totalComments: number;
    };
    comments?: ArticleComment[];
    isBookmarked?: boolean;
}

export interface ArticleComment {
    id: string;
    userId: string;
    text: string;
    createdAt: string;
    replies: ArticleComment[];
}

export interface SearchFilters {
    query: string;
    category: 'Tất cả' | ArticleCategory;
    sortBy: 'Phù hợp nhất' | 'Mới nhất' | 'Nhiều lượt xem';
    perPage: 3 | 5 | 10;
}

export const TRENDING_TAGS = [
    'Đau tim', 'CPR', 'Tiểu đường', 'Đột quỵ', 'Lo âu', 'Dinh dưỡng'
];
