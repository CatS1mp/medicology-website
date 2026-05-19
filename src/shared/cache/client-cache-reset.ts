'use client';

import { clearAllCachedValues } from '@/shared/api/client-cache';
import { clearEnrolledCoursesCache } from '@/features/courses/hooks/useEnrolledCourses';
import { clearRoadmapCache } from '@/features/courses/hooks/useRoadmap';
import { clearTopicsCache } from '@/features/topics/hooks/useTopics';
import { clearReadingRecoSessionCache } from '@/features/encyclopedia/readingRecoSessionCache';
import { clearLearningStreakCache } from '@/shared/hooks/useLearningStreak';
import { useUserStore } from '@/shared/store/useUserStore';

export function clearAllClientCaches() {
    clearAllCachedValues();
    clearEnrolledCoursesCache();
    clearRoadmapCache();
    clearTopicsCache();
    clearReadingRecoSessionCache();
    clearLearningStreakCache();
    useUserStore.getState().clearUserData();
}
