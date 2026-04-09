'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCourses, getLearningPath } from '../api';
import { Theme, LearningApiError, LearningPathResponse } from '../types';

import { useToast } from '@/shared/contexts/ToastContext';

export function useCourses() {
    const router = useRouter();
    const { showToast } = useToast();
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
                const isUnverified = err.status === 403 && (
                    err.message.toLowerCase().includes('verify') || 
                    err.message.toLowerCase().includes('xác thực')
                );

                if (isUnverified) {
                    showToast('Tài khoản chưa xác thực. Vui lòng xác thực email!', 'info');
                    router.push('/verify-email');
                    return;
                }

                const msg = [400, 403].includes(err.status) ? err.message : `ERR_${err.status}`;
                setError(msg);
                showToast(err.message || 'Lấy danh sách khóa học thất bại', 'error');
            } else {
                setError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [showToast, router]);

    const fetchLearningPath = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getLearningPath();
            setLearningPath(data);
        } catch (err) {
            if (err instanceof LearningApiError) {
                const isUnverified = err.status === 403 && (
                    err.message.toLowerCase().includes('verify') || 
                    err.message.toLowerCase().includes('xác thực')
                );

                if (isUnverified) {
                    showToast('Tài khoản chưa xác thực. Vui lòng xác thực email!', 'info');
                    router.push('/verify-email');
                    return;
                }

                const msg = [400, 403].includes(err.status) ? err.message : `ERR_${err.status}`;
                setError(msg);
                showToast(err.message || 'Lấy lộ trình học thất bại', 'error');
            } else {
                setError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [showToast, router]);

    return { 
        courses, 
        learningPath, 
        fetchCourses, 
        fetchLearningPath, 
        isLoading, 
        error 
    };
}