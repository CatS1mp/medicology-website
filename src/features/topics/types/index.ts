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
