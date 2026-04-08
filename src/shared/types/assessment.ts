export interface AssessmentDiscoveryResponse {
    id: string;
    title: string;
    description: string | null;
    courseId: string;
    sectionId: string;
    lessonId: string | null;
    passScore: number;
    timeLimitMinutes: number | null;
    status: string;
    active: boolean;
}

export interface AttemptQuestionOptionResponse {
    id: string;
    content: string;
    displayOrder: number;
}

export interface AttemptQuestionResponse {
    id: string;
    content: string;
    explanation: string | null;
    type: string;
    displayOrder: number;
    points: number;
    options: AttemptQuestionOptionResponse[];
}

export interface AttemptStartResponse {
    attemptId: string;
    assessmentId: string;
    assessmentTitle: string;
    status: string;
    startedAt: string;
    questions: AttemptQuestionResponse[];
}

export interface AttemptAnswerRequest {
    questionId: string;
    selectedOptionId: string;
}

export interface AttemptAnswerResponse {
    attemptId: string;
    questionId: string;
    selectedOptionId: string;
    answeredAt: string;
}

export interface AttemptResultResponse {
    attemptId: string;
    assessmentId: string;
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    completedAt: string;
}

export interface AttemptSummaryResponse {
    attemptId: string;
    assessmentId: string;
    assessmentTitle: string;
    status: string;
    startedAt: string;
    submittedAt: string | null;
    score: number | null;
    passed: boolean | null;
}
