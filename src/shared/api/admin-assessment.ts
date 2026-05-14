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

export async function createAssessmentAdmin(body: {
    title: string;
    courseId: string;
    sectionId: string;
    passScore: number;
    timeLimitMinutes?: number | null;
}): Promise<AssessmentAdminListItem> {
    void body;
    throw new Error('Quản lý bài kiểm tra độc lập đã gỡ bỏ. Nội dung chấm điểm nằm trong từng khối nội dung (content).');
}

export async function deleteAssessmentAdmin(assessmentId: string): Promise<void> {
    void assessmentId;
    return;
}

export async function getAssessmentAdmin(assessmentId: string): Promise<AssessmentAdminDetail> {
    void assessmentId;
    throw new Error('API bài kiểm tra độc lập đã gỡ bỏ; nội dung nằm trong khối content.');
}

export async function putAssessmentAdmin(
    assessmentId: string,
    body: Partial<AssessmentAdminDetail> & { title?: string; passScore?: number }
): Promise<AssessmentAdminDetail> {
    void assessmentId;
    void body;
    throw new Error('API bài kiểm tra độc lập đã gỡ bỏ; nội dung nằm trong khối content.');
}
