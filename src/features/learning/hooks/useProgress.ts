'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress, pingStreak } from '../api';
import { UserCourse, UserDailyStreak, LearningApiError } from '../types';

import { useToast } from '@/shared/contexts/ToastContext';

export function useProgress() {
    const router = useRouter();
    const { showToast } = useToast();
    const [progress, setProgress] = useState<UserCourse[]>([]);
    const [streak, setStreak] = useState<UserDailyStreak | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProgress = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getProgress();
            setProgress(data);
        } catch (err) {
            if (err instanceof LearningApiError) {
                const msg = [400, 403].includes(err.status) ? err.message : `ERR_${err.status}`;
                setError(msg);
                showToast(err.message || 'Lấy tiến trình học thất bại', 'error');
            } else {
                setError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    const updateStreak = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await pingStreak();
            setStreak(data);
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
                showToast(err.message || 'Cập nhật chuỗi học tập thất bại', 'error');
            } else {
                setError('ERR_NETWORK');
                showToast('Không thể kết nối đến máy chủ', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [showToast, router]);

    return { 
        progress, 
        streak, 
        fetchProgress, 
        updateStreak, 
        isLoading, 
        error 
    };
}