import { create } from 'zustand';
import { pingStreak, getEnrolledCourses, getLearningPath, getProgress } from '@/shared/api/learning';
import { getMyAttempts } from '@/shared/api/assessment';
import { CourseProgressResponse, CourseResponse, LearningPathResponse } from '@/shared/types/learning';
import type { AttemptSummaryResponse } from '@/shared/types/assessment';
import type { LearningProgressChangedDetail } from '@/shared/api/learning';
import { getCachedUserProfile } from '@/features/auth/session';
import { getCourseAttemptProgressData } from '@/shared/utils/learning-progress';

let userStoreVersion = 0;
let loadUserDataPromise: Promise<void> | null = null;

const LAST_KNOWN_STREAK_KEY = 'lastKnownStreak';
const LAST_BROKEN_STREAK_ACK_DATE_KEY = 'lastBrokenStreakAckDate';
const LAST_GAINED_STREAK_ACK_DATE_KEY = 'lastGainedStreakAckDate';
const LAST_LEARNING_STREAK_ACK_DATE_KEY = 'lastLearningStreakAckDate';
const PENDING_STREAK_CARD_KEY = 'pendingStreakCard';
const STREAK_UPDATED_EVENT = 'learning-streak-updated';

function getLocalStorageItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setLocalStorageItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable in private/restricted browser modes.
    }
}

function getScopedStorageKey(key: string): string {
    const userId = getCachedUserProfile()?.userId;
    return userId ? `${key}:${userId}` : key;
}

function getScopedLocalStorageItem(key: string): string | null {
    const scopedValue = getLocalStorageItem(getScopedStorageKey(key));
    if (scopedValue !== null) return scopedValue;
    return getLocalStorageItem(key);
}

function setScopedLocalStorageItem(key: string, value: string) {
    setLocalStorageItem(getScopedStorageKey(key), value);
}

function dispatchBrowserEvent(eventName: string) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(eventName));
}

function removeScopedLocalStorageItem(key: string) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(getScopedStorageKey(key));
        window.localStorage.removeItem(key);
    } catch {
        // Storage can be unavailable in private/restricted browser modes.
    }
}

function readStoredStreakDays(): number | null {
    const raw = getScopedLocalStorageItem(LAST_KNOWN_STREAK_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

type PendingStreakCard =
    | { type: 'broken'; lost: number; date: string }
    | { type: 'gained'; from: number; gained: number; date: string };

function readPendingStreakCard(): PendingStreakCard | null {
    const raw = getScopedLocalStorageItem(PENDING_STREAK_CARD_KEY);
    if (!raw) return null;
    try {
        const value = JSON.parse(raw) as PendingStreakCard;
        if (value.date !== todayKey()) return null;
        if (value.type === 'broken' && Number.isFinite(value.lost)) return value;
        if (value.type === 'gained' && Number.isFinite(value.from) && Number.isFinite(value.gained)) return value;
    } catch {
        return null;
    }
    return null;
}

function writePendingStreakCard(value: PendingStreakCard) {
    setScopedLocalStorageItem(PENDING_STREAK_CARD_KEY, JSON.stringify(value));
}

function todayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function findCourseByContentId(courses: CourseResponse[], contentId: string): CourseResponse | undefined {
    return courses.find((course) =>
        (course.sections ?? []).some((section) =>
            (section.contents ?? []).some((content) => content.id === contentId)
        )
    );
}

export interface UserStoreState {
    streakDays: number | null;
    courses: CourseResponse[];
    courseProgress: CourseProgressResponse[];
    attempts: AttemptSummaryResponse[];
    roadmap: LearningPathResponse | null;
    isLoading: boolean;
    error: string | null;
    hasLoaded: boolean;
    hasSeenDashboardLoading: boolean;
    lostStreakAmount: number | null;
    gainedStreakAmount: number | null;
    gainedFromStreak: number | null;
    streakCardsBlocked: boolean;

    loadUserData: () => Promise<void>;
    addEnrolledCourse: (course: CourseResponse) => void;
    setLearningProgressData: (progress: CourseProgressResponse[], attempts: AttemptSummaryResponse[]) => void;
    recordLearningProgressChange: (detail: LearningProgressChangedDetail | undefined) => void;
    recordStreakSync: (
        days: number,
        previousDays?: number | null,
        options?: { source?: 'session' | 'learning-completion' }
    ) => void;
    updateStreak: (days: number) => void;
    clearUserData: () => void;
    setHasSeenDashboardLoading: (seen: boolean) => void;
    setStreakCardsBlocked: (blocked: boolean) => void;
    dismissBrokenStreak: () => void;
    dismissGainedStreak: () => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
    streakDays: null,
    courses: [],
    courseProgress: [],
    attempts: [],
    roadmap: null,
    isLoading: false,
    error: null,
    hasLoaded: false,
    hasSeenDashboardLoading: false,
    lostStreakAmount: null,
    gainedStreakAmount: null,
    gainedFromStreak: null,
    streakCardsBlocked: false,

    loadUserData: async () => {
        if (loadUserDataPromise) return loadUserDataPromise;
        const requestVersion = userStoreVersion;
        set({ isLoading: true, error: null });
        loadUserDataPromise = (async () => {
            const [streakRes, coursesRes, roadmapRes, progressRes, attemptsRes] = await Promise.all([
                pingStreak().catch(() => null),
                getEnrolledCourses().catch(() => []),
                getLearningPath().catch(() => null),
                getProgress().catch(() => []),
                getMyAttempts().catch(() => []),
            ]);

            let newlyLostStreak: number | null = null;
            let newlyGainedStreak: number | null = null;
            let gainedFrom: number | null = null;
            const pendingCard = readPendingStreakCard();

            if (streakRes) {
                if (typeof window !== 'undefined') {
                    // if prevStreak is null, we assume it's their first time logging in this browser and we don't necessarily want to animate unless we want to.
                    // But if it's there, we can compare.
                    const prevStreak = readStoredStreakDays() ?? streakRes.currentStreak;
                    const today = todayKey();
                    
                    if (prevStreak > 0 && streakRes.currentStreak === 0) {
                        const lastAck = getScopedLocalStorageItem(LAST_BROKEN_STREAK_ACK_DATE_KEY);
                        if (lastAck !== today) {
                            newlyLostStreak = prevStreak;
                            writePendingStreakCard({ type: 'broken', lost: prevStreak, date: today });
                            setScopedLocalStorageItem(LAST_BROKEN_STREAK_ACK_DATE_KEY, today);
                        }
                    } else if (streakRes.currentStreak > prevStreak) {
                        const lastGainAck = getScopedLocalStorageItem(LAST_GAINED_STREAK_ACK_DATE_KEY);
                        if (lastGainAck !== today) {
                            newlyGainedStreak = streakRes.currentStreak;
                            gainedFrom = prevStreak;
                            writePendingStreakCard({
                                type: 'gained',
                                from: prevStreak,
                                gained: streakRes.currentStreak,
                                date: today,
                            });
                            setScopedLocalStorageItem(LAST_GAINED_STREAK_ACK_DATE_KEY, today);
                        }
                    }
                    setScopedLocalStorageItem(LAST_KNOWN_STREAK_KEY, streakRes.currentStreak.toString());
                }
            }

            if (requestVersion !== userStoreVersion) {
                return;
            }

            set({
                streakDays: streakRes?.currentStreak ?? null,
                courses: coursesRes,
                courseProgress: progressRes,
                attempts: attemptsRes,
                roadmap: roadmapRes,
                isLoading: false,
                hasLoaded: true,
                ...(pendingCard?.type === 'broken' ? { lostStreakAmount: pendingCard.lost } : {}),
                ...(pendingCard?.type === 'gained' ? { gainedStreakAmount: pendingCard.gained, gainedFromStreak: pendingCard.from } : {}),
                ...(newlyLostStreak !== null ? { lostStreakAmount: newlyLostStreak } : {}),
                ...(newlyGainedStreak !== null ? { gainedStreakAmount: newlyGainedStreak, gainedFromStreak: gainedFrom } : {})
            });
            if (streakRes) {
                dispatchBrowserEvent(STREAK_UPDATED_EVENT);
            }
        })().catch((err: unknown) => {
            if (requestVersion !== userStoreVersion) {
                return;
            }
            set({ 
                error: err instanceof Error ? err.message : 'Failed to load user data',
                isLoading: false,
                hasLoaded: true,
            });
        }).finally(() => {
            loadUserDataPromise = null;
        });

        return loadUserDataPromise;
    },

    addEnrolledCourse: (course: CourseResponse) => set((state) => {
        if (state.courses.some((item) => item.id === course.id || item.slug === course.slug)) {
            return state;
        }

        return {
            courses: [course, ...state.courses],
        };
    }),

    setLearningProgressData: (progress: CourseProgressResponse[], attempts: AttemptSummaryResponse[]) => set({
        courseProgress: progress,
        attempts,
    }),

    recordLearningProgressChange: (detail: LearningProgressChangedDetail | undefined) => set((state) => {
        if (!detail?.contentId || !detail.attemptId) return state;
        if (detail.resultStatus !== 'FINAL' && detail.attemptStatus !== 'FINALIZED') return state;

        const submittedAt = detail.completedAt ?? new Date().toISOString();
        const nextAttempt: AttemptSummaryResponse = {
            attemptId: detail.attemptId,
            contentId: detail.contentId,
            status: 'FINALIZED',
            startedAt: submittedAt,
            submittedAt,
            score: detail.score ?? null,
            maxScore: detail.maxScore ?? null,
            passed: detail.passed ?? null,
        };
        const attempts = [
            ...state.attempts.filter((attempt) => attempt.attemptId !== detail.attemptId),
            nextAttempt,
        ];
        const course =
            findCourseByContentId(state.courses, detail.contentId) ??
            findCourseByContentId(state.roadmap?.courses ?? [], detail.contentId);

        if (!course) {
            return { attempts };
        }

        const attemptProgress = getCourseAttemptProgressData(course, attempts);
        const completionPercent = attemptProgress.completionPercent ?? 0;
        const lastStudiedAt = detail.completedAt ?? attemptProgress.lastStudiedAt;
        const existingProgress = state.courseProgress.find(
            (progress) => progress.courseId === course.id || progress.courseSlug === course.slug
        );
        const nextProgressItem: CourseProgressResponse = {
            courseId: course.id,
            courseName: course.name,
            courseSlug: course.slug,
            lastStudiedAt: lastStudiedAt ?? existingProgress?.lastStudiedAt ?? null,
            completionPercent,
        };
        const courseProgress = existingProgress
            ? state.courseProgress.map((progress) =>
                progress.courseId === course.id || progress.courseSlug === course.slug
                    ? { ...progress, ...nextProgressItem }
                    : progress
            )
            : [nextProgressItem, ...state.courseProgress];

        return { attempts, courseProgress };
    }),

    recordStreakSync: (days: number, previousDays?: number | null, options?: { source?: 'session' | 'learning-completion' }) => set((state) => {
        const previous = previousDays ?? state.streakDays ?? readStoredStreakDays();
        const today = todayKey();
        const lastGainAck = getScopedLocalStorageItem(LAST_GAINED_STREAK_ACK_DATE_KEY);
        const lastLearningAck = getScopedLocalStorageItem(LAST_LEARNING_STREAK_ACK_DATE_KEY);
        const isLearningCompletion = options?.source === 'learning-completion';
        
        const shouldShowGain = isLearningCompletion
            ? (lastLearningAck !== today && days > 0)
            : (previous !== null && days > previous && lastGainAck !== today);

        const fromDays = (previous !== null && days > previous)
            ? previous
            : (days > 0 ? days - 1 : 0);

        if (shouldShowGain) {
            writePendingStreakCard({ type: 'gained', from: fromDays, gained: days, date: today });
            setScopedLocalStorageItem(LAST_GAINED_STREAK_ACK_DATE_KEY, today);
            if (isLearningCompletion) {
                setScopedLocalStorageItem(LAST_LEARNING_STREAK_ACK_DATE_KEY, today);
            }
        }
        setScopedLocalStorageItem(LAST_KNOWN_STREAK_KEY, String(days));

        return {
            streakDays: days,
            ...(shouldShowGain ? { gainedStreakAmount: days, gainedFromStreak: fromDays } : {}),
        };
    }),

    updateStreak: (days: number) => set({ streakDays: days }),

    clearUserData: () => {
        userStoreVersion += 1;
        loadUserDataPromise = null;
        set({
            streakDays: null,
            courses: [],
            courseProgress: [],
            attempts: [],
            roadmap: null,
            hasLoaded: false,
            hasSeenDashboardLoading: false,
            error: null,
            lostStreakAmount: null,
            gainedStreakAmount: null,
            gainedFromStreak: null,
            streakCardsBlocked: false,
        });
    },
    setHasSeenDashboardLoading: (seen: boolean) => set({ hasSeenDashboardLoading: seen }),
    setStreakCardsBlocked: (blocked: boolean) => set({ streakCardsBlocked: blocked }),
    dismissBrokenStreak: () => {
        removeScopedLocalStorageItem(PENDING_STREAK_CARD_KEY);
        set({ lostStreakAmount: null });
    },
    dismissGainedStreak: () => {
        removeScopedLocalStorageItem(PENDING_STREAK_CARD_KEY);
        set({ gainedStreakAmount: null, gainedFromStreak: null });
    },
}));
