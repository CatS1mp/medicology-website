'use client';

import React, { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { AdminGrowthChart } from './AdminGrowthChart';
import { BaseAdminLayout } from './BaseAdminLayout';
import { fetchAdminUsers } from '@/shared/api/admin-users';
import { listAssessmentsAdmin } from '@/shared/api/admin-assessment';
import { adminListCourses } from '@/shared/api/admin-learning';
import { adminListArticles } from '@/shared/api/admin-dictionary';
import { getLessonActivity } from '@/shared/api/learning';

export const AdminDashboardScreen: React.FC = () => {
    const [userTotal, setUserTotal] = useState<number | null>(null);
    const [courseCount, setCourseCount] = useState<number | null>(null);
    const [assessmentCount, setAssessmentCount] = useState<number | null>(null);
    const [lessonDone, setLessonDone] = useState<number | null>(null);
    const [dictCount, setDictCount] = useState<number | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const results = await Promise.allSettled([
                fetchAdminUsers({ page: 0, size: 1 }),
                adminListCourses(),
                listAssessmentsAdmin(),
                getLessonActivity(7),
                adminListArticles(),
            ]);
            if (cancelled) return;
            const errs: string[] = [];
            if (results[0].status === 'fulfilled') setUserTotal(results[0].value.total);
            else errs.push('Người dùng');
            if (results[1].status === 'fulfilled') setCourseCount(results[1].value.length);
            else errs.push('Khóa học');
            if (results[2].status === 'fulfilled') setAssessmentCount(results[2].value.length);
            else errs.push('Bài kiểm tra');
            if (results[3].status === 'fulfilled') setLessonDone(results[3].value.totalCompletedLessons);
            else errs.push('Hoạt động học');
            if (results[4].status === 'fulfilled') setDictCount(results[4].value.length);
            else errs.push('Từ điển');
            setErrors(errs);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString('vi-VN'));

    const stats = [
        {
            label: 'Tổng số người dùng (admin)',
            value: fmt(userTotal),
            change: errors.includes('Người dùng') ? 'Không tải được' : 'Theo API admin',
            type: 'blue' as const,
        },
        {
            label: 'Khóa học',
            value: fmt(courseCount),
            change: errors.includes('Khóa học') ? 'Không tải được' : 'Learning service',
            type: 'green' as const,
        },
        {
            label: 'Bài kiểm tra',
            value: fmt(assessmentCount),
            change: errors.includes('Bài kiểm tra') ? 'Không tải được' : 'Assessment service',
            type: 'orange' as const,
        },
        {
            label: 'Bài học hoàn thành (7 ngày)',
            value: fmt(lessonDone),
            change: errors.includes('Hoạt động học') ? 'Không tải được' : 'Learning progress',
            type: 'purple' as const,
        },
    ];

    const statusStats = [
        {
            label: 'Bài viết từ điển',
            value: fmt(dictCount),
            subtitle: errors.includes('Từ điển') ? 'Không tải được dictionary' : 'Số bài trong hệ thống',
        },
        {
            label: 'Trạng thái tổng hợp',
            value: errors.length ? 'Một phần lỗi' : 'OK',
            subtitle: errors.length ? `Lỗi: ${errors.join(', ')}` : 'Tất cả nguồn phản hồi',
        },
        {
            label: 'Sức khỏe hệ thống',
            value: '—',
            subtitle: 'Cần endpoint health nếu có',
        },
    ];

    const StatGlyph: React.FC<{ type: 'blue' | 'green' | 'orange' | 'purple' }> = ({ type }) => {
        if (type === 'blue') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M4.5 17C4.5 14.79 6.29 13 8.5 13H9.5C11.71 13 13.5 14.79 13.5 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M16 8.5H20M18 6.5V10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        }
        if (type === 'green') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4" y="5" width="7" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="13" y="5" width="7" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                </svg>
            );
        }
        if (type === 'orange') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5.5L16 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <rect x="5" y="5.5" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 10H15M9 13.5H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 14L10 10L13 13L18 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 8H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        );
    };

    return (
        <BaseAdminLayout>
            <section className={styles.banner}>
                <h1 className={styles.bannerTitle}>Chào mừng bạn quay trở lại, Admin!</h1>
                <p className={styles.bannerSubtitle}>Dưới đây là diễn biến trên nền tảng giáo dục y khoa của bạn hôm nay.</p>
            </section>

            <section className={styles.statsGrid}>
                {stats.map((stat, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <span className={styles.statLabel}>{stat.label}</span>
                            <div
                                className={`${styles.statIcon} ${
                                    stat.type === 'blue'
                                        ? styles.iconBlue
                                        : stat.type === 'green'
                                          ? styles.iconGreen
                                          : stat.type === 'orange'
                                            ? styles.iconOrange
                                            : styles.iconPurple
                                }`}
                            >
                                <StatGlyph type={stat.type} />
                            </div>
                        </div>
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={`${styles.statChange} ${styles.changePositive}`}>{stat.change}</div>
                    </div>
                ))}
            </section>

            <AdminGrowthChart />

            <section className={styles.bottomGrid}>
                {statusStats.map((stat, i) => (
                    <div key={i} className={styles.statusCard}>
                        <h4 className={styles.statusLabel}>{stat.label}</h4>
                        <div className={styles.statusValue}>{stat.value}</div>
                        <p className={styles.statusSubtitle}>{stat.subtitle}</p>
                    </div>
                ))}
            </section>
        </BaseAdminLayout>
    );
};
