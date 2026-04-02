export type BookmarkCategory = 'Cardiovascular' | 'Emergency' | 'Mental Health' | 'Nutrition';

export interface BookmarkItem {
    id: string;
    category: BookmarkCategory;
    title: string;
    description: string;
    tags: string[];
    views: string;
    publishedAt: string;
    bookmarkedAt: string;
}
