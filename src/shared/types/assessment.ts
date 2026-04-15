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

export interface AttemptQuestionResponse {
    id: string;
    content: string;
    type: string;
    displayOrder: number;
    points: number;
    payload: string;
    version: number;
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
    userAnswer: string;
}

export interface AttemptAnswerResponse {
    attemptId: string;
    questionId: string;
    userAnswer: string;
    gradingStatus: 'PENDING' | 'MANUAL_REVIEW' | 'FINALIZED';
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
    resultStatus: 'PROVISIONAL' | 'FINAL';
    attemptStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'PENDING_REVIEW' | 'FINALIZED';
    pendingManualReviews: number;
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

export interface AttemptReviewAnswerResponse {
    questionId: string;
    questionContent: string;
    questionType: 'SINGLE_CHOICE' | 'FILL_IN_THE_BLANKS' | 'SHORT_ANSWER' | 'MATCHING' | 'ORDERING' | 'HOTSPOT_IMAGE';
    displayOrder: number;
    points: number;
    payload: string;
    userAnswer: string | null;
    correct: boolean | null;
    awardedPoints: number;
    gradingStatus: 'PENDING' | 'MANUAL_REVIEW' | 'FINALIZED';
    gradingSource: 'RULE' | 'AI' | 'MANUAL' | null;
    confidence: number | null;
    explanation: string | null;
    aiModel: string | null;
}

export interface AttemptReviewResponse extends AttemptResultResponse {
    assessmentTitle: string;
    answers: AttemptReviewAnswerResponse[];
}
