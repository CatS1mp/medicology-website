import {
    AiLearningFeedback,
    CourseProgressResponse,
    CourseResponse,
    LearningApiError,
    LearningPathResponse,
    LessonResponse,
    RequestAiFeedback,
    SectionResponse,
    Theme,
    UserDailyStreak,
} from '@/shared/types/learning';
import { ApiTransportError, buildHeaders, requestApi } from '@/shared/api/http';

const API = '/api/learning';

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
    return jsonGet<CourseResponse[]>(`${API}/courses`);
}

export function getThemes(): Promise<Theme[]> {
    return getCourses();
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
    return jsonPost<void>(`${API}/lessons/${encodeURIComponent(lessonId)}/complete`);
}

export function getProgress(): Promise<CourseProgressResponse[]> {
    return jsonGet<CourseProgressResponse[]>(`${API}/progress`);
}

export function pingStreak(): Promise<UserDailyStreak> {
    return jsonPost<UserDailyStreak>(`${API}/progress/streak/ping`);
}

export function requestAiFeedback(data: RequestAiFeedback): Promise<AiLearningFeedback> {
    return jsonPost<AiLearningFeedback>(`${API}/ai-feedback`, data);
}
