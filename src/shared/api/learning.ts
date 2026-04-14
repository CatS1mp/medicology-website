import {
    AiLearningFeedback,
    CourseProgressResponse,
    CourseResponse,
    LearningApiError,
    LessonActivitySummaryResponse,
    LessonBlockProgressResponse,
    LearningPathResponse,
    LessonResponse,
    RequestAiFeedback,
    SectionResponse,
    Theme,
    UserDailyStreak,
} from '@/shared/types/learning';
import { ApiTransportError, buildHeaders, requestApi } from '@/shared/api/http';
import { cachedGet, mutateAndInvalidate } from '@/shared/api/cached-request';
import { CACHE_TTL, cacheKeys } from '@/shared/api/cache-policy';

const API = '/api/learning';

function notifyLearningCoursesChanged() {
    if (typeof window === 'undefined') return;
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
        message: 'Unknown learning error',
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

export function getCourses(): Promise<CourseResponse[]> {
    return cachedGet(cacheKeys.learning.courses(), CACHE_TTL.LONG, () =>
        jsonGet<CourseResponse[]>(`${API}/courses`)
    );
}

export function getThemes(): Promise<Theme[]> {
    return getCourses();
}

export function getEnrolledCourses(): Promise<CourseResponse[]> {
    return cachedGet(cacheKeys.learning.enrolledCourses(), CACHE_TTL.SHORT, () =>
        jsonGet<CourseResponse[]>(`${API}/courses/enrolled`)
    );
}

export function getAvailableStudentCourses(): Promise<CourseResponse[]> {
    return cachedGet(cacheKeys.learning.availableCourses(), CACHE_TTL.SHORT, () =>
        jsonGet<CourseResponse[]>(`${API}/courses/student/available`)
    );
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

export function getSectionLessons(sectionId: string): Promise<LessonResponse[]> {
    return cachedGet(cacheKeys.learning.sectionLessons(sectionId), CACHE_TTL.SHORT, () =>
        jsonGet<LessonResponse[]>(`${API}/sections/${encodeURIComponent(sectionId)}/lessons`)
    );
}

export function getLessonDetail(lessonId: string): Promise<LessonResponse> {
    return cachedGet(cacheKeys.learning.lessonDetail(lessonId), CACHE_TTL.SHORT, () =>
        jsonGet<LessonResponse>(`${API}/lessons/${encodeURIComponent(lessonId)}`)
    );
}

export function completeLesson(lessonId: string): Promise<void> {
    return mutateAndInvalidate(
        () => jsonPost<void>(`${API}/lessons/${encodeURIComponent(lessonId)}/complete`),
        [cacheKeys.learning.progress(), cacheKeys.learning.streak(), cacheKeys.learning.lessonDetail(lessonId)],
        [cacheKeys.learning.lessonActivityPrefix()]
    );
}

export function updateLessonBlockProgress(
    lessonId: string,
    blockId: string,
    data: { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; score?: number; maxScore?: number }
): Promise<LessonBlockProgressResponse> {
    return mutateAndInvalidate(
        () =>
            requestApi<LessonBlockProgressResponse>(
                `${API}/lessons/${encodeURIComponent(lessonId)}/blocks/${encodeURIComponent(blockId)}/progress`,
                {
                    method: 'PATCH',
                    headers: buildHeaders(),
                    body: JSON.stringify(data),
                }
            ).catch((error: unknown) => {
                throw normalizeLearningError(error);
            }),
        [cacheKeys.learning.progress(), cacheKeys.learning.lessonDetail(lessonId)],
        [cacheKeys.learning.lessonActivityPrefix()]
    );
}

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

export function getProgress(): Promise<CourseProgressResponse[]> {
    return cachedGet(cacheKeys.learning.progress(), CACHE_TTL.SHORT, () =>
        jsonGet<CourseProgressResponse[]>(`${API}/progress`)
    );
}

export function getLessonActivity(days: number = 7): Promise<LessonActivitySummaryResponse> {
    const normalizedDays = Math.max(1, days);
    return cachedGet(cacheKeys.learning.lessonActivity(normalizedDays), CACHE_TTL.SHORT, () =>
        jsonGet<LessonActivitySummaryResponse>(`${API}/progress/activity?days=${normalizedDays}`)
    );
}

export function pingStreak(): Promise<UserDailyStreak> {
    return jsonPost<UserDailyStreak>(`${API}/progress/streak/ping`);
}

export function requestAiFeedback(data: RequestAiFeedback): Promise<AiLearningFeedback> {
    return jsonPost<AiLearningFeedback>(`${API}/ai-feedback`, data);
}
