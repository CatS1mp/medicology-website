import {
    AiLearningFeedback,
    CourseProgressResponse,
    CourseResponse,
    LearningApiError,
    LessonActivitySummaryResponse,
    LearningPathResponse,
    LessonResponse,
    RequestAiFeedback,
    SectionResponse,
    Theme,
    UserDailyStreak,
} from '@/shared/types/learning';
import { ApiTransportError, buildHeaders, requestApi } from '@/shared/api/http';
import { getOrSetCachedValue, invalidateCachedValue } from '@/shared/api/client-cache';

const API = '/api/learning';
const COURSES_CACHE_KEY = 'learning:courses';
const ENROLLED_COURSES_CACHE_KEY = 'learning:courses:enrolled';
const AVAILABLE_COURSES_CACHE_KEY = 'learning:courses:available';
const PROGRESS_CACHE_KEY = 'learning:progress';
const LESSON_ACTIVITY_CACHE_KEY = 'learning:progress:activity:';
const STREAK_CACHE_KEY = 'learning:streak';
const SHORT_TTL_MS = 30_000;
const STANDARD_TTL_MS = 5 * 60_000;

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
    return getOrSetCachedValue(COURSES_CACHE_KEY, STANDARD_TTL_MS, () =>
        jsonGet<CourseResponse[]>(`${API}/courses`)
    );
}

export function getThemes(): Promise<Theme[]> {
    return getCourses();
}

export function getEnrolledCourses(): Promise<CourseResponse[]> {
    return getOrSetCachedValue(ENROLLED_COURSES_CACHE_KEY, SHORT_TTL_MS, () =>
        jsonGet<CourseResponse[]>(`${API}/courses/enrolled`)
    );
}

export function getAvailableStudentCourses(): Promise<CourseResponse[]> {
    return getOrSetCachedValue(AVAILABLE_COURSES_CACHE_KEY, SHORT_TTL_MS, () =>
        jsonGet<CourseResponse[]>(`${API}/courses/student/available`)
    );
}

export function getLearningPath(): Promise<LearningPathResponse> {
    return jsonGet<LearningPathResponse>(`${API}/courses/path`);
}

export function getCourseDetail(courseId: string): Promise<CourseResponse> {
    return jsonGet<CourseResponse>(`${API}/courses/${encodeURIComponent(courseId)}`);
}

export function getCourseSections(courseId: string): Promise<SectionResponse[]> {
    return jsonGet<SectionResponse[]>(`${API}/courses/${encodeURIComponent(courseId)}/sections`);
}

export function getThemeSections(themeId: string): Promise<SectionResponse[]> {
    return getCourseSections(themeId);
}

export function getSectionDetail(sectionId: string): Promise<SectionResponse> {
    return jsonGet<SectionResponse>(`${API}/sections/${encodeURIComponent(sectionId)}`);
}

export function getSectionLessons(sectionId: string): Promise<LessonResponse[]> {
    return jsonGet<LessonResponse[]>(`${API}/sections/${encodeURIComponent(sectionId)}/lessons`);
}

export function getLessonDetail(lessonId: string): Promise<LessonResponse> {
    return jsonGet<LessonResponse>(`${API}/lessons/${encodeURIComponent(lessonId)}`);
}

export function completeLesson(lessonId: string): Promise<void> {
    return jsonPost<void>(`${API}/lessons/${encodeURIComponent(lessonId)}/complete`).then((result) => {
        invalidateCachedValue(
            PROGRESS_CACHE_KEY,
            `${LESSON_ACTIVITY_CACHE_KEY}7`,
            `${LESSON_ACTIVITY_CACHE_KEY}14`,
            STREAK_CACHE_KEY
        );
        return result;
    });
}

export function enrollCourse(courseId: string): Promise<CourseResponse> {
    return jsonPost<CourseResponse>(`${API}/courses/${encodeURIComponent(courseId)}/enroll`).then((result) => {
        invalidateCachedValue(AVAILABLE_COURSES_CACHE_KEY, ENROLLED_COURSES_CACHE_KEY, PROGRESS_CACHE_KEY);
        notifyLearningCoursesChanged();
        return result;
    });
}

export function getProgress(): Promise<CourseProgressResponse[]> {
    return getOrSetCachedValue(PROGRESS_CACHE_KEY, SHORT_TTL_MS, () =>
        jsonGet<CourseProgressResponse[]>(`${API}/progress`)
    );
}

export function getLessonActivity(days: number = 7): Promise<LessonActivitySummaryResponse> {
    const normalizedDays = Math.max(1, days);
    return getOrSetCachedValue(`${LESSON_ACTIVITY_CACHE_KEY}${normalizedDays}`, SHORT_TTL_MS, () =>
        jsonGet<LessonActivitySummaryResponse>(`${API}/progress/activity?days=${normalizedDays}`)
    );
}

export function pingStreak(): Promise<UserDailyStreak> {
    return getOrSetCachedValue(STREAK_CACHE_KEY, STANDARD_TTL_MS, () =>
        jsonPost<UserDailyStreak>(`${API}/progress/streak/ping`)
    );
}

export function requestAiFeedback(data: RequestAiFeedback): Promise<AiLearningFeedback> {
    return jsonPost<AiLearningFeedback>(`${API}/ai-feedback`, data);
}
