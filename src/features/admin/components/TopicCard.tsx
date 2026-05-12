'use client';

import React from 'react';
import styles from '../admin.module.css';
import { LazyImage } from '@/shared/components/LazyImage';
import { DEFAULT_COURSE_ICON } from '@/shared/utils/course-icon';

interface TopicCardProps {
    id: string;
    status: 'published' | 'draft';
    level: string;
    title: string;
    desc: string;
    coverUrl: string;
    metrics: {
        courses: number;
        lessons: number;
        exercises: number;
    };
    createdDate: string;
    rating: number;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onManage: (id: string) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({
    id,
    status,
    level,
    title,
    desc,
    coverUrl,
    metrics,
    createdDate,
    rating,
    onEdit,
    onDelete,
    onManage,
}) => {
    return (
        <div className={styles.topicCard}>
            <div className={styles.cardImageContainer}>
                <LazyImage src={coverUrl} alt={title} className={styles.topicCardCoverImg} draggable={false} fallbackSrc={DEFAULT_COURSE_ICON} />

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
                    <button type="button" className={`${styles.btnAction} ${styles.btnEdit}`} onClick={() => onEdit(id)}>
                        <span>✏️</span> Chỉnh sửa
                    </button>
                    <button type="button" className={`${styles.btnAction} ${styles.btnDelete}`} onClick={() => onDelete(id)}>
                        <span>🗑️</span> Xoá
                    </button>
                    <button type="button" className={`${styles.btnAction} ${styles.btnManage}`} onClick={() => onManage(id)}>
                        Quản lý Khoá học →
                    </button>
                </div>
            </div>
        </div>
    );
};
