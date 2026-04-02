import {
    AiLearningFeedback,
    Course,
    LearningApiError,
    LearningPathResponse,
    RequestAiFeedback,
    SectionResponse,
    SectionTest,
    SubmitCourseQuizRequest,
    SubmitSectionTestRequest,
    Theme,
    UserCourse,
    UserDailyStreak,
    UserSectionTest,
} from '@/shared/types/learning';

const API = '/api/learning';
const AUTH = '/api/auth';

type RefreshResponse = {
    accessToken: string;
    refreshToken: string;
};

let refreshInFlight: Promise<string | null> | null = null;

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            return res.json() as Promise<T>;
        }
        return res.text() as unknown as T;
    }

    let body;
    try {
        body = await res.json();
    } catch {
        body = { status: res.status, message: res.statusText, timestamp: new Date().toISOString() };
    }
    throw new LearningApiError(body);
}

function getAuthHeader(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

async function refreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (!currentRefreshToken) return null;

    if (refreshInFlight) {
        return refreshInFlight;
    }

    refreshInFlight = (async () => {
        try {
            const res = await fetch(`${AUTH}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: currentRefreshToken }),
            });

            if (!res.ok) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                return null;
            }

            const payload = (await res.json()) as RefreshResponse;
            if (!payload.accessToken) {
                return null;
            }

            localStorage.setItem('accessToken', payload.accessToken);
            if (payload.refreshToken) {
                localStorage.setItem('refreshToken', payload.refreshToken);
            }

            return payload.accessToken;
        } catch {
            return null;
        } finally {
            refreshInFlight = null;
        }
    })();

    return refreshInFlight;
}

async function requestWithAutoRefresh(url: string, init: RequestInit, allowRetry: boolean): Promise<Response> {
    let res = await fetch(url, init);
    if (res.status !== 401 || !allowRetry) {
        return res;
    }

    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
        return res;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

    res = await fetch(url, {
        ...init,
        headers: retryHeaders,
    });

    return res;
}

async function get<T>(url: string): Promise<T> {
    const res = await requestWithAutoRefresh(url, {
        method: 'GET',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
    }, true);

    return handleResponse<T>(res);
}

async function post<T>(url: string, data?: unknown): Promise<T> {
    const res = await requestWithAutoRefresh(url, {
        method: 'POST',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }, true);

    return handleResponse<T>(res);
}

// ─── Themes / Sections (DTO) ─────────────────────────────────────────────

export function getThemes(): Promise<Theme[]> {
    return get<Theme[]>(`${API}/themes`);
}

export function getCourseSections(courseId: string): Promise<SectionResponse[]> {
    return get<SectionResponse[]>(`${API}/courses/${courseId}/sections`);
}

// Backward compatible alias (course is legacy "theme").
export function getThemeSections(themeId: string): Promise<SectionResponse[]> {
    return getCourseSections(themeId);
}

export async function getSectionLessons(sectionId: string): Promise<Course[]> {
    const candidates = [
        `${API}/sections/${sectionId}/lessons`,
        `${API}/lessons/sections/${sectionId}`,
        `${API}/lessons?sectionId=${sectionId}`,
        `${API}/sections/${sectionId}/courses`,
        `${API}/courses/sections/${sectionId}`,
        `${API}/courses?sectionId=${sectionId}`,
    ];

    for (const url of candidates) {
        try {
            const data = await get<unknown>(url);
            if (Array.isArray(data)) {
                return data as Course[];
            }
        } catch {
            // Try next known backend variant.
        }
    }

    return [];
}

// Backward compatible alias for old naming in code.
export function getSectionCourses(sectionId: string): Promise<Course[]> {
    return getSectionLessons(sectionId);
}

// ─── Courses (mixed) ────────────────────────────────────────────────────

export function getCourses(): Promise<Theme[]> {
    return get<Theme[]>(`${API}/courses`);
}

export function getLearningPath(): Promise<LearningPathResponse> {
    return get<LearningPathResponse>(`${API}/courses/path`);
}

export function getCourseDetail(courseId: string): Promise<Course> {
    return get<Course>(`${API}/courses/${courseId}`);
}

export function enrollCourse(courseId: string): Promise<string> {
    return post<string>(`${API}/courses/${courseId}/enroll`);
}

// ─── Progress ───────────────────────────────────────────────────────────

export function getProgress(): Promise<UserCourse[]> {
    return get<UserCourse[]>(`${API}/progress`);
}

export function pingStreak(): Promise<UserDailyStreak> {
    return post<UserDailyStreak>(`${API}/progress/streak/ping`);
}

// ─── Tests ──────────────────────────────────────────────────────────────

export function getSectionTest(sectionId: string): Promise<SectionTest> {
    return get<SectionTest>(`${API}/tests/section/${sectionId}`);
}

export function submitCourseQuiz(courseId: string, data: SubmitCourseQuizRequest): Promise<string> {
    return post<string>(`${API}/tests/course/${courseId}/submit`, data);
}

export function submitSectionTest(sectionId: string, data: SubmitSectionTestRequest): Promise<string> {
    return post<string>(`${API}/tests/section/${sectionId}/submit`, data);
}

export function getTestResults(): Promise<UserSectionTest[]> {
    return get<UserSectionTest[]>(`${API}/tests/results`);
}

// ─── AI Feedback ─────────────────────────────────────────────────────────

export function requestAiFeedback(data: RequestAiFeedback): Promise<AiLearningFeedback> {
    return post<AiLearningFeedback>(`${API}/ai-feedback`, data);
}
