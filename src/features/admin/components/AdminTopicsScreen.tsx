'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { TopicCard } from './TopicCard';
import { adminListCourses } from '@/shared/api/admin-learning';
import type { CourseResponse } from '@/shared/types/learning';

import { BaseAdminLayout } from './BaseAdminLayout';

type TopicCardVm = {
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
};

function mapCourseToTopicCard(course: CourseResponse): TopicCardVm {
    const lessonCountFromSections = Array.isArray(course.sections)
        ? course.sections.reduce((sum, section) => sum + (section.lessons?.length ?? 0), 0)
        : 0;
    const lessonCount = course.lessonCount ?? lessonCountFromSections;

    return {
        status: 'published',
        level: 'Cơ bản',
        title: course.name,
        desc: course.description?.trim() || 'Chưa có mô tả.',
        metrics: {
            courses: 1,
            lessons: lessonCount,
            exercises: 0,
        },
        createdDate: course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : '—',
        rating: 0,
    };
}

export const AdminTopicsScreen: React.FC = () => {
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await adminListCourses();
            setCourses(list);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được danh sách khóa học.');
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCourses();
    }, [loadCourses]);

    const topicData = useMemo(() => courses.map(mapCourseToTopicCard), [courses]);

    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Quản lý Chủ đề học tập</h1>
                    <p>Hành trình hiểu về cơ thể và tâm trí qua các chủ đề học tập thiết thực</p>
                </div>
            </section>
            
            <section className={styles.filterSection}>
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Sắp xếp theo:</span>
                    <select className={styles.chartYearSelect} style={{ width: 160 }}>
                        <option>Mới cập nhật</option>
                        <option>Tên A-Z</option>
                    </select>
                </div>
                
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Trình độ</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Mọi trình độ</button>
                        <button className={styles.chip}>Cơ bản</button>
                        <button className={styles.chip}>Trung cấp</button>
                        <button className={styles.chip}>Nâng cao</button>
                    </div>
                </div>
                
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Chủ đề học tập</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Tất cả</button>
                        <button className={styles.chip}>Sơ cứu & Cấp cứu</button>
                        <button className={styles.chip}>Dinh dưỡng & Chế độ ăn</button>
                        <button className={styles.chip}>Sức khỏe Tinh thần</button>
                        <button className={styles.chip}>Sức khỏe Tim mạch</button>
                        <button className={styles.chip}>Y học Thường thức</button>
                    </div>
                </div>
                
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Trạng thái hiển thị</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Tất cả</button>
                        <button className={styles.chip}>Đã đăng tải</button>
                        <button className={styles.chip}>Bản nháp</button>
                    </div>
                </div>
            </section>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className={styles.btnPrimary} style={{ borderRadius: 12 }}>
                    <span style={{ fontSize: 18 }}>+</span> Thêm chủ đề
                </button>
            </div>

            {error && (
                <section className={styles.filterSection} style={{ borderColor: '#fecaca', background: '#fef2f2', marginTop: 12 }}>
                    <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                    <button
                        type="button"
                        className={styles.btnPrimary}
                        style={{ marginTop: 12, borderRadius: 10 }}
                        onClick={() => void loadCourses()}
                    >
                        Thử lại
                    </button>
                </section>
            )}
            {loading && <p style={{ color: '#64748b', margin: '12px 0 0' }}>Đang tải danh sách môn học…</p>}
            {!loading && !error && topicData.length === 0 && <p style={{ color: '#64748b', margin: '12px 0 0' }}>Chưa có môn học.</p>}

            <div className={styles.topicsGrid}>
                {topicData.map((topic, i) => (
                    <TopicCard key={i} {...topic} />
                ))}
            </div>
            
            <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                    Hiển thị <b>{topicData.length ? `1-${topicData.length}` : '0-0'}</b> trong tổng số <b>{topicData.length}</b> chủ đề
                </div>
                <div className={styles.pageControls}>
                    <span className={styles.pageBtnInert}>Trước</span>
                    <span className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</span>
                    <span className={styles.pageBtn}>2</span>
                    <span className={styles.pageBtn}>3</span>
                    <span className={styles.pageBtnInert}>...</span>
                    <span className={styles.pageBtn}>140</span>
                    <span className={styles.pageBtnInert} style={{ color: '#3b82f6' }}>Sau</span>
                </div>
            </div>
        </BaseAdminLayout>
    );
};
