'use client';

import React from 'react';
import styles from '../admin.module.css';

interface TopicCardProps {
    status: 'published' | 'draft';
    level: string;
    title: string;
    desc: string;
    metrics: {
        courses: number;
        lessons: number;
        exercises: number;
    };
    createdDate: string;
    rating: number;
}

export const TopicCard: React.FC<TopicCardProps> = ({ status, level, title, desc, metrics, createdDate, rating }) => {
    return (
        <div className={styles.topicCard}>
            <div className={styles.cardImageContainer}>
                {/* Visual Placeholder for the heads illustration */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 40, height: 60, borderRadius: '20px 20px 0 0', backgroundColor: '#1e3a8a', opacity: 0.8 }}></div>
                    <div style={{ width: 40, height: 60, borderRadius: '20px 20px 0 0', backgroundColor: '#3b82f6', opacity: 0.6 }}></div>
                </div>
                
                <span className={`${styles.cardBadge} ${styles.badgeLeft} ${status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
                    {status === 'published' ? 'Đã đăng tải' : 'Bản nháp'}
                </span>
                <span className={`${styles.cardBadge} ${styles.badgeRight} ${styles.badgeLevel}`}>
                    {level}
                </span>
            </div>
            
            <div className={styles.cardContent}>
                <div className={styles.cardTitle}>
                    <span style={{ color: '#22c55e' }}>⭕</span>
                    {title}
                </div>
                <p className={styles.cardDesc}>{desc}</p>
                
                <div className={styles.cardMeta}>
                    <span className={styles.metaLabel}>Khoá học chuyên đề</span>
                    <span className={styles.metaValue}>{metrics.courses}</span>
                    
                    <span className={styles.metaLabel}>Bài học</span>
                    <span className={styles.metaValue}>{metrics.lessons}</span>
                    
                    <span className={styles.metaLabel}>Bài tập</span>
                    <span className={styles.metaValue}>{metrics.exercises}</span>
                    
                    <span className={styles.metaLabel}>Ngày tạo:</span>
                    <span className={styles.metaValue}>{createdDate}</span>
                    
                    <span className={styles.metaLabel}>Lượt đánh giá:</span>
                    <span className={styles.metaValue}>
                        <span style={{ color: '#fbbf24' }}>{'★'.repeat(Math.floor(rating))}</span>
                        <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - Math.floor(rating))}</span>
                        <span style={{ marginLeft: 4 }}>{rating}</span>
                    </span>
                </div>
                
                <div className={styles.cardActions}>
                    <button className={`${styles.btnAction} ${styles.btnEdit}`}>
                        <span>✏️</span> Chỉnh sửa
                    </button>
                    <button className={`${styles.btnAction} ${styles.btnDelete}`}>
                        <span>🗑️</span> Xoá
                    </button>
                    <button className={`${styles.btnAction} ${styles.btnManage}`}>
                        Quản lý Khoá học →
                    </button>
                </div>
            </div>
        </div>
    );
};
