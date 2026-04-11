'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';

type CourseLevel = 'General' | 'Teen' | 'Adult';

type CourseRow = {
    code: string;
    name: string;
    topic: string;
    target: string;
    updated: string;
    order: number;
    level: CourseLevel;
};

const courseData: CourseRow[] = [
    { code: 'SCCB', name: 'Kỹ thuật sơ cứu cơ bản', topic: 'Sơ cứu & Cấp cứu', target: 'Trẻ em', updated: '03/12/2025', order: 12, level: 'General' },
    { code: 'DD01', name: 'Dinh dưỡng cho trẻ nhỏ', topic: 'Dinh dưỡng & Chế độ ăn', target: 'Tất cả', updated: '03/12/2025', order: 5, level: 'Teen' },
    { code: 'DD02', name: 'Khoáng chất trong thực vật', topic: 'Dinh dưỡng & Chế độ ăn', target: 'Tất cả', updated: '03/12/2025', order: 2, level: 'General' },
    { code: 'DD03', name: 'Dưỡng chất trong động vật', topic: 'Dinh dưỡng & Chế độ ăn', target: 'Tất cả', updated: '03/12/2025', order: 7, level: 'General' },
    { code: 'DD04', name: 'Khoáng chất trong thực vật', topic: 'Dinh dưỡng & Chế độ ăn', target: 'Tất cả', updated: '03/12/2025', order: 4, level: 'General' },
    { code: 'SCNC', name: 'Kỹ thuật sơ cứu nâng cao', topic: 'Sơ cứu & Cấp cứu', target: 'Tất cả', updated: '03/12/2025', order: 8, level: 'Teen' },
    { code: 'SCNC', name: 'Kỹ thuật sơ cứu nâng cao', topic: 'Sơ cứu & Cấp cứu', target: 'Vị thành niên', updated: '03/12/2025', order: 3, level: 'General' },
    { code: 'SCNC', name: 'Kỹ thuật sơ cứu nâng cao', topic: 'Sơ cứu & Cấp cứu', target: 'Vị thành niên', updated: '03/12/2025', order: 3, level: 'Teen' },
    { code: 'SCNC', name: 'Kỹ thuật sơ cứu nâng cao', topic: 'Sơ cứu & Cấp cứu', target: 'Vị thành niên', updated: '03/12/2025', order: 19, level: 'General' },
    { code: 'SCNC', name: 'Kỹ thuật sơ cứu nâng cao', topic: 'Sơ cứu & Cấp cứu', target: 'Người lớn', updated: '03/12/2025', order: 3, level: 'Adult' },
    { code: 'TT01', name: 'Nhận biết trầm cảm', topic: 'Sức khỏe Tinh thần', target: 'Người lớn', updated: '03/12/2025', order: 3, level: 'General' },
    { code: 'TT02', name: 'Nhận biết trầm cảm', topic: 'Sức khỏe Tinh thần', target: 'Người lớn', updated: '03/12/2025', order: 9, level: 'General' },
    { code: 'TT03', name: 'Nhận biết trầm cảm', topic: 'Sức khỏe Tinh thần', target: 'Người lớn', updated: '03/12/2025', order: 12, level: 'General' },
    { code: 'TT04', name: 'Nhận biết trầm cảm', topic: 'Sức khỏe Tinh thần', target: 'Người lớn', updated: '03/12/2025', order: 15, level: 'Adult' },
    { code: 'TT05', name: 'Nhận biết trầm cảm', topic: 'Sức khỏe Tinh thần', target: 'Người lớn', updated: '03/12/2025', order: 3, level: 'General' },
    { code: 'TM01', name: 'Chăm sóc sau đột quỵ', topic: 'Sức khỏe Tim mạch', target: 'Người lớn', updated: '03/12/2025', order: 4, level: 'General' },
    { code: 'TM02', name: 'Chăm sóc sau đột quỵ', topic: 'Sức khỏe Tim mạch', target: 'Người lớn', updated: '03/12/2025', order: 5, level: 'General' },
    { code: 'TM03', name: 'Chăm sóc sau đột quỵ', topic: 'Sức khỏe Tim mạch', target: 'Vị thành niên', updated: '03/12/2025', order: 8, level: 'General' },
    { code: 'TM04', name: 'Chăm sóc sau đột quỵ', topic: 'Sức khỏe Tim mạch', target: 'Người lớn', updated: '03/12/2025', order: 3, level: 'Adult' },
    { code: 'TM05', name: 'Chăm sóc sau đột quỵ', topic: 'Sức khỏe Tim mạch', target: 'Người lớn', updated: '03/12/2025', order: 10, level: 'Adult' },
];

function levelClass(level: CourseLevel): string {
    if (level === 'General') return styles.courseLevelGeneral;
    if (level === 'Teen') return styles.courseLevelTeen;
    return styles.courseLevelAdult;
}

export const AdminCoursesScreen: React.FC = () => {
    const [openActionFor, setOpenActionFor] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    const rows = useMemo(() => courseData, []);

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

    const handleCourseAction = (action: 'view' | 'edit' | 'delete', course: CourseRow) => {
        // TODO: replace with real navigation/modal APIs when wired to backend.
        console.info(`[courses] ${action}`, course.code, course.name);
        setOpenActionFor(null);
    };

    return (
        <BaseAdminLayout>
            <section className={styles.courseHeader}>
                <div>
                    <h1>Quản lý Khoá học</h1>
                    <p>Hành trình hiểu về cơ thể và tâm trí qua các chủ đề học tập thiết thực</p>
                </div>
            </section>

            <section className={styles.courseFilterCard}>
                <div className={styles.courseSortRow}>
                    <span>Sắp xếp theo:</span>
                    <select className={styles.courseSelect}>
                        <option>Mới cập nhật</option>
                    </select>
                </div>

                <div className={styles.courseFilterGroup}>
                    <h3>Đối tượng người dùng</h3>
                    <div className={styles.courseChipRow}>
                        <button type="button" className={`${styles.courseChip} ${styles.courseChipActive}`}>Mọi đối tượng</button>
                        <button type="button" className={styles.courseChip}>Trẻ em</button>
                        <button type="button" className={styles.courseChip}>Vị thành niên</button>
                        <button type="button" className={styles.courseChip}>Người lớn</button>
                    </div>
                </div>

                <div className={styles.courseFilterGroup}>
                    <h3>Chủ đề Học tập</h3>
                    <div className={styles.courseChipRow}>
                        <button type="button" className={`${styles.courseChip} ${styles.courseChipActive}`}>Tất cả</button>
                        <button type="button" className={styles.courseChip}>Sơ cứu & Cấp cứu</button>
                        <button type="button" className={styles.courseChip}>Dinh dưỡng & Chế độ ăn</button>
                        <button type="button" className={styles.courseChip}>Sức khỏe Tinh thần</button>
                        <button type="button" className={styles.courseChip}>Sức khỏe Tim mạch</button>
                        <button type="button" className={styles.courseChip}>Y học Thường thức</button>
                    </div>
                </div>

                <div className={styles.courseFilterGroup}>
                    <h3>Trạng thái hiển thị</h3>
                    <div className={styles.courseChipRow}>
                        <button type="button" className={`${styles.courseChip} ${styles.courseChipActive}`}>Tất cả</button>
                        <button type="button" className={styles.courseChip}>Đã đăng tải</button>
                        <button type="button" className={styles.courseChip}>Bản nháp</button>
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
                        <input type="text" placeholder="Tìm kiếm" />
                    </div>

                    <div className={styles.courseToolbarActions}>
                        <button type="button" className={styles.courseGhostBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 15V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 9.5L12 6L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Nhập Excel
                        </button>
                        <button type="button" className={styles.courseGhostBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 6V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 11.5L12 15L15.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Xuất Excel
                        </button>
                        <button type="button" className={styles.coursePrimaryBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Thêm khoá học
                        </button>
                    </div>
                </div>

                <div className={styles.courseTableWrap}>
                    <table className={styles.courseTable}>
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Chọn tất cả" /></th>
                                <th><span className={styles.courseHeadCell}>Mã</span></th>
                                <th><span className={styles.courseHeadCell}>Tên khoá học chuyên đề</span></th>
                                <th><span className={styles.courseHeadCell}>Chủ đề</span></th>
                                <th><span className={styles.courseHeadCell}>Đối tượng</span></th>
                                <th><span className={styles.courseHeadCell}>Ngày cập nhật</span></th>
                                <th><span className={styles.courseHeadCell}>Thứ tự</span></th>
                                <th><span className={styles.courseHeadCell}>Xếp hạng ND</span></th>
                                <th><span className={styles.courseHeadCell}>HD</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((course, index) => (
                                <tr key={`${course.code}-${index}`}>
                                    <td><input type="checkbox" aria-label={`Chọn ${course.code}-${index}`} /></td>
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
                                        <div ref={openActionFor === `${course.code}-${index}` ? actionMenuRef : null}>
                                            <button
                                                type="button"
                                                className={styles.courseMoreBtn}
                                                onClick={() => setOpenActionFor((prev) => (prev === `${course.code}-${index}` ? null : `${course.code}-${index}`))}
                                                aria-label={`Thao tác ${course.code}`}
                                                aria-expanded={openActionFor === `${course.code}-${index}`}
                                                aria-haspopup="menu"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <circle cx="12" cy="5" r="1.7" fill="currentColor" />
                                                    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                                                    <circle cx="12" cy="19" r="1.7" fill="currentColor" />
                                                </svg>
                                            </button>

                                            {openActionFor === `${course.code}-${index}` && (
                                                <div className={styles.courseActionMenu} role="menu">
                                                    <button type="button" onClick={() => handleCourseAction('view', course)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M2.5 12C4.5 7.5 8 5.25 12 5.25C16 5.25 19.5 7.5 21.5 12C19.5 16.5 16 18.75 12 18.75C8 18.75 4.5 16.5 2.5 12Z" stroke="currentColor" strokeWidth="1.8" />
                                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                                                        </svg>
                                                        Xem chi tiết
                                                    </button>
                                                    <button type="button" onClick={() => handleCourseAction('edit', course)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M4 20H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            <path d="M6.75 15.75L15.75 6.75L18.25 9.25L9.25 18.25L6 19L6.75 15.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                        </svg>
                                                        Chỉnh sửa
                                                    </button>
                                                    <button type="button" onClick={() => handleCourseAction('delete', course)}>
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
                    <p>Hiển thị <b>1-20</b> trong tổng số <b>345</b> khoá học chuyên đề</p>
                    <div className={styles.coursePageControls}>
                        <button type="button">Trước</button>
                        <button type="button" className={styles.coursePageActive}>1</button>
                        <button type="button">2</button>
                        <button type="button">3</button>
                        <button type="button">...</button>
                        <button type="button">140</button>
                        <button type="button">Sau</button>
                    </div>
                </div>
            </section>
        </BaseAdminLayout>
    );
};
