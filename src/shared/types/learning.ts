export interface Theme {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconFileName: string | null;
    colorCode: string | null;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface Section {
    id: string;
    theme?: Theme;
    name: string;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number;
    createdAt: string;
    updatedAt: string;
}

// DTO returned by GET /themes/{themeId}/sections
export interface SectionResponse {
    id: string;
    themeId: string;
    name: string;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number;
    createdAt: string;
    updatedAt: string;
}

export interface Course {
    id: string;
    section?: Section;
    name: string;
    description: string | null;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number;
    difficultyLevel: string;
    isActive: boolean;
    content: string; // JSON string
    createdAt: string;
    updatedAt: string;
}

export interface SectionTest {
    sectionId: string;
    section?: Section;
    name: string;
    passingScorePercentage: number;
    timeLimitMinutes: number;
    maxAttempts: number;
    isActive: boolean;
    content: string; // JSON string
    createdAt: string;
    updatedAt: string;
}

export interface UserCourse {
    userId: string;
    courseId: string;
    course?: Course;
    quizzesCorrect: number;
    completedAt: string;
}

export interface UserDailyStreak {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
    streakStartedAt: string;
    totalActiveDays: number;
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

export interface AiLearningFeedback {
    id: string;
    userId: string;
    referenceId: string;
    referenceType: 'COURSE' | 'SECTION' | 'TEST';
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
    referenceType: 'COURSE' | 'SECTION' | 'TEST';
    questionContent: string;
    userAnswer: string;
    isCorrect: boolean;
}

export interface LearningPathResponse {
    themes: Theme[];
}

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
