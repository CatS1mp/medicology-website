import { buildHeaders, requestApi } from '@/shared/api/http';
import { getOrSetCachedValue, invalidateCachedValue } from '@/shared/api/client-cache';
import type {
    AssessmentDiscoveryResponse,
    AttemptAnswerRequest,
    AttemptAnswerResponse,
    AttemptResultResponse,
    AttemptStartResponse,
    AttemptSummaryResponse,
} from '@/shared/types/assessment';

const BASE_URL = process.env.NEXT_PUBLIC_ASSESSMENT_SERVICE_URL || '';
const API = `${BASE_URL}/api/assessment`;
const MY_ATTEMPTS_CACHE_KEY = 'assessment:my-attempts';
const MY_ATTEMPTS_TTL_MS = 30_000;

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
    return post<AttemptResultResponse>(`${API}/attempts/${attemptId}/submit`).then((result) => {
        invalidateCachedValue(MY_ATTEMPTS_CACHE_KEY);
        return result;
    });
}

export function getAttemptResult(attemptId: string): Promise<AttemptResultResponse> {
    return get<AttemptResultResponse>(`${API}/attempts/${attemptId}/result`);
}

export function getMyAttempts(): Promise<AttemptSummaryResponse[]> {
    return getOrSetCachedValue(MY_ATTEMPTS_CACHE_KEY, MY_ATTEMPTS_TTL_MS, () =>
        get<AttemptSummaryResponse[]>(`${API}/users/me/attempts`)
    );
}
