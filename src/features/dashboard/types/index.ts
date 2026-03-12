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

export interface CourseCard {
    id: string;
    category: string;
    categoryColor: string;
    title: string;
    nextLesson: string;
    progress: number; // 0-100
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
    completed: number;
    total: number;
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
