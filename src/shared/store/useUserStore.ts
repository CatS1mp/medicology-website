import { create } from 'zustand';
import { pingStreak, getEnrolledCourses, getLearningPath } from '@/shared/api/learning';
import { CourseResponse, LearningPathResponse } from '@/shared/types/learning';

export interface UserStoreState {
    streakDays: number | null;
    courses: CourseResponse[];
    roadmap: LearningPathResponse | null;
    isLoading: boolean;
    error: string | null;
    hasLoaded: boolean;
    hasSeenDashboardLoading: boolean;
    lostStreakAmount: number | null;
    gainedStreakAmount: number | null;
    gainedFromStreak: number | null;

    loadUserData: () => Promise<void>;
    updateStreak: (days: number) => void;
    clearUserData: () => void;
    setHasSeenDashboardLoading: (seen: boolean) => void;
    dismissBrokenStreak: () => void;
    dismissGainedStreak: () => void;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
    streakDays: null,
    courses: [],
    roadmap: null,
    isLoading: false,
    error: null,
    hasLoaded: false,
    hasSeenDashboardLoading: false,
    lostStreakAmount: null,
    gainedStreakAmount: null,
    gainedFromStreak: null,

    loadUserData: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
            const [streakRes, coursesRes, roadmapRes] = await Promise.all([
                pingStreak().catch(() => null),
                getEnrolledCourses().catch(() => []),
                getLearningPath().catch(() => null),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);

            let newlyLostStreak: number | null = null;
            let newlyGainedStreak: number | null = null;
            let gainedFrom: number | null = null;

            if (streakRes) {
                if (typeof window !== 'undefined') {
                    const prevStreakStr = localStorage.getItem('lastKnownStreak');
                    // if prevStreak is null, we assume it's their first time logging in this browser and we don't necessarily want to animate unless we want to.
                    // But if it's there, we can compare.
                    const prevStreak = prevStreakStr !== null ? parseInt(prevStreakStr, 10) : streakRes.currentStreak;
                    const today = new Date().toDateString();
                    
                    if (prevStreak > 0 && streakRes.currentStreak === 0) {
                        const lastAck = localStorage.getItem('lastBrokenStreakAckDate');
                        if (lastAck !== today) {
                            newlyLostStreak = prevStreak;
                            localStorage.setItem('lastBrokenStreakAckDate', today);
                        }
                    } else if (streakRes.currentStreak > prevStreak) {
                        const lastGainAck = localStorage.getItem('lastGainedStreakAckDate');
                        if (lastGainAck !== today) {
                            newlyGainedStreak = streakRes.currentStreak;
                            gainedFrom = prevStreak;
                            localStorage.setItem('lastGainedStreakAckDate', today);
                        }
                    }
                    localStorage.setItem('lastKnownStreak', streakRes.currentStreak.toString());
                }
            }

            set({
                streakDays: streakRes?.currentStreak ?? null,
                courses: coursesRes,
                roadmap: roadmapRes,
                isLoading: false,
                hasLoaded: true,
                ...(newlyLostStreak !== null ? { lostStreakAmount: newlyLostStreak } : {}),
                ...(newlyGainedStreak !== null ? { gainedStreakAmount: newlyGainedStreak, gainedFromStreak: gainedFrom } : {})
            });
        } catch (err: any) {
            set({ 
                error: err.message || 'Failed to load user data', 
                isLoading: false,
                hasLoaded: true,
            });
        }
    },

    updateStreak: (days: number) => set({ streakDays: days }),

    clearUserData: () => set({
        streakDays: null,
        courses: [],
        roadmap: null,
        hasLoaded: false,
        hasSeenDashboardLoading: false,
        error: null,
        lostStreakAmount: null,
        gainedStreakAmount: null,
        gainedFromStreak: null,
    }),
    setHasSeenDashboardLoading: (seen: boolean) => set({ hasSeenDashboardLoading: seen }),
    dismissBrokenStreak: () => set({ lostStreakAmount: null }),
    dismissGainedStreak: () => set({ gainedStreakAmount: null, gainedFromStreak: null }),
}));
