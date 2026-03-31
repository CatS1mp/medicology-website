'use client';

import { useState, useCallback } from 'react';
import { getCourses, getLearningPath } from '../api';
import { Theme, LearningApiError, LearningPathResponse } from '../types';

export function useCourses() {
    const [courses, setCourses] = useState<Theme[]>([]);
    const [learningPath, setLearningPath] = useState<LearningPathResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCourses();
            setCourses(data);
        } catch (err) {
            if (err instanceof LearningApiError) {
                setError(`ERR_${err.status}`);
            } else {
                setError('ERR_NETWORK');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchLearningPath = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getLearningPath();
            setLearningPath(data);
        } catch (err) {
            if (err instanceof LearningApiError) {
                setError(`ERR_${err.status}`);
            } else {
                setError('ERR_NETWORK');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { 
        courses, 
        learningPath, 
        fetchCourses, 
        fetchLearningPath, 
        isLoading, 
        error 
    };
}
