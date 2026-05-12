const DEFAULT_COURSE_ICON = '/images/Others/earth.png';

/** Normalize API `iconFileName` into a usable `img`/`Image` src. */
export function resolveCourseIconSrc(iconFileName: string | null | undefined): string {
    if (iconFileName == null || !String(iconFileName).trim()) {
        return DEFAULT_COURSE_ICON;
    }
    const trimmed = String(iconFileName).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `/${trimmed.replace(/^\/+/, '')}`;
}

export { DEFAULT_COURSE_ICON };
