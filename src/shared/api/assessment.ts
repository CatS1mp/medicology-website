import { buildHeaders, requestApi } from '@/shared/api/http';
import { cachedGet, mutateAndInvalidate } from '@/shared/api/cached-request';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';
import { notifyLearningProgressChanged } from '@/shared/api/learning';
import type {
    AttemptAnswerLookupResponse,
    AttemptAnswerRequest,
    AttemptAnswerResponse,
    AttemptInProgressItem,
    AttemptResultResponse,
    AttemptReviewResponse,
    AttemptStartRequest,
    AttemptStartResponse,
    AttemptSummaryResponse,
    AttemptTickRequest,
    AttemptTickResponse,
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

export function startAttempt(contentId: string, body?: AttemptStartRequest): Promise<AttemptStartResponse> {
    return post<AttemptStartResponse>(`${API}/contents/${encodeURIComponent(contentId)}/attempts`, body ?? {});
}

export function saveAttemptAnswer(attemptId: string, data: AttemptAnswerRequest): Promise<AttemptAnswerResponse> {
    return post<AttemptAnswerResponse>(`${API}/attempts/${encodeURIComponent(attemptId)}/answers`, data);
}

export function getAttemptAnswer(attemptId: string, contentBlockId: string): Promise<AttemptAnswerLookupResponse> {
    return get<AttemptAnswerLookupResponse>(
        `${API}/attempts/${encodeURIComponent(attemptId)}/blocks/${encodeURIComponent(contentBlockId)}/answer`
    );
}

export function tickAttempt(attemptId: string, body?: AttemptTickRequest): Promise<AttemptTickResponse> {
    return post<AttemptTickResponse>(`${API}/attempts/${encodeURIComponent(attemptId)}/tick`, body ?? {});
}

export function getMyInProgressAttempts(): Promise<AttemptInProgressItem[]> {
    return cachedGet(cacheKeys.assessment.inProgressAttempts(), CACHE_TTL.SHORT, () =>
        get<AttemptInProgressItem[]>(`${API}/users/me/in-progress-attempts`)
    );
}

export function submitAttempt(attemptId: string): Promise<AttemptResultResponse> {
    return mutateAndInvalidate(
        () => post<AttemptResultResponse>(`${API}/attempts/${encodeURIComponent(attemptId)}/submit`),
        [
            cacheKeys.assessment.myAttempts(),
            cacheKeys.assessment.attemptResult(attemptId),
            cacheKeys.assessment.inProgressAttempts(),
            cacheKeys.learning.progress(),
        ],
        [cacheKeys.learning.contentActivityPrefix()]
    ).then((result) => {
        notifyLearningProgressChanged();
        return result;
    });
}

export function getAttemptResult(attemptId: string): Promise<AttemptResultResponse> {
    return cachedGet(cacheKeys.assessment.attemptResult(attemptId), CACHE_TTL.LONG, () =>
        get<AttemptResultResponse>(`${API}/attempts/${encodeURIComponent(attemptId)}/result`)
    );
}

/** GET kết quả không qua cache — dùng khi poll trạng thái chấm (PROVISIONAL → FINAL). */
export function getAttemptResultFresh(attemptId: string): Promise<AttemptResultResponse> {
    return get<AttemptResultResponse>(`${API}/attempts/${encodeURIComponent(attemptId)}/result`);
}

export interface LatestSubmittedAttemptResponse {
    attemptId: string;
    contentId: string;
    status: string;
    submittedAt: string;
    passed: boolean | null;
}

export function getLatestSubmittedAttempt(contentId: string): Promise<LatestSubmittedAttemptResponse> {
    return get<LatestSubmittedAttemptResponse>(
        `${API}/contents/${encodeURIComponent(contentId)}/attempts/latest-submitted`
    );
}

export function getMyAttempts(): Promise<AttemptSummaryResponse[]> {
    return cachedGet(cacheKeys.assessment.myAttempts(), CACHE_TTL.SHORT, () =>
        get<AttemptSummaryResponse[]>(`${API}/users/me/attempts`)
    );
}

export function getAttemptReview(attemptId: string): Promise<AttemptReviewResponse> {
    return cachedGet(cacheKeys.assessment.attemptReview(attemptId), CACHE_TTL.MEDIUM, () =>
        get<AttemptReviewResponse>(`${API}/attempts/${encodeURIComponent(attemptId)}/review`)
    );
}
