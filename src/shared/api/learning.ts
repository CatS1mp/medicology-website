import {
    AiLearningFeedback,
    ContentActivitySummaryResponse,
    CourseProgressResponse,
    CourseRoadmapApiResponse,
    DashboardProgressResponse,
    CourseResponse,
    LearningApiError,
    ContentResponse,
    LearningPathResponse,
    RequestAiFeedback,
    SectionResponse,
    Theme,
    UserDailyStreak,
} from '@/shared/types/learning';
import { ApiTransportError, buildHeaders, requestApi } from '@/shared/api/http';
import { cachedGet, mutateAndInvalidate } from '@/shared/api/cached-request';
import { invalidateCachedValue, invalidateCachedValueByPrefix } from '@/shared/api/client-cache';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';
import { normalizeSpringListPayload } from '@/shared/types/admin';

const API = '/api/learning';

function notifyLearningCoursesChanged() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('learning:courses-changed'));
}

export function notifyLearningProgressChanged() {
    if (typeof window === 'undefined') return;
    invalidateCachedValue(cacheKeys.learning.progress());
    invalidateCachedValue(cacheKeys.learning.dashboardProgress(7));
    invalidateCachedValue(cacheKeys.learning.dashboardProgress(14));
    invalidateCachedValue(cacheKeys.learning.contentActivityPrefix());
    invalidateCachedValue(cacheKeys.learning.recommendationContext(8));
    invalidateLearnerRoadmapCache();
    window.dispatchEvent(new Event('learning:progress-changed'));
    window.dispatchEvent(new Event('learning:courses-changed'));
}

function normalizeLearningError(error: unknown): LearningApiError {
    if (error instanceof LearningApiError) return error;
    if (error instanceof ApiTransportError) {
        return new LearningApiError({
            status: error.status,
            message: error.message,
            timestamp: error.timestamp,
        });
    }

    return new LearningApiError({
        status: 500,
        message: 'Lỗi dịch vụ học tập không xác định',
        timestamp: new Date().toISOString(),
    });
}

function jsonGet<T>(url: string): Promise<T> {
    return requestApi<T>(url, {
        method: 'GET',
        headers: buildHeaders(),
    }).catch((error: unknown) => {
        throw normalizeLearningError(error);
    });
}

function jsonPost<T>(url: string, data?: unknown): Promise<T> {
    return requestApi<T>(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }).catch((error: unknown) => {
        throw normalizeLearningError(error);
    });
}

/** Learning service wraps list results in a Spring-style paginated object (`content`, `totalElements`, …). */
function fetchCourseList(subpath: string): Promise<CourseResponse[]> {
    const query = new URLSearchParams({ page: '0', size: '5000' }).toString();
    return requestApi<unknown>(`${API}/${subpath}?${query}`, {
        method: 'GET',
        headers: buildHeaders({ includeJsonContentType: false }),
    }).then((raw) => normalizeSpringListPayload<CourseResponse>(raw).items);
}

/** Coerce cached or legacy payloads (e.g. raw PaginatedResponse) into a flat list. */
function toLearnerCourseList(raw: unknown): CourseResponse[] {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw as CourseResponse[];
    return normalizeSpringListPayload<CourseResponse>(raw).items;
}

export function getCourses(): Promise<CourseResponse[]> {
    return cachedGet(cacheKeys.learning.courses(), CACHE_TTL.LONG, () => fetchCourseList('courses')).then(toLearnerCourseList);
}

export function getThemes(): Promise<Theme[]> {
    return getCourses();
}

export function getEnrolledCourses(): Promise<CourseResponse[]> {
    return cachedGet(cacheKeys.learning.enrolledCourses(), CACHE_TTL.SHORT, () =>
        fetchCourseList('courses/enrolled')
    ).then(toLearnerCourseList);
}

export function getAvailableStudentCourses(): Promise<CourseResponse[]> {
    return cachedGet(cacheKeys.learning.availableCourses(), CACHE_TTL.SHORT, () =>
        fetchCourseList('courses/student/available')
    ).then(toLearnerCourseList);
}

export function getEnrolledCoursesPaged(params: { page: number; size: number }): Promise<{ items: CourseResponse[]; total: number }> {
    const query = new URLSearchParams({ page: String(params.page), size: String(params.size) }).toString();
    return cachedGet(`${cacheKeys.learning.enrolledCourses()}:${params.page}:${params.size}`, CACHE_TTL.SHORT, async () => {
        const raw = await requestApi<unknown>(`${API}/courses/enrolled?${query}`, {
            method: 'GET',
            headers: buildHeaders({ includeJsonContentType: false }),
        });
        return normalizeSpringListPayload<CourseResponse>(raw);
    });
}

export function getAvailableStudentCoursesPaged(params: { page: number; size: number }): Promise<{ items: CourseResponse[]; total: number }> {
    const query = new URLSearchParams({ page: String(params.page), size: String(params.size) }).toString();
    return cachedGet(`${cacheKeys.learning.availableCourses()}:${params.page}:${params.size}`, CACHE_TTL.SHORT, async () => {
        const raw = await requestApi<unknown>(`${API}/courses/student/available?${query}`, {
            method: 'GET',
            headers: buildHeaders({ includeJsonContentType: false }),
        });
        return normalizeSpringListPayload<CourseResponse>(raw);
    });
}

export function getLearningPath(): Promise<LearningPathResponse> {
    return cachedGet(cacheKeys.learning.learningPath(), CACHE_TTL.MEDIUM, () =>
        jsonGet<LearningPathResponse>(`${API}/courses/path`)
    );
}

export function getCourseDetail(courseId: string): Promise<CourseResponse> {
    return cachedGet(cacheKeys.learning.courseDetail(courseId), CACHE_TTL.MEDIUM, () =>
        jsonGet<CourseResponse>(`${API}/courses/${encodeURIComponent(courseId)}`)
    );
}

export function getCourseSections(courseId: string): Promise<SectionResponse[]> {
    return cachedGet(cacheKeys.learning.courseSections(courseId), CACHE_TTL.MEDIUM, () =>
        jsonGet<SectionResponse[]>(`${API}/courses/${encodeURIComponent(courseId)}/sections`)
    );
}

export function getThemeSections(themeId: string): Promise<SectionResponse[]> {
    return getCourseSections(themeId);
}

export function getSectionDetail(sectionId: string): Promise<SectionResponse> {
    return cachedGet(cacheKeys.learning.sectionDetail(sectionId), CACHE_TTL.MEDIUM, () =>
        jsonGet<SectionResponse>(`${API}/sections/${encodeURIComponent(sectionId)}`)
    );
}

export function getSectionContents(sectionId: string): Promise<ContentResponse[]> {
    return cachedGet(cacheKeys.learning.sectionContents(sectionId), CACHE_TTL.SHORT, () =>
        jsonGet<ContentResponse[]>(`${API}/sections/${encodeURIComponent(sectionId)}/contents`)
    );
}

/** @deprecated use getSectionContents */
export const getSectionLessons = getSectionContents;

export function getContentDetail(contentId: string): Promise<ContentResponse> {
    return cachedGet(cacheKeys.learning.contentDetail(contentId), CACHE_TTL.SHORT, () =>
        jsonGet<ContentResponse>(`${API}/contents/${encodeURIComponent(contentId)}`)
    );
}

/** @deprecated use getContentDetail */
export const getLessonDetail = getContentDetail;

export function enrollCourse(courseId: string): Promise<CourseResponse> {
    return mutateAndInvalidate(
        () => jsonPost<CourseResponse>(`${API}/courses/${encodeURIComponent(courseId)}/enroll`),
        [
            cacheKeys.learning.availableCourses(),
            cacheKeys.learning.enrolledCourses(),
            cacheKeys.learning.progress(),
            cacheKeys.learning.courses(),
        ]
    ).then((result) => {
        notifyLearningCoursesChanged();
        return result;
    });
}

type CourseProgressPayload = CourseProgressResponse & {
    completionPercentage?: number;
    completedPercentage?: number;
    progressPercent?: number;
    percentComplete?: number;
};

function normalizeCourseProgress(raw: CourseProgressPayload): CourseProgressResponse {
    return {
        ...raw,
        completionPercent:
            raw.completionPercent ??
            raw.completionPercentage ??
            raw.completedPercentage ??
            raw.progressPercent ??
            raw.percentComplete ??
            0,
    };
}

export function getProgress(): Promise<CourseProgressResponse[]> {
    return cachedGet(cacheKeys.learning.progress(), CACHE_TTL.SHORT, async () => {
        const raw = await jsonGet<unknown>(`${API}/progress`);
        const items = Array.isArray(raw)
            ? raw
            : normalizeSpringListPayload<CourseProgressPayload>(raw).items;
        return (items as CourseProgressPayload[]).map(normalizeCourseProgress);
    });
}

export function getDashboardProgress(activityDays: number = 7): Promise<DashboardProgressResponse> {
    const days = Math.max(1, activityDays);
    return cachedGet(cacheKeys.learning.dashboardProgress(days), CACHE_TTL.SHORT, () =>
        jsonGet<DashboardProgressResponse>(`${API}/progress/dashboard?activityDays=${days}`)
    );
}

export interface RecommendationContextItem {
    contentId: string;
    contentName: string;
    courseName: string | null;
    sectionName: string | null;
    submittedAt: string;
    passed: boolean;
}

export function getRecommendationContext(limit: number = 8): Promise<RecommendationContextItem[]> {
    const normalized = Math.max(1, Math.min(limit, 20));
    return cachedGet(cacheKeys.learning.recommendationContext(normalized), CACHE_TTL.SHORT, () =>
        jsonGet<RecommendationContextItem[]>(`${API}/progress/recommendation-context?limit=${normalized}`)
    );
}

export function invalidateLearnerRoadmapCache(slug?: string) {
    if (slug) {
        invalidateCachedValue(cacheKeys.learning.learnerRoadmap(slug.trim()));
        return;
    }
    invalidateCachedValueByPrefix('learner:learning:roadmap');
}

export function getLearnerRoadmap(courseSlugOrId: string): Promise<CourseRoadmapApiResponse> {
    const key = courseSlugOrId.trim();
    const encoded = encodeURIComponent(key);
    return cachedGet(cacheKeys.learning.learnerRoadmap(key), CACHE_TTL.SHORT, () =>
        jsonGet<CourseRoadmapApiResponse>(`${API}/courses/slug/${encoded}/learner-roadmap`)
    );
}

export function getContentActivity(days: number = 7): Promise<ContentActivitySummaryResponse> {
    const normalizedDays = Math.max(1, days);
    return cachedGet(cacheKeys.learning.contentActivity(normalizedDays), CACHE_TTL.SHORT, () =>
        jsonGet<ContentActivitySummaryResponse>(`${API}/progress/activity?days=${normalizedDays}`)
    );
}

/** @deprecated use getContentActivity */
export const getLessonActivity = getContentActivity;

export function pingStreak(): Promise<UserDailyStreak> {
    return jsonPost<UserDailyStreak>(`${API}/progress/streak/ping`);
}

export function requestAiFeedback(data: RequestAiFeedback): Promise<AiLearningFeedback> {
    return jsonPost<AiLearningFeedback>(`${API}/ai-feedback`, data);
}
