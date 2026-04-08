export interface LessonSummaryResponse {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number | null;
    difficultyLevel: string | null;
    isActive: boolean;
    content: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SectionSummaryResponse {
    id: string;
    name: string;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number | null;
    lessons: LessonSummaryResponse[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface CourseResponse {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconFileName: string | null;
    colorCode: string | null;
    orderIndex: number;
    sections: SectionSummaryResponse[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface SectionResponse {
    id: string;
    courseId: string;
    name: string;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number | null;
    lessons: LessonSummaryResponse[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface LessonResponse {
    id: string;
    sectionId: string;
    name: string;
    description: string | null;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number | null;
    difficultyLevel: string | null;
    isActive: boolean;
    content: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CourseProgressResponse {
    courseId: string;
    courseName: string;
    courseSlug: string;
    lastStudiedAt: string | null;
    completionPercent: number;
}

export interface UserDailyStreak {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    streakStartedAt: string | null;
    totalActiveDays: number;
    createdAt: string;
    updatedAt: string;
}

export interface AiLearningFeedback {
    id: string;
    userId: string;
    referenceId: string;
    referenceType: 'COURSE' | 'SECTION' | 'LESSON' | 'TEST';
    questionContent: string;
    userAnswer: string;
    isCorrect: boolean;
    aiExplanation: string;
    createdAt: string;
}

export interface SubmitCourseQuizRequest {
    quizzesCorrect: number;
}

export interface SubmitSectionTestRequest {
    quizzesCorrect: number;
    totalQuestions?: number;
}

export interface RequestAiFeedback {
    referenceId: string;
    referenceType: 'COURSE' | 'SECTION' | 'LESSON' | 'TEST';
    questionContent: string;
    userAnswer: string;
    isCorrect: boolean;
}

export interface LearningPathResponse {
    courses: CourseResponse[];
}

export interface SectionTest {
    sectionId: string;
    section?: SectionResponse;
    name: string;
    passingScorePercentage: number;
    timeLimitMinutes: number;
    maxAttempts: number;
    isActive: boolean;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserSectionTest {
    userId: string;
    sectionTestId: string;
    sectionTest?: SectionTest;
    quizzesCorrect: number;
    totalQuestions: number;
    passed: boolean;
    completedAt: string;
}

// Backward-compatible aliases while the UI migrates away from the old theme-first naming.
export type Theme = CourseResponse;
export type Section = SectionResponse;
export type Course = LessonResponse;
export type UserCourse = CourseProgressResponse;

export class LearningApiError extends Error {
    public status: number;
    public timestamp?: string;

    constructor(body: { message: string; status: number; timestamp?: string }) {
        super(body.message);
        this.status = body.status;
        this.timestamp = body.timestamp;
        this.name = 'LearningApiError';
    }
}
