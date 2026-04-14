import { buildHeaders, requestApi, unwrapSpringData } from '@/shared/api/http';
import type { CourseResponse, LessonResponse, SectionResponse } from '@/shared/types/learning';
import { normalizeSpringListPayload } from '@/shared/types/admin';
import { cachedGet, mutateAndInvalidate } from '@/shared/api/cached-request';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';

const API = '/api/learning';

export async function adminListCourses(): Promise<CourseResponse[]> {
    return cachedGet(cacheKeys.admin.courses(), CACHE_TTL.SHORT, async () => {
        const rawBody = await requestApi<unknown>(
            `${API}/courses`,
            { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
            { unwrapData: false }
        );
        const data = unwrapSpringData<unknown>(rawBody);
        if (Array.isArray(data)) return data as CourseResponse[];
        const { items } = normalizeSpringListPayload<CourseResponse>(data);
        return items;
    });
}

export async function adminCreateCourse(body: {
    name: string;
    slug: string;
    description?: string | null;
    iconFileName?: string | null;
    colorCode?: string | null;
    orderIndex?: number;
}): Promise<CourseResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<CourseResponse>(`${API}/courses`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

export async function adminUpdateCourse(courseId: string, body: Partial<CourseResponse>): Promise<CourseResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<CourseResponse>(`${API}/courses/${encodeURIComponent(courseId)}`, {
                method: 'PUT',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

export async function adminDeleteCourse(courseId: string): Promise<void> {
    await mutateAndInvalidate(
        () =>
            requestApi<void>(
                `${API}/courses/${encodeURIComponent(courseId)}`,
                {
                    method: 'DELETE',
                    headers: buildHeaders({ includeJsonContentType: false }),
                },
                { unwrapData: false }
            ),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

export async function adminListSections(courseId: string): Promise<SectionResponse[]> {
    return cachedGet(cacheKeys.admin.sections(courseId), CACHE_TTL.SHORT, () =>
        requestApi<SectionResponse[]>(`${API}/courses/${encodeURIComponent(courseId)}/sections`, {
            method: 'GET',
            headers: buildHeaders(),
        })
    );
}

export async function adminListLessons(sectionId: string): Promise<LessonResponse[]> {
    return cachedGet(cacheKeys.admin.lessons(sectionId), CACHE_TTL.SHORT, () =>
        requestApi<LessonResponse[]>(`${API}/sections/${encodeURIComponent(sectionId)}/lessons`, {
            method: 'GET',
            headers: buildHeaders(),
        })
    );
}

export async function adminCreateLesson(body: {
    sectionId: string;
    name: string;
    slug: string;
    description?: string | null;
    orderIndex?: number;
    estimatedDurationMinutes?: number | null;
    difficultyLevel?: string | null;
}): Promise<LessonResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<LessonResponse>(`${API}/lessons`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

export async function adminUpdateLesson(lessonId: string, body: Partial<LessonResponse>): Promise<LessonResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<LessonResponse>(`${API}/lessons/${encodeURIComponent(lessonId)}`, {
                method: 'PUT',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

export async function adminDeleteLesson(lessonId: string): Promise<void> {
    await mutateAndInvalidate(
        () =>
            requestApi<void>(
                `${API}/lessons/${encodeURIComponent(lessonId)}`,
                {
                    method: 'DELETE',
                    headers: buildHeaders({ includeJsonContentType: false }),
                },
                { unwrapData: false }
            ),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

export async function adminPatchLessonStatus(lessonId: string, isActive: boolean): Promise<LessonResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<LessonResponse>(`${API}/lessons/${encodeURIComponent(lessonId)}/status`, {
                method: 'PATCH',
                headers: buildHeaders(),
                body: JSON.stringify({ isActive }),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}
