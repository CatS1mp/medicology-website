'use client';

import React from 'react';
import styles from '../admin.module.css';
import { AdminGrowthChart } from './AdminGrowthChart';
import { BaseAdminLayout } from './BaseAdminLayout';

const stats = [
    { label: 'Tổng số người dùng', value: '2,543', change: '+12% so với tháng trước', type: 'blue' as const },
    { label: 'Khóa học đang hoạt động', value: '24', change: '+2 so với tháng trước', type: 'green' as const },
    { label: 'Tổng số bài tập', value: '1,248', change: '+45 so với tháng trước', type: 'orange' as const },
    { label: 'Tỷ lệ hoàn thành trung bình', value: '73%', change: '+5% so với tháng trước', type: 'purple' as const },
];

const statusStats = [
    { label: 'Hoạt động hôm nay', value: '245', subtitle: 'Người dùng mới đăng ký' },
    { label: 'Chờ duyệt', value: '12', subtitle: 'Bài học mới đang chờ duyệt' },
    { label: 'Sức khỏe hệ thống', value: '99.9%', subtitle: 'Thời gian hoạt động trong tháng này' },
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

export const AdminDashboardScreen: React.FC = () => {
    return (
        <BaseAdminLayout>
            <section className={styles.banner}>
                <h1 className={styles.bannerTitle}>Chào mừng bạn quay trở lại, Admin!</h1>
                <p className={styles.bannerSubtitle}>
                    Dưới đây là diễn biến trên nền tảng giao dục y khoa của bạn hôm nay.
                </p>
            </section>
            
            <section className={styles.statsGrid}>
                {stats.map((stat, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <span className={styles.statLabel}>{stat.label}</span>
                            <div className={`${styles.statIcon} ${
                                stat.type === 'blue' ? styles.iconBlue : 
                                stat.type === 'green' ? styles.iconGreen : 
                                stat.type === 'orange' ? styles.iconOrange : 
                                styles.iconPurple
                            }`}>
                                <StatGlyph type={stat.type} />
                            </div>
                        </div>
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={`${styles.statChange} ${styles.changePositive}`}>
                            {stat.change}
                        </div>
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
