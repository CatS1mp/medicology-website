export const CACHE_TTL = {
    SHORT: 30_000,
    MEDIUM: 2 * 60_000,
    LONG: 10 * 60_000,
} as const;

function join(parts: Array<string | number | null | undefined>): string {
    return parts
        .filter((part): part is string | number => part !== null && part !== undefined && String(part).length > 0)
        .map(String)
        .join(':');
}

function prefixed(prefix: string, ...parts: Array<string | number | null | undefined>): string {
    return `${prefix}:${join(parts)}`;
}

export const cacheKeys = {
    learning: {
        /** v2: list payloads normalized from PaginatedResponse; bump clears stale sessionStorage */
        courses: () => prefixed('learner', 'learning', 'courses', 'v2'),
        enrolledCourses: () => prefixed('learner', 'learning', 'courses', 'enrolled', 'v2'),
        availableCourses: () => prefixed('learner', 'learning', 'courses', 'available', 'v2'),
        progress: () => prefixed('learner', 'learning', 'progress'),
        contentActivity: (days: number) => prefixed('learner', 'learning', 'progress', 'activity', days),
        contentActivityPrefix: () => prefixed('learner', 'learning', 'progress', 'activity'),
        /** @deprecated use contentActivity */
        lessonActivity: (days: number) => prefixed('learner', 'learning', 'progress', 'activity', days),
        /** @deprecated use contentActivityPrefix */
        lessonActivityPrefix: () => prefixed('learner', 'learning', 'progress', 'activity'),
        streak: () => prefixed('learner', 'learning', 'streak'),
        learningPath: () => prefixed('learner', 'learning', 'path'),
        courseDetail: (courseId: string) => prefixed('learner', 'learning', 'course', courseId),
        courseSections: (courseId: string) => prefixed('learner', 'learning', 'course', courseId, 'sections'),
        sectionDetail: (sectionId: string) => prefixed('learner', 'learning', 'section', sectionId),
        sectionContents: (sectionId: string) => prefixed('learner', 'learning', 'section', sectionId, 'contents'),
        contentDetail: (contentId: string) => prefixed('learner', 'learning', 'content', contentId),
    },
    assessment: {
        myAttempts: () => prefixed('learner', 'assessment', 'my-attempts'),
        attemptResult: (attemptId: string) => prefixed('learner', 'assessment', 'attempt', attemptId, 'result'),
        attemptReview: (attemptId: string) => prefixed('learner', 'assessment', 'attempt', attemptId, 'review'),
        inProgressAttempts: () => prefixed('learner', 'assessment', 'in-progress'),
    },
    dictionary: {
        /** bumped when article list payload shape changed (PaginatedResponse `content`) */
        articles: () => prefixed('learner', 'dictionary', 'articles', 'v2'),
        articlePrefix: () => prefixed('learner', 'dictionary', 'article'),
        articleBySlug: (slug: string) => prefixed('learner', 'dictionary', 'article', slug),
        articleInteractions: (articleId: string) => prefixed('learner', 'dictionary', 'article', articleId, 'interactions'),
        articleViews: (articleId: string) => prefixed('learner', 'dictionary', 'article', articleId, 'views'),
        articleComments: (articleId: string) => prefixed('learner', 'dictionary', 'article', articleId, 'comments'),
        bookmarks: () => prefixed('learner', 'dictionary', 'bookmarks'),
    },
    auth: {
        currentUser: () => prefixed('auth', 'current-user'),
        currentProfile: () => prefixed('auth', 'current-profile'),
        currentSettings: () => prefixed('auth', 'current-settings'),
        linkedAccounts: () => prefixed('auth', 'linked-accounts'),
        sessions: () => prefixed('auth', 'sessions'),
    },
    admin: {
        users: (page?: number, size?: number) => prefixed('admin', 'users', `p${page ?? 0}`, `s${size ?? 0}`),
        userDetail: (userId: string) => prefixed('admin', 'users', userId),
        usersPrefix: () => prefixed('admin', 'users'),
        courses: () => prefixed('admin', 'learning', 'courses'),
        sections: (courseId: string) => prefixed('admin', 'learning', 'course', courseId, 'sections'),
        contents: (sectionId: string) => prefixed('admin', 'learning', 'section', sectionId, 'contents'),
        learningPrefix: () => prefixed('admin', 'learning'),
        assessments: () => prefixed('admin', 'assessment', 'assessments'),
        assessmentDetail: (assessmentId: string) => prefixed('admin', 'assessment', 'assessment', assessmentId),
        assessmentPrefix: () => prefixed('admin', 'assessment'),
        dictionaryArticles: () => prefixed('admin', 'dictionary', 'articles'),
        dictionaryArticleDetail: (articleId: string) => prefixed('admin', 'dictionary', 'article', articleId),
        dictionaryTags: () => prefixed('admin', 'dictionary', 'tags'),
        dictionaryTemplates: (activeOnly = true) => prefixed('admin', 'dictionary', 'templates', activeOnly ? 'active' : 'all'),
        dictionaryComponents: (activeOnly = true) => prefixed('admin', 'dictionary', 'components', activeOnly ? 'active' : 'all'),
        dictionaryPrefix: () => prefixed('admin', 'dictionary'),
    },
} as const;
