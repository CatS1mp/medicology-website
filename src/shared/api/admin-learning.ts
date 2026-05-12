import { buildHeaders, requestApi, unwrapSpringData } from '@/shared/api/http';
import type { ContentBlockKind, ContentBlockTemplateResponse, ContentResponse, CourseResponse, SectionResponse } from '@/shared/types/learning';
import { normalizeSpringListPayload } from '@/shared/types/admin';
import { cachedGet, mutateAndInvalidate } from '@/shared/api/cached-request';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';

const API = '/api/learning';

export async function adminListCourses(): Promise<CourseResponse[]> {
    const { items } = await adminListCoursesPaged({ page: 0, size: 1000 });
    return items;
}

export async function adminListCoursesPaged(params?: { page?: number; size?: number }): Promise<{ items: CourseResponse[]; total: number }> {
    const page = params?.page ?? 0;
    const size = params?.size ?? 1000;
    const search = new URLSearchParams();
    search.set('page', String(page));
    search.set('size', String(size));
    const q = search.toString();

    const cacheKey = `${cacheKeys.admin.courses()}:${page}:${size}`;
    return cachedGet(cacheKey, CACHE_TTL.SHORT, async () => {
        const rawBody = await requestApi<unknown>(
            `${API}/courses${q ? `?${q}` : ''}`,
            { method: 'GET', headers: buildHeaders({ includeJsonContentType: false }) },
            { unwrapData: false }
        );
        const data = unwrapSpringData<unknown>(rawBody);
        return normalizeSpringListPayload<CourseResponse>(data);
    });
}

export type AdminCreateCourseBody = {
    name: string;
    slug: string;
    description?: string | null;
    iconFile: File;
    colorCode?: string | null;
};

export async function adminCreateCourse(body: AdminCreateCourseBody): Promise<CourseResponse> {
    const requestPayload: Record<string, unknown> = {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        colorCode: body.colorCode ?? null,
    };
    const formData = new FormData();
    formData.append('request', JSON.stringify(requestPayload));
    formData.append('iconFile', body.iconFile);

    return mutateAndInvalidate(
        () =>
            requestApi<CourseResponse>(`${API}/courses`, {
                method: 'POST',
                headers: buildHeaders({ includeJsonContentType: false }),
                body: formData,
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

export async function adminListContents(sectionId: string): Promise<ContentResponse[]> {
    return cachedGet(cacheKeys.admin.contents(sectionId), CACHE_TTL.SHORT, () =>
        requestApi<ContentResponse[]>(`${API}/sections/${encodeURIComponent(sectionId)}/contents`, {
            method: 'GET',
            headers: buildHeaders(),
        })
    );
}

/** @deprecated use adminListContents */
export const adminListLessons = adminListContents;

export async function adminListBlockTemplates(): Promise<ContentBlockTemplateResponse[]> {
    return cachedGet(`${cacheKeys.admin.learningPrefix()}:block-templates`, CACHE_TTL.SHORT, () =>
        requestApi<ContentBlockTemplateResponse[]>(`${API}/block-templates`, {
            method: 'GET',
            headers: buildHeaders(),
        })
    );
}

export async function adminCreateContent(body: {
    sectionId: string;
    name: string;
    slug: string;
    description?: string | null;
    orderIndex?: number;
    estimatedDurationMinutes?: number | null;
    difficultyLevel?: string | null;
}): Promise<ContentResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<ContentResponse>(`${API}/contents`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

/** @deprecated use adminCreateContent */
export const adminCreateLesson = adminCreateContent;

type AdminUpdateContentBlockPayload = {
    orderIndex: number;
    kind: ContentBlockKind;
    payload: string;
    maxScore: number | null;
    isGradable: boolean;
};

type AdminUpdateContentBody = {
    sectionId?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    orderIndex?: number;
    estimatedDurationMinutes?: number | null;
    difficultyLevel?: string | null;
    isActive?: boolean;
    content?: string | null;
    blocks?: AdminUpdateContentBlockPayload[];
};

export async function adminUpdateContent(contentId: string, body: AdminUpdateContentBody): Promise<ContentResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<ContentResponse>(`${API}/contents/${encodeURIComponent(contentId)}`, {
                method: 'PUT',
                headers: buildHeaders(),
                body: JSON.stringify(body),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

/** @deprecated use adminUpdateContent */
export const adminUpdateLesson = adminUpdateContent;

export async function adminDeleteContent(contentId: string): Promise<void> {
    await mutateAndInvalidate(
        () =>
            requestApi<void>(
                `${API}/contents/${encodeURIComponent(contentId)}`,
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

/** @deprecated use adminDeleteContent */
export const adminDeleteLesson = adminDeleteContent;

export async function adminPatchContentStatus(contentId: string, isActive: boolean): Promise<ContentResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<ContentResponse>(`${API}/contents/${encodeURIComponent(contentId)}/status`, {
                method: 'PATCH',
                headers: buildHeaders(),
                body: JSON.stringify({ isActive }),
            }),
        [],
        [cacheKeys.admin.learningPrefix()]
    );
}

/** @deprecated use adminPatchContentStatus */
export const adminPatchLessonStatus = adminPatchContentStatus;

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
