'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';

type LessonLevel = 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
type LessonStatus = 'Hoạt động' | 'Tạm ẩn';

type LessonRow = {
    code: string;
    name: string;
    course: string;
    order: number;
    duration: string;
    updatedAt: string;
    level: LessonLevel;
    status: LessonStatus;
};

const lessonData: LessonRow[] = [
    { code: 'SCCB', name: 'Các bước sơ cứu tại chỗ', course: 'Kỹ thuật sơ cứu cơ bản', order: 1, duration: '7 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Hoạt động' },
    { code: 'DD01', name: 'Sữa mẹ và dinh dưỡng', course: 'Dinh dưỡng cho trẻ nhỏ', order: 1, duration: '7 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Tạm ẩn' },
    { code: 'DD02', name: 'Tác dụng của Vitamin A', course: 'Khoáng chất trong thực vật', order: 1, duration: '10 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Hoạt động' },
    { code: 'DD03', name: 'Protein từ thịt động vật', course: 'Dưỡng chất trong động vật', order: 1, duration: '10 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Hoạt động' },
    { code: 'DD04', name: 'Protein từ thịt động vật', course: 'Khoáng chất trong thực vật', order: 2, duration: '11 phút', updatedAt: '03/12/2025', level: 'Trung cấp', status: 'Hoạt động' },
    { code: 'SCNC', name: 'Xử lý chấn thương hở', course: 'Kỹ thuật sơ cứu nâng cao', order: 1, duration: '11 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Tạm ẩn' },
    { code: 'SCNC', name: 'Xử lý chấn thương hở', course: 'Kỹ thuật sơ cứu nâng cao', order: 1, duration: '13 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Hoạt động' },
    { code: 'SCNC', name: 'Xử lý chấn thương hở', course: 'Kỹ thuật sơ cứu nâng cao', order: 1, duration: '11 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Tạm ẩn' },
    { code: 'SCNC', name: 'Xử lý chấn thương hở', course: 'Kỹ thuật sơ cứu nâng cao', order: 1, duration: '15 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Hoạt động' },
    { code: 'SCNC', name: 'Xử lý chấn thương hở', course: 'Kỹ thuật sơ cứu nâng cao', order: 1, duration: '16 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Hoạt động' },
    { code: 'TT01', name: 'Trầm cảm là gì?', course: 'Nhận biết trầm cảm', order: 1, duration: '7 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Hoạt động' },
    { code: 'TT02', name: 'Trầm cảm là gì?', course: 'Nhận biết trầm cảm', order: 2, duration: '7 phút', updatedAt: '03/12/2025', level: 'Trung cấp', status: 'Tạm ẩn' },
    { code: 'TT03', name: 'Tác hại của trầm cảm', course: 'Nhận biết trầm cảm', order: 2, duration: '9 phút', updatedAt: '03/12/2025', level: 'Trung cấp', status: 'Hoạt động' },
    { code: 'TT04', name: 'Tác hại của trầm cảm', course: 'Nhận biết trầm cảm', order: 2, duration: '7 phút', updatedAt: '03/12/2025', level: 'Trung cấp', status: 'Tạm ẩn' },
    { code: 'TT05', name: 'Tác hại của trầm cảm', course: 'Chăm sóc sau đột quỵ', order: 2, duration: '7 phút', updatedAt: '03/12/2025', level: 'Trung cấp', status: 'Tạm ẩn' },
    { code: 'TM01', name: 'Đột quỵ là gì?', course: 'Chăm sóc sau đột quỵ', order: 1, duration: '7 phút', updatedAt: '03/12/2025', level: 'Cơ bản', status: 'Hoạt động' },
    { code: 'TM02', name: 'Tại sao lại đột quỵ?', course: 'Chăm sóc sau đột quỵ', order: 2, duration: '7 phút', updatedAt: '03/12/2025', level: 'Trung cấp', status: 'Hoạt động' },
    { code: 'TM03', name: 'Tác hại tâm đêm', course: 'Chăm sóc sau đột quỵ', order: 3, duration: '7 phút', updatedAt: '03/12/2025', level: 'Nâng cao', status: 'Hoạt động' },
    { code: 'TM04', name: 'Tác hại tâm đêm', course: 'Chăm sóc sau đột quỵ', order: 3, duration: '7 phút', updatedAt: '03/12/2025', level: 'Nâng cao', status: 'Tạm ẩn' },
    { code: 'TM05', name: 'Tác hại tâm đêm', course: 'Chăm sóc sau đột quỵ', order: 3, duration: '7 phút', updatedAt: '03/12/2025', level: 'Nâng cao', status: 'Tạm ẩn' },
];

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
    const [openActionFor, setOpenActionFor] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    const rows = useMemo(() => lessonData, []);

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

    const handleLessonAction = (action: 'view' | 'edit' | 'delete', lesson: LessonRow) => {
        // TODO: replace with real navigation/modal APIs when wired to backend.
        console.info(`[lessons] ${action}`, lesson.code, lesson.name);
        setOpenActionFor(null);
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
                <div className={styles.lessonSortRow}>
                    <span>Sắp xếp theo:</span>
                    <select className={styles.lessonSelect}>
                        <option>Mới cập nhật</option>
                    </select>
                </div>

                <div className={styles.lessonFilterGroup}>
                    <h3>Cấp độ</h3>
                    <div className={styles.lessonChipRow}>
                        <button type="button" className={`${styles.lessonChip} ${styles.lessonChipActive}`}>Mọi cấp độ</button>
                        <button type="button" className={styles.lessonChip}>Cơ bản</button>
                        <button type="button" className={styles.lessonChip}>Trung cấp</button>
                        <button type="button" className={styles.lessonChip}>Nâng cao</button>
                    </div>
                </div>

                <div className={styles.lessonFilterGroup}>
                    <h3>Chủ đề Học tập</h3>
                    <div className={styles.lessonChipRow}>
                        <button type="button" className={`${styles.lessonChip} ${styles.lessonChipActive}`}>Tất cả</button>
                        <button type="button" className={styles.lessonChip}>Sơ cứu & Cấp cứu</button>
                        <button type="button" className={styles.lessonChip}>Dinh dưỡng & Chế độ ăn</button>
                        <button type="button" className={styles.lessonChip}>Sức khỏe Tinh thần</button>
                        <button type="button" className={styles.lessonChip}>Sức khỏe Tim mạch</button>
                        <button type="button" className={styles.lessonChip}>Y học Thường thức</button>
                    </div>
                </div>

                <div className={styles.lessonFilterGroup}>
                    <h3>Khoá học chuyên đề</h3>
                    <div className={styles.lessonChipRow}>
                        <button type="button" className={`${styles.lessonChip} ${styles.lessonChipActive}`}>Tất cả</button>
                        <button type="button" className={styles.lessonChip}>Kỹ thuật sơ cứu cơ bản</button>
                        <button type="button" className={styles.lessonChip}>Kỹ thuật sơ cứu nâng cao</button>
                        <button type="button" className={styles.lessonChip}>Chăm sóc sau đột quỵ</button>
                        <button type="button" className={styles.lessonChip}>Nhận biết trầm cảm</button>
                        <button type="button" className={styles.lessonChip}>Dinh dưỡng cho trẻ nhỏ</button>
                    </div>
                </div>

                <div className={styles.lessonFilterGroup}>
                    <h3>Trạng thái hiển thị</h3>
                    <div className={styles.lessonChipRow}>
                        <button type="button" className={`${styles.lessonChip} ${styles.lessonChipActive}`}>Tất cả</button>
                        <button type="button" className={styles.lessonChip}>Hoạt động</button>
                        <button type="button" className={styles.lessonChip}>Tạm ẩn</button>
                    </div>
                </div>
            </section>

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
                        <input type="text" placeholder="Tìm kiếm" />
                    </div>

                    <div className={styles.lessonToolbarActions}>
                        <button type="button" className={styles.lessonGhostBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 15V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 9.5L12 6L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Nhập Excel
                        </button>
                        <button type="button" className={styles.lessonGhostBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 6V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 11.5L12 15L15.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Xuất Excel
                        </button>
                        <button type="button" className={styles.lessonPrimaryBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Thêm bài học
                        </button>
                    </div>
                </div>

                <div className={styles.lessonTableWrap}>
                    <table className={styles.lessonTable}>
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Chọn tất cả" /></th>
                                <th><span className={styles.lessonHeadCell}>Mã</span></th>
                                <th><span className={styles.lessonHeadCell}>Tên bài học</span></th>
                                <th><span className={styles.lessonHeadCell}>Khoá học chuyên đề</span></th>
                                <th><span className={styles.lessonHeadCell}>Thứ tự</span></th>
                                <th><span className={styles.lessonHeadCell}>Thời lượng</span></th>
                                <th><span className={styles.lessonHeadCell}>Ngày cập nhật</span></th>
                                <th><span className={styles.lessonHeadCell}>Cấp độ</span></th>
                                <th><span className={styles.lessonHeadCell}>Trạng thái</span></th>
                                <th><span className={styles.lessonHeadCell}>HD</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((lesson, index) => (
                                <tr key={`${lesson.code}-${index}`}>
                                    <td><input type="checkbox" aria-label={`Chọn ${lesson.code}-${index}`} /></td>
                                    <td>{lesson.code}</td>
                                    <td className={styles.lessonNameCell}>{lesson.name}</td>
                                    <td>{lesson.course}</td>
                                    <td>{lesson.order}</td>
                                    <td>{lesson.duration}</td>
                                    <td>{lesson.updatedAt}</td>
                                    <td>
                                        <span className={`${styles.lessonLevelPill} ${lessonLevelClass(lesson.level)}`}>
                                            {lesson.level}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.lessonStatusPill} ${lessonStatusClass(lesson.status)}`}>
                                            {lesson.status}
                                        </span>
                                    </td>
                                    <td className={styles.lessonActionCell}>
                                        <div ref={openActionFor === `${lesson.code}-${index}` ? actionMenuRef : null}>
                                            <button
                                                type="button"
                                                className={styles.lessonMoreBtn}
                                                onClick={() => setOpenActionFor((prev) => (prev === `${lesson.code}-${index}` ? null : `${lesson.code}-${index}`))}
                                                aria-label={`Thao tác ${lesson.code}`}
                                                aria-expanded={openActionFor === `${lesson.code}-${index}`}
                                                aria-haspopup="menu"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <circle cx="12" cy="5" r="1.7" fill="currentColor" />
                                                    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                                                    <circle cx="12" cy="19" r="1.7" fill="currentColor" />
                                                </svg>
                                            </button>

                                            {openActionFor === `${lesson.code}-${index}` && (
                                                <div className={styles.lessonActionMenu} role="menu">
                                                    <button type="button" onClick={() => handleLessonAction('view', lesson)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M2.5 12C4.5 7.5 8 5.25 12 5.25C16 5.25 19.5 7.5 21.5 12C19.5 16.5 16 18.75 12 18.75C8 18.75 4.5 16.5 2.5 12Z" stroke="currentColor" strokeWidth="1.8" />
                                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                                                        </svg>
                                                        Xem chi tiết
                                                    </button>
                                                    <button type="button" onClick={() => handleLessonAction('edit', lesson)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M4 20H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            <path d="M6.75 15.75L15.75 6.75L18.25 9.25L9.25 18.25L6 19L6.75 15.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                        </svg>
                                                        Chỉnh sửa
                                                    </button>
                                                    <button type="button" onClick={() => handleLessonAction('delete', lesson)}>
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
                    <p>Hiển thị <b>1-20</b> trong tổng số <b>345</b> bài học</p>
                    <div className={styles.lessonPageControls}>
                        <button type="button">Trước</button>
                        <button type="button" className={styles.lessonPageActive}>1</button>
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
