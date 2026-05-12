export type ContentBlockKind =
    | 'RICH_TEXT'
    | 'INFOGRAPHIC'
    | 'QUIZ_MCQ'
    | 'FILL_IN_THE_BLANKS'
    | 'SHORT_ANSWER'
    | 'FLASHCARD'
    | 'MATCHING'
    | 'ORDERING'
    | 'TIMELINE';

/** @deprecated use ContentBlockKind */
export type LessonContentBlockKind = ContentBlockKind;

export interface ContentBlockResponse {
    id: string;
    orderIndex: number;
    kind: ContentBlockKind;
    payload: string;
    maxScore: number | null;
    isGradable: boolean;
    createdAt: string;
    updatedAt: string;
}

/** @deprecated use ContentBlockResponse */
export type LessonContentBlockResponse = ContentBlockResponse;

export interface ContentBlockTemplateResponse {
    id: string;
    kind: ContentBlockKind;
    name: string;
    description: string | null;
    payloadSchemaJson: string;
    starterPayloadJson: string;
    defaultIsGradable: boolean;
    defaultMaxScore: number | null;
    allowScoreEdit: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type LessonInfographicMediaType = 'image' | 'video';

export interface LessonInfographicPayload {
    title: string;
    mediaType?: LessonInfographicMediaType;
    imageUrl?: string;
    videoUrl?: string;
    posterUrl?: string;
    caption?: string;
}

export interface ContentSummaryResponse {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number | null;
    difficultyLevel: string | null;
    isActive: boolean;
    content: string | null;
    blocks: ContentBlockResponse[] | null;
    createdAt: string;
    updatedAt: string;
}

/** @deprecated use ContentSummaryResponse */
export type LessonSummaryResponse = ContentSummaryResponse;

export interface SectionSummaryResponse {
    id: string;
    name: string;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes: number | null;
    contents: ContentSummaryResponse[] | null;
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
    /** Present on some admin/learner payloads */
    isActive?: boolean;
    sectionCount?: number;
    contentCount?: number;
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
    contents: ContentSummaryResponse[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface ContentResponse {
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
    blocks: ContentBlockResponse[] | null;
    createdAt: string;
    updatedAt: string;
}

/** @deprecated use ContentResponse */
export type LessonResponse = ContentResponse;

export interface ContentActivityResponse {
    date: string;
    completedContents: number;
}

export interface ContentActivitySummaryResponse {
    totalCompletedContents: number;
    activities: ContentActivityResponse[];
}

/** @deprecated */
export type LessonActivityResponse = ContentActivityResponse;
/** @deprecated */
export type LessonActivitySummaryResponse = ContentActivitySummaryResponse;

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

export type Theme = CourseResponse;
export type Section = SectionResponse;
export type Course = CourseResponse;
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
