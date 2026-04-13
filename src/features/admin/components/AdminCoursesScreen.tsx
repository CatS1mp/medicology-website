'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';
import { adminCreateCourse, adminDeleteCourse, adminListCourses, adminUpdateCourse } from '@/shared/api/admin-learning';
import type { CourseResponse } from '@/shared/types/learning';

type CourseLevel = 'General' | 'Teen' | 'Adult';

type CourseRow = {
    id: string;
    code: string;
    name: string;
    topic: string;
    target: string;
    updated: string;
    order: number;
    level: CourseLevel;
};

function mapCourse(c: CourseResponse): CourseRow {
    const updated = c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('vi-VN') : '—';
    return {
        id: c.id,
        code: c.slug?.slice(0, 8).toUpperCase() ?? c.id.slice(0, 8),
        name: c.name,
        topic: c.description?.slice(0, 40) ?? '—',
        target: 'Tất cả',
        updated,
        order: c.orderIndex,
        level: 'General',
    };
}

function levelClass(level: CourseLevel): string {
    if (level === 'General') return styles.courseLevelGeneral;
    if (level === 'Teen') return styles.courseLevelTeen;
    return styles.courseLevelAdult;
}

export const AdminCoursesScreen: React.FC = () => {
    const [openActionFor, setOpenActionFor] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    const [rows, setRows] = useState<CourseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const rowsWithKeys = useMemo(
        () => rows.map((course, index) => ({ course, rowKey: `${course.id}-${index}` })),
        [rows]
    );

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await adminListCourses();
            setRows(list.map(mapCourse));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được danh sách khóa học.');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!actionMenuRef.current) return;
            if (!actionMenuRef.current.contains(event.target as Node)) {
                setOpenActionFor(null);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleCourseAction = async (action: 'view' | 'edit' | 'delete', course: CourseRow) => {
        if (action === 'view') {
            window.alert(`Khóa học: ${course.name}\nID: ${course.id}`);
            setOpenActionFor(null);
            return;
        }
        if (action === 'edit') {
            const name = window.prompt('Tên khóa học', course.name);
            if (!name?.trim()) {
                setOpenActionFor(null);
                return;
            }
            try {
                await adminUpdateCourse(course.id, { name: name.trim() });
                await load();
            } catch (e) {
                window.alert(e instanceof Error ? e.message : 'Cập nhật thất bại.');
            }
            setOpenActionFor(null);
            return;
        }
        if (action === 'delete') {
            if (!window.confirm(`Xóa khóa học "${course.name}"?`)) {
                setOpenActionFor(null);
                return;
            }
            try {
                await adminDeleteCourse(course.id);
                await load();
            } catch (e) {
                window.alert(e instanceof Error ? e.message : 'Xóa thất bại.');
            }
            setOpenActionFor(null);
        }
    };

    const handleAddCourse = async () => {
        const name = window.prompt('Tên khóa học');
        if (!name?.trim()) return;
        const slug = window.prompt('Slug (URL)', name.trim().toLowerCase().replace(/\s+/g, '-')) ?? '';
        if (!slug.trim()) return;
        try {
            await adminCreateCourse({ name: name.trim(), slug: slug.trim(), description: null });
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Tạo khóa học thất bại.');
        }
    };

    return (
        <BaseAdminLayout>
            <section className={styles.courseHeader}>
                <div>
                    <h1>Quản lý Khoá học</h1>
                    <p>Hành trình hiểu về cơ thể và tâm trí qua các chủ đề học tập thiết thực</p>
                </div>
            </section>

            {error && (
                <section className={styles.courseFilterCard} style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                    <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                    <button type="button" className={styles.coursePrimaryBtn} style={{ marginTop: 12 }} onClick={() => void load()}>
                        Thử lại
                    </button>
                </section>
            )}

            <section className={styles.courseFilterCard}>
                <div className={styles.courseSortRow}>
                    <span>Sắp xếp theo:</span>
                    <select className={styles.courseSelect} disabled>
                        <option>Mới cập nhật</option>
                    </select>
                </div>

                <div className={styles.courseFilterGroup}>
                    <h3>Đối tượng người dùng</h3>
                    <div className={styles.courseChipRow}>
                        <button type="button" className={`${styles.courseChip} ${styles.courseChipActive}`}>
                            Mọi đối tượng
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Trẻ em
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Vị thành niên
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Người lớn
                        </button>
                    </div>
                </div>

                <div className={styles.courseFilterGroup}>
                    <h3>Chủ đề Học tập</h3>
                    <div className={styles.courseChipRow}>
                        <button type="button" className={`${styles.courseChip} ${styles.courseChipActive}`}>
                            Tất cả
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Sơ cứu & Cấp cứu
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Dinh dưỡng & Chế độ ăn
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Sức khỏe Tinh thần
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Sức khỏe Tim mạch
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Y học Thường thức
                        </button>
                    </div>
                </div>

                <div className={styles.courseFilterGroup}>
                    <h3>Trạng thái hiển thị</h3>
                    <div className={styles.courseChipRow}>
                        <button type="button" className={`${styles.courseChip} ${styles.courseChipActive}`}>
                            Tất cả
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Đã đăng tải
                        </button>
                        <button type="button" className={styles.courseChip} disabled>
                            Bản nháp
                        </button>
                    </div>
                </div>
            </section>

            <section className={styles.courseTableCard}>
                <div className={styles.courseTableIntro}>
                    <h2>Danh sách Khoá học</h2>
                    <p>Quản lý thông tin khoá học chuyên đề trong các chủ đề học tập</p>
                </div>

                <div className={styles.courseToolbar}>
                    <div className={styles.courseSearchWrap}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" stroke="#C0C4CC" strokeWidth="1.8" />
                            <path d="M20 20L16.5 16.5" stroke="#C0C4CC" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <input type="text" placeholder="Tìm kiếm" disabled />
                    </div>

                    <div className={styles.courseToolbarActions}>
                        <button type="button" className={styles.courseGhostBtn} disabled>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 15V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 9.5L12 6L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Nhập Excel
                        </button>
                        <button type="button" className={styles.courseGhostBtn} disabled>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 6V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 11.5L12 15L15.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Xuất Excel
                        </button>
                        <button type="button" className={styles.coursePrimaryBtn} onClick={() => void handleAddCourse()}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Thêm khoá học
                        </button>
                    </div>
                </div>

                {loading && <p style={{ padding: '0 24px 16px', color: '#64748b' }}>Đang tải…</p>}
                {!loading && !error && rows.length === 0 && (
                    <p style={{ padding: '0 24px 16px', color: '#64748b' }}>Chưa có khóa học.</p>
                )}

                <div className={styles.courseTableWrap}>
                    <table className={styles.courseTable}>
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" aria-label="Chọn tất cả" disabled />
                                </th>
                                <th>
                                    <span className={styles.courseHeadCell}>Mã</span>
                                </th>
                                <th>
                                    <span className={styles.courseHeadCell}>Tên khoá học chuyên đề</span>
                                </th>
                                <th>
                                    <span className={styles.courseHeadCell}>Chủ đề</span>
                                </th>
                                <th>
                                    <span className={styles.courseHeadCell}>Đối tượng</span>
                                </th>
                                <th>
                                    <span className={styles.courseHeadCell}>Ngày cập nhật</span>
                                </th>
                                <th>
                                    <span className={styles.courseHeadCell}>Thứ tự</span>
                                </th>
                                <th>
                                    <span className={styles.courseHeadCell}>Xếp hạng ND</span>
                                </th>
                                <th>
                                    <span className={styles.courseHeadCell}>HD</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowsWithKeys.map(({ course, rowKey }) => (
                                <tr key={rowKey}>
                                    <td>
                                        <input type="checkbox" aria-label={`Chọn ${rowKey}`} disabled />
                                    </td>
                                    <td>{course.code}</td>
                                    <td className={styles.courseNameCell}>{course.name}</td>
                                    <td>{course.topic}</td>
                                    <td>{course.target}</td>
                                    <td>{course.updated}</td>
                                    <td>{course.order}</td>
                                    <td>
                                        <span className={`${styles.courseLevelPill} ${levelClass(course.level)}`}>{course.level}</span>
                                    </td>
                                    <td className={styles.courseActionCell}>
                                        <div ref={openActionFor === rowKey ? actionMenuRef : null}>
                                            <button
                                                type="button"
                                                className={styles.courseMoreBtn}
                                                onClick={() => setOpenActionFor((prev) => (prev === rowKey ? null : rowKey))}
                                                aria-label={`Thao tác ${course.code}`}
                                                aria-expanded={openActionFor === rowKey}
                                                aria-haspopup="menu"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <circle cx="12" cy="5" r="1.7" fill="currentColor" />
                                                    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                                                    <circle cx="12" cy="19" r="1.7" fill="currentColor" />
                                                </svg>
                                            </button>

                                            {openActionFor === rowKey && (
                                                <div className={styles.courseActionMenu} role="menu">
                                                    <button type="button" onClick={() => void handleCourseAction('view', course)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path
                                                                d="M2.5 12C4.5 7.5 8 5.25 12 5.25C16 5.25 19.5 7.5 21.5 12C19.5 16.5 16 18.75 12 18.75C8 18.75 4.5 16.5 2.5 12Z"
                                                                stroke="currentColor"
                                                                strokeWidth="1.8"
                                                            />
                                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                                                        </svg>
                                                        Xem chi tiết
                                                    </button>
                                                    <button type="button" onClick={() => void handleCourseAction('edit', course)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M4 20H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            <path
                                                                d="M6.75 15.75L15.75 6.75L18.25 9.25L9.25 18.25L6 19L6.75 15.75Z"
                                                                stroke="currentColor"
                                                                strokeWidth="1.8"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                        Chỉnh sửa
                                                    </button>
                                                    <button type="button" onClick={() => void handleCourseAction('delete', course)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M4.5 7.5H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            <path d="M9.5 4.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            <path d="M8 7.5V19.25H16V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                        </svg>
                                                        Xóa khoá học
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.coursePagination}>
                    <p>
                        Hiển thị <b>1-{rows.length || 0}</b> trong tổng số <b>{rows.length}</b> khoá học chuyên đề
                    </p>
                    <div className={styles.coursePageControls}>
                        <button type="button" disabled>
                            Trước
                        </button>
                        <button type="button" className={styles.coursePageActive}>
                            1
                        </button>
                        <button type="button" disabled>
                            Sau
                        </button>
                    </div>
                </div>
            </section>
        </BaseAdminLayout>
    );
};
