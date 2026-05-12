export interface AttemptStartResponse {
    attemptId: string;
    contentId: string;
    status: string;
    startedAt: string;
    remainingSeconds: number;
}

export interface AttemptStartRequest {
    estimatedDurationMinutes?: number | null;
}

export interface AttemptAnswerRequest {
    contentBlockId: string;
    contentId: string;
    userAnswer: string;
    kind: string;
    payload?: string | null;
    maxScore?: number | null;
    orderIndex?: number | null;
    isGradable?: boolean | null;
}

export interface AttemptAnswerResponse {
    attemptId: string;
    contentBlockId: string;
    userAnswer: string;
    gradingStatus: 'PENDING' | 'MANUAL_REVIEW' | 'FINALIZED';
    answeredAt: string;
}

export interface AttemptAnswerLookupResponse {
    userAnswer: string | null;
}

export interface AttemptTickRequest {
    deltaSeconds?: number;
}

export interface AttemptTickResponse {
    remainingSeconds: number;
}

export interface AttemptInProgressItem {
    attemptId: string;
    contentId: string;
    remainingSeconds: number;
}

export interface AttemptResultResponse {
    attemptId: string;
    contentId: string;
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
    contentId: string;
    status: string;
    startedAt: string;
    submittedAt: string | null;
    score: number | null;
    passed: boolean | null;
}

export interface AttemptReviewAnswerResponse {
    contentBlockId: string;
    blockKind: string;
    orderIndex: number | null;
    maxScore: number;
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

export interface AttemptReviewResponse {
    attemptId: string;
    contentId: string;
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    completedAt: string;
    resultStatus: 'PROVISIONAL' | 'FINAL';
    attemptStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'PENDING_REVIEW' | 'FINALIZED';
    pendingManualReviews: number;
    answers: AttemptReviewAnswerResponse[];
}
