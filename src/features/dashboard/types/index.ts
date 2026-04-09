export interface StatCard {
    id: string;
    icon: string;
    value: string | number;
    label: string;
    color: string;
}

export interface ChartDataPoint {
    day: string;
    date: string;
    value: number;
}

export interface LessonActivityDataset {
    label: string;
    data: ChartDataPoint[];
    totalCompletedLessons: number;
}

export type LessonActivityRange = 'last7' | 'last14';

export interface CourseCard {
    id: string;
    category: string;
    categoryColor: string;
    title: string;
    nextLesson: string;
    progress: number;
    total: number;
    completed: number;
}

export interface LearningResultPoint {
    label: string;
    actual: number;
    target: number;
}

export interface LearningProgressItem {
    id: string;
    subject: string;
    completionPercent: number;
    color: string;
    icon: string;
}

export interface UserInfo {
    name: string;
    avatarInitials: string;
    streak: number;
    score: number;
    totalLessons: number;
}
