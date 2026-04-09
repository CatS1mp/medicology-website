export type TopicLevel = 'Cơ bản' | 'Trung cấp' | 'Nâng cao';

export interface Topic {
    id: string;
    slug: string;
    title: string;
    description: string;
    level: TopicLevel;
    category: string;
    rating?: number;
    /** @deprecated use lessonCount for display; kept for filter buckets keyed as "courseCount" in UI */
    courseCount?: number;
    sectionCount?: number;
    lessonCount?: number;
    imageUrl: string;
}

export interface TopicFiltersState {
    sortBy: 'Phổ biến nhất' | 'Mới nhất' | 'Đánh giá cao';
    level: 'Mọi trình độ' | TopicLevel;
    category: 'Tất cả' | string;
    courseCount: 'Tất cả' | '1-3 khóa học' | '4-7 khóa học' | '+7 khóa học';
}
