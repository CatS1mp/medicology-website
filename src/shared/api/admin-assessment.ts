import { buildHeaders, requestApi, unwrapSpringData } from '@/shared/api/http';
import type { AssessmentDiscoveryResponse } from '@/shared/types/assessment';
import { normalizeSpringListPayload } from '@/shared/types/admin';

const API = '/api/assessment';

export interface AssessmentAdminDetail {
    id: string;
    title: string;
    description?: string | null;
    courseId?: string;
    sectionId?: string;
    lessonId?: string | null;
    passScore: number;
    timeLimitMinutes?: number | null;
    maxAttempts?: number | null;
    status?: string;
    active?: boolean;
    questions?: AssessmentAdminQuestion[];
}

export interface AssessmentAdminQuestion {
    id: string;
    content: string;
    type?: string;
    points?: number;
    displayOrder?: number;
    difficultyLevel?: string | null;
}

export async function listAssessmentsAdmin(): Promise<AssessmentDiscoveryResponse[]> {
    const rawBody = await requestApi<unknown>(
        `${API}/assessments`,
        { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
        { unwrapData: false }
    );
    const data = unwrapSpringData<unknown>(rawBody);
    const { items } = normalizeSpringListPayload<AssessmentDiscoveryResponse>(data);
    return items;
}

export async function createAssessmentAdmin(body: {
    title: string;
    courseId: string;
    sectionId: string;
    passScore: number;
    timeLimitMinutes?: number | null;
}): Promise<AssessmentDiscoveryResponse> {
    return requestApi<AssessmentDiscoveryResponse>(`${API}/assessments`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body),
    });
}

export async function deleteAssessmentAdmin(assessmentId: string): Promise<void> {
    await requestApi<void>(
        `${API}/assessments/${encodeURIComponent(assessmentId)}`,
        {
            method: 'DELETE',
            headers: buildHeaders({ includeJsonContentType: false }),
        },
        { unwrapData: false }
    );
}

export async function getAssessmentAdmin(assessmentId: string): Promise<AssessmentAdminDetail> {
    const rawBody = await requestApi<unknown>(
        `${API}/assessments/${encodeURIComponent(assessmentId)}`,
        { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
        { unwrapData: false }
    );
    return unwrapSpringData<AssessmentAdminDetail>(rawBody);
}

export async function putAssessmentAdmin(
    assessmentId: string,
    body: Partial<AssessmentAdminDetail> & { title?: string; passScore?: number }
): Promise<AssessmentAdminDetail> {
    const rawBody = await requestApi<unknown>(
        `${API}/assessments/${encodeURIComponent(assessmentId)}`,
        {
            method: 'PUT',
            headers: buildHeaders(),
            body: JSON.stringify(body),
        },
        { unwrapData: false }
    );
    return unwrapSpringData<AssessmentAdminDetail>(rawBody);
}
