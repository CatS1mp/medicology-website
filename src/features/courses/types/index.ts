export type LessonStatus = 'completed' | 'active' | 'locked' | 'next';
export type LessonType = 'lesson' | 'test';

export interface LessonNode {
    id: string;
    title: string;
    status: LessonStatus;
    type: LessonType;
    href?: string;
    score?: {
        current: number;
        max: number;
    };
    description?: string; // used for tests like "15 questions - need >= 70%"
}

export interface CourseSection {
    id: string;
    title: string;
    nodes: LessonNode[];
    hasDividerAfter?: {
        title: string;
    };
}

export interface RoadmapData {
    topicTitle: string;
    progress: {
        current: number;
        total: number;
    };
    streak: {
        days: number;
        message: string;
    };
    sections: CourseSection[];
    continueLesson?: {
        courseInfo: string;
        title: string;
        description: string;
        link: string;
    };
}
