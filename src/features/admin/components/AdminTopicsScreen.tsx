'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { TopicCard } from './TopicCard';
import { AdminAddCourseModal } from './AdminAddCourseModal';
import { adminDeleteCourse, adminListCoursesPaged } from '@/shared/api/admin-learning';
import type { CourseResponse } from '@/shared/types/learning';
import { resolveCourseIconSrc } from '@/shared/utils/course-icon';

import { BaseAdminLayout } from './BaseAdminLayout';
import { AdminTopicCardSkeleton } from './AdminTopicCardSkeleton';

type TopicCardVm = {
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
};

function mapCourseToTopicCard(course: CourseResponse): TopicCardVm {
    const lessonCountFromSections = Array.isArray(course.sections)
        ? course.sections.reduce((sum, section) => sum + (section.contents?.length ?? 0), 0)
        : 0;
    const lessonCount = course.contentCount ?? lessonCountFromSections;

    return {
        id: course.id,
        status: 'published',
        level: 'Cơ bản',
        title: course.name,
        desc: course.description?.trim() || 'Chưa có mô tả.',
        coverUrl: resolveCourseIconSrc(course.iconFileName),
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
    const router = useRouter();
    const [addCourseOpen, setAddCourseOpen] = useState(false);
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 12;

    const loadCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { items, total: totalItems } = await adminListCoursesPaged({ page: page - 1, size: PAGE_SIZE });
            setCourses(items);
            setTotal(totalItems);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được danh sách khóa học.');
            setCourses([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        void loadCourses();
    }, [loadCourses]);

    const topicData = useMemo(() => courses.map(mapCourseToTopicCard), [courses]);

    const handleOpenCurriculum = (courseId: string) => {
        router.push(`/admin/courses/${courseId}/curriculum`);
    };

    const handleDeleteCourse = async (courseId: string) => {
        const course = courses.find((item) => item.id === courseId);
        if (!course) return;
        if (!window.confirm(`Xóa khóa học "${course.name}"?`)) return;
        try {
            await adminDeleteCourse(courseId);
            await loadCourses();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Xóa khóa học thất bại.');
        }
    };

    return (
        <BaseAdminLayout>
            {addCourseOpen && (
                <AdminAddCourseModal
                    onClose={() => setAddCourseOpen(false)}
                    onCreated={() => void loadCourses()}
                />
            )}
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Quản lý Khóa học</h1>
                    <p>Quản lý danh sách khóa học và thông tin hiển thị trên hệ thống</p>
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
                    <span className={styles.filterLabel}>Khóa học</span>
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
                <button
                    type="button"
                    className={styles.btnPrimary}
                    style={{ borderRadius: 12 }}
                    onClick={() => setAddCourseOpen(true)}
                >
                    <span style={{ fontSize: 18 }}>+</span> Thêm khóa học
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
            {loading && (
                <div className={styles.topicsGrid}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <AdminTopicCardSkeleton key={`admin-topic-skel-${i}`} />
                    ))}
                </div>
            )}
            {!loading && !error && topicData.length === 0 && <p style={{ color: '#64748b', margin: '12px 0 0' }}>Chưa có môn học.</p>}

            <div className={styles.topicsGrid}>
                {topicData.map((topic, i) => (
                    <TopicCard
                        key={`${topic.id}-${i}`}
                        {...topic}
                        onEdit={handleOpenCurriculum}
                        onDelete={(id) => void handleDeleteCourse(id)}
                        onManage={handleOpenCurriculum}
                    />
                ))}
            </div>
            
            <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                    Hiển thị <b>{topicData.length ? `${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + topicData.length}` : '0-0'}</b> trong tổng số <b>{total}</b> khóa học
                </div>
                <div className={styles.pageControls}>
                    <button type="button" className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
                    <span className={`${styles.pageBtn} ${styles.pageBtnActive}`}>{page}</span>
                    <button type="button" className={styles.pageBtn} disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / PAGE_SIZE)), p + 1))}>Sau</button>
                </div>
            </div>
        </BaseAdminLayout>
    );
};
