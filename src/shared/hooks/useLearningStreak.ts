'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pingStreak } from '@/shared/api/learning';
import { LearningApiError } from '@/shared/types/learning';
import { useToast } from '@/shared/contexts/ToastContext';

export function useLearningStreak() {
    const router = useRouter();
    const { showToast } = useToast();
    const [streakDays, setStreakDays] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            setIsLoading(true);
            try {
                const data = await pingStreak();
                if (!cancelled) setStreakDays(data.currentStreak);
            } catch (err) {
                if (cancelled) return;
                setStreakDays(null);
                
                if (err instanceof LearningApiError) {
                    // Detect if 403 is due to unverified account
                    const isUnverified = err.status === 403 && (
                        err.message.toLowerCase().includes('verify') || 
                        err.message.toLowerCase().includes('xác thực')
                    );

                    if (isUnverified) {
                        showToast('Tài khoản chưa xác thực. Vui lòng xác thực email!', 'info');
                        router.push('/verify-email');
                        return;
                    }

                    showToast(err.message || 'Cập nhật chuỗi học tập thất bại', 'error');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, []);

    return { streakDays, isLoading };
}
