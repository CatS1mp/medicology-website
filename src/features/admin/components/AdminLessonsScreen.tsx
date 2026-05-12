'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';
import { AdminTableSkeleton } from './AdminTableSkeleton';
import {
    adminCreateLesson,
    adminDeleteLesson,
    adminListCourses,
    adminListLessons,
    adminListSections,
    adminPatchLessonStatus,
    adminUpdateLesson,
} from '@/shared/api/admin-learning';
import type { CourseResponse, LessonResponse, SectionResponse } from '@/shared/types/learning';

type LessonLevel = 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
type LessonStatus = 'Hoạt động' | 'Tạm ẩn';

type LessonRow = {
    id: string;
    code: string;
    name: string;
    course: string;
    order: number;
    duration: string;
    updatedAt: string;
    level: LessonLevel;
    status: LessonStatus;
};

function mapDifficulty(d: string | null | undefined): LessonLevel {
    if (!d) return 'Cơ bản';
    const u = d.toUpperCase();
    if (u.includes('ADV') || u.includes('NÂNG') || u.includes('CAO')) return 'Nâng cao';
    if (u.includes('INTER') || u.includes('TRUNG')) return 'Trung cấp';
    return 'Cơ bản';
}

function mapLesson(l: LessonResponse, courseName: string): LessonRow {
    const mins = l.estimatedDurationMinutes;
    const duration = mins != null ? `${mins} phút` : '—';
    const updated = l.updatedAt ? new Date(l.updatedAt).toLocaleDateString('vi-VN') : '—';
    return {
        id: l.id,
        code: l.slug?.slice(0, 8).toUpperCase() ?? l.id.slice(0, 8),
        name: l.name,
        course: courseName,
        order: l.orderIndex,
        duration,
        updatedAt: updated,
        level: mapDifficulty(l.difficultyLevel),
        status: l.isActive ? 'Hoạt động' : 'Tạm ẩn',
    };
}

function lessonLevelClass(level: LessonLevel): string {
    if (level === 'Cơ bản') return styles.lessonLevelBasic;
    if (level === 'Trung cấp') return styles.lessonLevelIntermediate;
    return styles.lessonLevelAdvanced;
}

function lessonStatusClass(status: LessonStatus): string {
    if (status === 'Hoạt động') return styles.lessonStatusActive;
    return styles.lessonStatusHidden;
}

export const AdminLessonsScreen: React.FC = () => {
    const searchParams = useSearchParams();
    const [openActionFor, setOpenActionFor] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [sections, setSections] = useState<SectionResponse[]>([]);
    const [courseId, setCourseId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [rows, setRows] = useState<LessonRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const appliedQueryRef = useRef(false);
    const initialCourseId = searchParams.get('courseId') ?? '';
    const initialSectionId = searchParams.get('sectionId') ?? '';

    const courseName = useMemo(() => courses.find((c) => c.id === courseId)?.name ?? '—', [courses, courseId]);

    const loadCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await adminListCourses();
            setCourses(list);
            setCourseId((prev) => {
                if (prev) return prev;
                if (initialCourseId && list.some((c) => c.id === initialCourseId)) {
                    return initialCourseId;
                }
                return list[0]?.id ?? '';
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được khóa học.');
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, [initialCourseId]);

    useEffect(() => {
        void loadCourses();
    }, [loadCourses]);

    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;
        (async () => {
            try {
                const secs = await adminListSections(courseId);
                if (cancelled) return;
                setSections(secs);
                if (secs.length) {
                    setSectionId((prev) => {
                        if (prev && secs.some((s) => s.id === prev)) return prev;
                        if (!appliedQueryRef.current && initialSectionId && secs.some((s) => s.id === initialSectionId)) {
                            appliedQueryRef.current = true;
                            return initialSectionId;
                        }
                        return secs[0].id;
                    });
                } else {
                    setSectionId('');
                    setRows([]);
                }
            } catch {
                if (!cancelled) {
                    setSections([]);
                    setSectionId('');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [courseId, initialSectionId]);

    const loadLessons = useCallback(async () => {
        if (!sectionId) {
            setRows([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const list = await adminListLessons(sectionId);
            setRows(list.map((l) => mapLesson(l, courseName)));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được bài học.');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [sectionId, courseName]);

    useEffect(() => {
        if (sectionId) void loadLessons();
    }, [sectionId, loadLessons]);

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

    const findLessonId = (row: LessonRow) => row.id;

    const handleLessonAction = async (action: 'view' | 'edit' | 'delete', lesson: LessonRow) => {
        const id = findLessonId(lesson);
        if (action === 'view') {
            window.alert(`${lesson.name}\nID: ${id}`);
            setOpenActionFor(null);
            return;
        }
        if (action === 'edit') {
            const name = window.prompt('Tên bài học', lesson.name);
            if (!name?.trim()) {
                setOpenActionFor(null);
                return;
            }
            try {
                await adminUpdateLesson(id, { name: name.trim() });
                await loadLessons();
            } catch (e) {
                window.alert(e instanceof Error ? e.message : 'Cập nhật thất bại.');
            }
            setOpenActionFor(null);
            return;
        }
        if (action === 'delete') {
            if (!window.confirm(`Xóa bài học "${lesson.name}"?`)) {
                setOpenActionFor(null);
                return;
            }
            try {
                await adminDeleteLesson(id);
                await loadLessons();
            } catch (e) {
                window.alert(e instanceof Error ? e.message : 'Xóa thất bại.');
            }
            setOpenActionFor(null);
        }
    };

    const handleToggleStatus = async (lesson: LessonRow) => {
        const id = findLessonId(lesson);
        try {
            await adminPatchLessonStatus(id, lesson.status !== 'Hoạt động');
            await loadLessons();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Đổi trạng thái thất bại.');
        }
        setOpenActionFor(null);
    };

    const handleAddLesson = async () => {
        if (!sectionId) {
            window.alert('Chọn chặng (section) trước.');
            return;
        }
        const name = window.prompt('Tên bài học');
        if (!name?.trim()) return;
        const slug = window.prompt('Slug', name.trim().toLowerCase().replace(/\s+/g, '-')) ?? '';
        if (!slug.trim()) return;
        try {
            await adminCreateLesson({
                sectionId,
                name: name.trim(),
                slug: slug.trim(),
                description: null,
            });
            await loadLessons();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Tạo bài học thất bại.');
        }
    };

    return (
        <BaseAdminLayout>
            <section className={styles.lessonHeader}>
                <div>
                    <h1>Quản lý Bài học</h1>
                    <p>Quản lý chi tiết nội dung các bài giảng và thời lượng học tập trong từng chuyên đề</p>
                </div>
            </section>

            <section className={styles.lessonFilterCard}>
                <div className={styles.lessonSortRow} style={{ flexWrap: 'wrap', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Khoá học</span>
                        <select
                            className={styles.lessonSelect}
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                        >
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Chặng (section)</span>
                        <select
                            className={styles.lessonSelect}
                            value={sectionId}
                            onChange={(e) => setSectionId(e.target.value)}
                            disabled={!sections.length}
                        >
                            {sections.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className={styles.lessonSortRow}>
                    <span>Sắp xếp theo:</span>
                    <select className={styles.lessonSelect} disabled>
                        <option>Mới cập nhật</option>
                    </select>
                </div>

                <div className={styles.lessonFilterGroup}>
                    <h3>Cấp độ</h3>
                    <div className={styles.lessonChipRow}>
                        <button type="button" className={`${styles.lessonChip} ${styles.lessonChipActive}`}>
                            Mọi cấp độ
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Cơ bản
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Trung cấp
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Nâng cao
                        </button>
                    </div>
                </div>

                <div className={styles.lessonFilterGroup}>
                    <h3>Chủ đề Học tập</h3>
                    <div className={styles.lessonChipRow}>
                        <button type="button" className={`${styles.lessonChip} ${styles.lessonChipActive}`}>
                            Tất cả
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Sơ cứu & Cấp cứu
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Dinh dưỡng & Chế độ ăn
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Sức khỏe Tinh thần
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Sức khỏe Tim mạch
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Y học Thường thức
                        </button>
                    </div>
                </div>

                <div className={styles.lessonFilterGroup}>
                    <h3>Khoá học chuyên đề</h3>
                    <div className={styles.lessonChipRow}>
                        <button type="button" className={`${styles.lessonChip} ${styles.lessonChipActive}`}>
                            Tất cả
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Kỹ thuật sơ cứu cơ bản
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Kỹ thuật sơ cứu nâng cao
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Chăm sóc sau đột quỵ
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Nhận biết trầm cảm
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Dinh dưỡng cho trẻ nhỏ
                        </button>
                    </div>
                </div>

                <div className={styles.lessonFilterGroup}>
                    <h3>Trạng thái hiển thị</h3>
                    <div className={styles.lessonChipRow}>
                        <button type="button" className={`${styles.lessonChip} ${styles.lessonChipActive}`}>
                            Tất cả
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Hoạt động
                        </button>
                        <button type="button" className={styles.lessonChip} disabled>
                            Tạm ẩn
                        </button>
                    </div>
                </div>
            </section>

            {error && (
                <section className={styles.lessonFilterCard} style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                    <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                    <button type="button" className={styles.lessonPrimaryBtn} style={{ marginTop: 12 }} onClick={() => void loadLessons()}>
                        Thử lại
                    </button>
                </section>
            )}

            <section className={styles.lessonTableCard}>
                <div className={styles.lessonTableIntro}>
                    <h2>Danh sách Bài học</h2>
                    <p>Quản lý danh sách các bài học và nội dung giảng dạy trong chuyên đề</p>
                </div>

                <div className={styles.lessonToolbar}>
                    <div className={styles.lessonSearchWrap}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" stroke="#C0C4CC" strokeWidth="1.8" />
                            <path d="M20 20L16.5 16.5" stroke="#C0C4CC" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <input type="text" placeholder="Tìm kiếm" disabled />
                    </div>

                    <div className={styles.lessonToolbarActions}>
                        <button type="button" className={styles.lessonGhostBtn} disabled>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 15V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 9.5L12 6L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Nhập Excel
                        </button>
                        <button type="button" className={styles.lessonGhostBtn} disabled>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 6V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 11.5L12 15L15.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Xuất Excel
                        </button>
                        <button type="button" className={styles.lessonPrimaryBtn} onClick={() => void handleAddLesson()}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Thêm bài học
                        </button>
                    </div>
                </div>

                {loading && (
                    <AdminTableSkeleton
                        columns={[
                            { key: 'sel', width: 'w-6' },
                            { key: 'code', width: 'w-14' },
                            { key: 'name', width: 'w-56' },
                            { key: 'course', width: 'w-40' },
                            { key: 'order', width: 'w-14' },
                            { key: 'dur', width: 'w-20' },
                            { key: 'upd', width: 'w-24' },
                            { key: 'level', width: 'w-24' },
                            { key: 'status', width: 'w-24' },
                            { key: 'act', width: 'w-12' },
                        ]}
                    />
                )}
                {!loading && !error && sectionId && rows.length === 0 && (
                    <p style={{ padding: '0 24px 16px', color: '#64748b' }}>Chưa có bài học trong chặng này.</p>
                )}

                <div className={styles.lessonTableWrap}>
                    <table className={styles.lessonTable}>
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" aria-label="Chọn tất cả" disabled />
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>Mã</span>
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>Tên bài học</span>
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>Khoá học chuyên đề</span>
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>Thứ tự</span>
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>Thời lượng</span>
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>Ngày cập nhật</span>
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>Cấp độ</span>
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>Trạng thái</span>
                                </th>
                                <th>
                                    <span className={styles.lessonHeadCell}>HD</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((lesson) => (
                                <tr
                                    key={lesson.id}
                                    className={openActionFor === lesson.id ? styles.lessonTableRowMenuOpen : undefined}
                                >
                                    <td>
                                        <input type="checkbox" aria-label={`Chọn ${lesson.code}`} disabled />
                                    </td>
                                    <td>{lesson.code}</td>
                                    <td className={styles.lessonNameCell}>{lesson.name}</td>
                                    <td>{lesson.course}</td>
                                    <td>{lesson.order}</td>
                                    <td>{lesson.duration}</td>
                                    <td>{lesson.updatedAt}</td>
                                    <td>
                                        <span className={`${styles.lessonLevelPill} ${lessonLevelClass(lesson.level)}`}>{lesson.level}</span>
                                    </td>
                                    <td>
                                        <span className={`${styles.lessonStatusPill} ${lessonStatusClass(lesson.status)}`}>{lesson.status}</span>
                                    </td>
                                    <td className={styles.lessonActionCell}>
                                        <div ref={openActionFor === lesson.id ? actionMenuRef : null}>
                                            <button
                                                type="button"
                                                className={styles.lessonMoreBtn}
                                                onClick={() => setOpenActionFor((prev) => (prev === lesson.id ? null : lesson.id))}
                                                aria-label={`Thao tác ${lesson.code}`}
                                                aria-expanded={openActionFor === lesson.id}
                                                aria-haspopup="menu"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <circle cx="12" cy="5" r="1.7" fill="currentColor" />
                                                    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                                                    <circle cx="12" cy="19" r="1.7" fill="currentColor" />
                                                </svg>
                                            </button>

                                            {openActionFor === lesson.id && (
                                                <div className={styles.lessonActionMenu} role="menu">
                                                    <button type="button" onClick={() => void handleLessonAction('view', lesson)}>
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
                                                    <button type="button" onClick={() => void handleLessonAction('edit', lesson)}>
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
                                                    <button type="button" onClick={() => void handleToggleStatus(lesson)}>
                                                        {lesson.status === 'Hoạt động' ? 'Tạm ẩn' : 'Hiển thị'}
                                                    </button>
                                                    <button type="button" onClick={() => void handleLessonAction('delete', lesson)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M4.5 7.5H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            <path d="M9.5 4.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            <path d="M8 7.5V19.25H16V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                        </svg>
                                                        Xóa bài học
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

                <div className={styles.lessonPagination}>
                    <p>
                        Hiển thị <b>1-{rows.length || 0}</b> trong tổng số <b>{rows.length}</b> bài học
                    </p>
                    <div className={styles.lessonPageControls}>
                        <button type="button" disabled>
                            Trước
                        </button>
                        <button type="button" className={styles.lessonPageActive}>
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
