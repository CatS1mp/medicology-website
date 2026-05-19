import { getCourseDetail } from '@/shared/api/learning';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeCourseRouteParam(param: string): string {
    try {
        return decodeURIComponent(param).trim();
    } catch {
        return param.trim();
    }
}

export function isCourseUuid(value: string): boolean {
    return UUID_RE.test(value);
}

/** Path tới roadmap — ưu tiên slug, fallback id (BE chấp nhận cả hai). */
export function courseRoadmapPath(course: { slug?: string | null; id: string }): string {
    const key = course.slug?.trim() || course.id;
    return `/courses/${key}`;
}

/** Chuẩn hóa param từ URL trước khi gọi learner-roadmap. */
export async function resolveCourseRoadmapKey(routeParam: string): Promise<string> {
    const key = normalizeCourseRouteParam(routeParam);
    if (!key) {
        throw new Error('Thiếu thông tin khóa học.');
    }
    if (!isCourseUuid(key)) {
        return key;
    }
    const course = await getCourseDetail(key);
    const slug = course.slug?.trim();
    return slug || key;
}
