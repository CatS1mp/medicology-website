import {
    AiLearningFeedback,
    Course,
    LearningPathResponse,
    RequestAiFeedback,
    SectionTest,
    SubmitCourseQuizRequest,
    SubmitSectionTestRequest,
    Theme,
    UserCourse,
    UserDailyStreak,
    UserSectionTest,
    LearningApiError
} from './types';

const API = '/api/learning';

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
    return { 'Authorization': `Bearer ${token}` };
}

function get<T>(url: string): Promise<T> {
    return fetch(url, {
        method: 'GET',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
    }).then(res => handleResponse<T>(res));
}

function post<T>(url: string, data?: unknown): Promise<T> {
    return fetch(url, {
        method: 'POST',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }).then(res => handleResponse<T>(res));
}

// ─── Courses ─────────────────────────────────────────────────────────────

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

// ─── Progress ────────────────────────────────────────────────────────────

export function getProgress(): Promise<UserCourse[]> {
    return get<UserCourse[]>(`${API}/progress`);
}

export function pingStreak(): Promise<UserDailyStreak> {
    return post<UserDailyStreak>(`${API}/progress/streak/ping`);
}

// ─── Tests ───────────────────────────────────────────────────────────────

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
