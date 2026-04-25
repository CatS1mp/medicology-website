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

export type AdminCreateCourseBody = {
    name: string;
    slug: string;
    description?: string | null;
    iconFileName?: string | null;
    colorCode?: string | null;
    orderIndex?: number;
    /** Learning service may accept extra fields; omitted if unsupported */
    targetAudience?: string | null;
    contentRating?: string | null;
};

export async function adminCreateCourse(body: AdminCreateCourseBody): Promise<CourseResponse> {
    const payload: Record<string, unknown> = {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        iconFileName: body.iconFileName ?? null,
        colorCode: body.colorCode ?? null,
        orderIndex: body.orderIndex ?? 0,
    };
    if (body.targetAudience != null && body.targetAudience !== '') {
        payload.targetAudience = body.targetAudience;
    }
    if (body.contentRating != null && body.contentRating !== '') {
        payload.contentRating = body.contentRating;
    }
    return mutateAndInvalidate(
        () =>
            requestApi<CourseResponse>(`${API}/courses`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(payload),
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

export async function adminGetCourse(courseId: string): Promise<CourseResponse> {
    return requestApi<CourseResponse>(`${API}/courses/${encodeURIComponent(courseId)}`, {
        method: 'GET',
        headers: buildHeaders(),
    });
}

export type AdminSectionPayload = {
    themeId: string;
    name: string;
    slug: string;
    orderIndex: number;
    estimatedDurationMinutes?: number | null;
};

export async function adminCreateSection(
    courseId: string,
    body: Omit<AdminSectionPayload, 'themeId'> & { themeId?: string }
): Promise<SectionResponse> {
    const payload: AdminSectionPayload = {
        themeId: body.themeId ?? courseId,
        name: body.name,
        slug: body.slug,
        orderIndex: body.orderIndex,
        estimatedDurationMinutes: body.estimatedDurationMinutes ?? null,
    };
    return mutateAndInvalidate(
        () =>
            requestApi<SectionResponse>(`${API}/courses/${encodeURIComponent(courseId)}/sections`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(payload),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

export async function adminUpdateSection(sectionId: string, body: AdminSectionPayload): Promise<SectionResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<SectionResponse>(`${API}/sections/${encodeURIComponent(sectionId)}`, {
                method: 'PUT',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

export async function adminDeleteSection(sectionId: string): Promise<void> {
    await mutateAndInvalidate(
        () =>
            requestApi<void>(`${API}/sections/${encodeURIComponent(sectionId)}`, {
                method: 'DELETE',
                headers: buildHeaders({ includeJsonContentType: false }),
            }, { unwrapData: false }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

/** Publishes course visibility when backend supports PATCH. */
export async function adminPatchCourseActive(courseId: string, isActive: boolean): Promise<CourseResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<CourseResponse>(`${API}/courses/${encodeURIComponent(courseId)}/status`, {
                method: 'PATCH',
                headers: buildHeaders(),
                body: JSON.stringify({ isActive }),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}
