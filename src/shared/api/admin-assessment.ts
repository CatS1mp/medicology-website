/** Legacy row shape for admin UI; standalone assessment CRUD was removed from the API. */
export interface AssessmentAdminListItem {
    id: string;
    title: string;
    description?: string | null;
    courseId: string;
    sectionId: string;
    lessonId?: string | null;
    passScore: number;
    timeLimitMinutes?: number | null;
    status: string;
    active: boolean;
}

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

export async function listAssessmentsAdmin(): Promise<AssessmentAdminListItem[]> {
    return [];
}

export async function createAssessmentAdmin(_body: {
    title: string;
    courseId: string;
    sectionId: string;
    passScore: number;
    timeLimitMinutes?: number | null;
}): Promise<AssessmentAdminListItem> {
    throw new Error('Quản lý bài kiểm tra độc lập đã gỡ bỏ. Nội dung chấm điểm nằm trong từng khối nội dung (content).');
}

export async function deleteAssessmentAdmin(_assessmentId: string): Promise<void> {
    return;
}

export async function getAssessmentAdmin(_assessmentId: string): Promise<AssessmentAdminDetail> {
    throw new Error('API bài kiểm tra độc lập đã gỡ bỏ; nội dung nằm trong khối content.');
}

export async function putAssessmentAdmin(
    _assessmentId: string,
    _body: Partial<AssessmentAdminDetail> & { title?: string; passScore?: number }
): Promise<AssessmentAdminDetail> {
    throw new Error('API bài kiểm tra độc lập đã gỡ bỏ; nội dung nằm trong khối content.');
}
