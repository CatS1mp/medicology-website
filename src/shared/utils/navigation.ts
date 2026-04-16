export function isBlockedNavigationHref(href: string): boolean {
    const value = href.trim().toLowerCase();
    return value.startsWith('/api/') || value.startsWith('api/');
}

export function sanitizeAppHref(href: string, fallback = '/dashboard'): string {
    if (!href) {
        return fallback;
    }
    if (isBlockedNavigationHref(href)) {
        return fallback;
    }
    return href;
}
