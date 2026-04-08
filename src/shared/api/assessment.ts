import { buildHeaders, requestApi } from '@/shared/api/http';
import type {
    AssessmentDiscoveryResponse,
    AttemptAnswerRequest,
    AttemptAnswerResponse,
    AttemptResultResponse,
    AttemptStartResponse,
    AttemptSummaryResponse,
} from '@/shared/types/assessment';

const API = '/api/assessment';

function get<T>(url: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'GET',
        headers: buildHeaders(),
    });
}

function post<T>(url: string, data?: unknown): Promise<T> {
    return requestApi<T>(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: data !== undefined ? JSON.stringify(data) : undefined,
    });
}

export function getSectionAssessment(sectionId: string, lessonId?: string): Promise<AssessmentDiscoveryResponse | null> {
    const search = lessonId ? `?lessonId=${encodeURIComponent(lessonId)}` : '';
    return get<AssessmentDiscoveryResponse | null>(`${API}/sections/${sectionId}/assessment${search}`);
}

export function startAttempt(assessmentId: string): Promise<AttemptStartResponse> {
    return post<AttemptStartResponse>(`${API}/assessments/${assessmentId}/attempts`);
}

export function saveAttemptAnswer(attemptId: string, data: AttemptAnswerRequest): Promise<AttemptAnswerResponse> {
    return post<AttemptAnswerResponse>(`${API}/attempts/${attemptId}/answers`, data);
}

export function submitAttempt(attemptId: string): Promise<AttemptResultResponse> {
    return post<AttemptResultResponse>(`${API}/attempts/${attemptId}/submit`);
}

export function getAttemptResult(attemptId: string): Promise<AttemptResultResponse> {
    return get<AttemptResultResponse>(`${API}/attempts/${attemptId}/result`);
}

export function getMyAttempts(): Promise<AttemptSummaryResponse[]> {
    return get<AttemptSummaryResponse[]>(`${API}/users/me/attempts`);
}
