'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';
import { createAssessmentAdmin, deleteAssessmentAdmin, listAssessmentsAdmin } from '@/shared/api/admin-assessment';
import { adminListCourses } from '@/shared/api/admin-learning';
import type { AssessmentDiscoveryResponse } from '@/shared/types/assessment';
import type { CourseResponse } from '@/shared/types/learning';

function formatDuration(min: number | null | undefined): string {
    if (min == null || Number.isNaN(min)) return '—';
    return `${min} phút`;
}

export const AdminTestsScreen: React.FC = () => {
    const [assessments, setAssessments] = useState<AssessmentDiscoveryResponse[]>([]);
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const courseNameById = useMemo(() => {
        const m = new Map<string, string>();
        for (const c of courses) {
            m.set(c.id, c.name);
        }
        return m;
    }, [courses]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [a, c] = await Promise.all([listAssessmentsAdmin(), adminListCourses()]);
            setAssessments(a);
            setCourses(c);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được danh sách bài kiểm tra.');
            setAssessments([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreate = async () => {
        const title = window.prompt('Tên bài kiểm tra');
        if (!title?.trim()) return;
        const passRaw = window.prompt('Điểm đạt (0–100)', '70');
        const passScore = passRaw ? Number(passRaw) : 70;
        if (Number.isNaN(passScore)) {
            window.alert('Điểm đạt không hợp lệ.');
            return;
        }
        const courseId = window.prompt('Course ID (UUID)');
        if (!courseId?.trim()) return;
        const sectionId = window.prompt('Section ID (UUID)');
        if (!sectionId?.trim()) return;
        const timeRaw = window.prompt('Thời lượng (phút, để trống nếu không giới hạn)', '15');
        const timeLimitMinutes = timeRaw?.trim() ? Number(timeRaw) : null;
        try {
            await createAssessmentAdmin({
                title: title.trim(),
                courseId: courseId.trim(),
                sectionId: sectionId.trim(),
                passScore,
                timeLimitMinutes: timeLimitMinutes !== null && !Number.isNaN(timeLimitMinutes) ? timeLimitMinutes : null,
            });
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Tạo bài kiểm tra thất bại.');
        }
    };

    const handleDelete = async (a: AssessmentDiscoveryResponse) => {
        if (!window.confirm(`Xóa bài kiểm tra "${a.title}"?`)) return;
        setBusyId(a.id);
        try {
            await deleteAssessmentAdmin(a.id);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Xóa thất bại.');
        } finally {
            setBusyId(null);
        }
    };

    const miniStats = [
        {
            label: 'Tổng số bài kiểm tra',
            value: loading ? '…' : String(assessments.length),
            change: 'Theo dữ liệu API',
            icon: '📄',
            type: 'green' as const,
        },
        {
            label: 'Khóa học (đã tải)',
            value: loading ? '…' : String(courses.length),
            change: 'Danh mục learning',
            icon: '👤',
            type: 'blue' as const,
        },
        {
            label: 'Tổng số lượt làm bài',
            value: '—',
            change: 'Cần endpoint thống kê',
            icon: '📋',
            type: 'orange' as const,
        },
        {
            label: 'Tỷ lệ vượt qua trung bình',
            value: '—',
            change: 'Cần endpoint thống kê',
            icon: '📈',
            type: 'purple' as const,
        },
    ];

    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Quản lý Bài kiểm tra & Đánh giá</h1>
                    <p>
                        Thiết lập ngân hàng câu hỏi Quiz và quản lý các tiêu chuẩn đánh giá năng lực học viên trên toàn hệ thống
                    </p>
                </div>
            </section>

            {error && (
                <section className={styles.filterSection} style={{ borderColor: '#fecaca', background: '#fef2f2', padding: 16 }}>
                    <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                    <button type="button" className={styles.btnPrimary} style={{ marginTop: 12 }} onClick={() => void load()}>
                        Thử lại
                    </button>
                </section>
            )}

            <section className={styles.filterSection}>
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Sắp xếp theo:</span>
                    <select className={styles.chartYearSelect} style={{ width: 160 }} disabled>
                        <option>Mới cập nhật</option>
                    </select>
                </div>

                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Cấp độ</span>
                    <div className={styles.chipGroup}>
                        <button type="button" className={`${styles.chip} ${styles.chipActive}`}>
                            Mọi cấp độ
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            Cơ bản
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            Trung cấp
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            Nâng cao
                        </button>
                    </div>
                </div>
            </section>

            <div className={styles.tabGroup}>
                <div className={`${styles.tabBtn} ${styles.tabBtnActive}`}>Bài kiểm tra khoá học</div>
                <div className={`${styles.tabBtn} ${styles.tabBtnInactive}`}>Bài kiểm tra đầu vào</div>
            </div>

            <div className={styles.statsGrid} style={{ marginBottom: 24 }}>
                {miniStats.map((stat, i) => (
                    <div key={i} className={styles.statCard} style={{ padding: 16 }}>
                        <div className={styles.statHeader} style={{ marginBottom: 8 }}>
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
                                style={{ width: 28, height: 28, fontSize: 14 }}
                            >
                                {stat.icon}
                            </div>
                        </div>
                        <div className={styles.statValue} style={{ fontSize: 20 }}>
                            {stat.value}
                        </div>
                        <div className={`${styles.statChange} ${styles.changeBlue}`} style={{ fontSize: 10 }}>
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.chartContainer} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 24 }}>
                    <h3 className={styles.chartTitle}>Danh sách Bài kiểm tra khoá học</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                        Quản lý các bài đánh giá năng lực cuối mỗi khoá học chuyên đề
                    </p>

                    <div className={styles.actionsBar}>
                        <div className={styles.searchContainer} style={{ maxWidth: 400 }}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} disabled />
                        </div>
                        <div className={styles.actionsGroup}>
                            <button type="button" className={styles.btnSecondary} disabled>
                                📥 Nhập Excel
                            </button>
                            <button type="button" className={styles.btnSecondary} disabled>
                                📤 Xuất Excel
                            </button>
                            <button type="button" className={styles.btnPrimary} style={{ borderRadius: 8 }} onClick={() => void handleCreate()}>
                                + Thêm mới
                            </button>
                        </div>
                    </div>
                </div>

                {loading && <p style={{ padding: '0 24px 16px', color: '#94a3b8' }}>Đang tải…</p>}
                {!loading && !error && assessments.length === 0 && (
                    <p style={{ padding: '0 24px 16px', color: '#94a3b8' }}>Chưa có bài kiểm tra.</p>
                )}

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th style={{ width: 40 }}>
                                    <input type="checkbox" disabled />
                                </th>
                                <th>STT</th>
                                <th>Tên bài kiểm tra</th>
                                <th>Khoá học chuyên đề</th>
                                <th style={{ textAlign: 'center' }}>Điểm đạt (%)</th>
                                <th style={{ textAlign: 'center' }}>Thời lượng</th>
                                <th style={{ textAlign: 'center' }}>Số lần thử</th>
                                <th>Trạng thái</th>
                                <th>HD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.map((test, i) => (
                                <tr key={test.id} className={styles.tableRow}>
                                    <td className={styles.tableCell}>
                                        <input type="checkbox" disabled />
                                    </td>
                                    <td className={styles.tableCell}>{i + 1}</td>
                                    <td className={styles.tableCell} style={{ fontWeight: 600 }}>
                                        <Link href={`/admin/tests/edit?assessmentId=${encodeURIComponent(test.id)}`} style={{ color: 'inherit' }}>
                                            {test.title}
                                        </Link>
                                    </td>
                                    <td className={styles.tableCell}>{courseNameById.get(test.courseId) ?? test.courseId}</td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        {test.passScore}%
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        {formatDuration(test.timeLimitMinutes)}
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        —
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        <span
                                            className={`${styles.statusPill} ${
                                                test.active ? styles.statusActive : styles.statusHidden
                                            }`}
                                        >
                                            {test.active ? 'Hoạt động' : 'Tạm ẩn'}
                                        </span>
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            className={styles.iconBtn}
                                            aria-label="Xóa"
                                            disabled={busyId === test.id}
                                            onClick={() => void handleDelete(test)}
                                        >
                                            🗑
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.pagination} style={{ padding: '24px 0' }}>
                <div className={styles.pageInfo}>
                    Hiển thị <b>1-{assessments.length || 0}</b> trong tổng số <b>{assessments.length}</b> bài kiểm tra
                </div>
                <div className={styles.pageControls}>
                    <span className={styles.pageBtnInert}>Trước</span>
                    <span className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</span>
                    <span className={styles.pageBtnInert}>Sau</span>
                </div>
            </div>
        </BaseAdminLayout>
    );
};
