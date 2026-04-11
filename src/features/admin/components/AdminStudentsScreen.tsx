'use client';

import React, { useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';

type StudentStatus = 'Hoạt động' | 'Chưa xác thực' | 'Đã khóa';

type StudentRow = {
    code: string;
    fullName: string;
    email: string;
    audience: string;
    joinedAt: string;
    streak: number;
    status: StudentStatus;
};

const STUDENTS: StudentRow[] = [
    { code: '001', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Trẻ em', joinedAt: '03/12/2025', streak: 12, status: 'Hoạt động' },
    { code: '002', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Vị thành niên', joinedAt: '03/12/2025', streak: 5, status: 'Chưa xác thực' },
    { code: '003', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Vị thành niên', joinedAt: '03/12/2025', streak: 2, status: 'Hoạt động' },
    { code: '004', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Người lớn', joinedAt: '03/12/2025', streak: 7, status: 'Hoạt động' },
    { code: '005', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Trẻ em', joinedAt: '03/12/2025', streak: 4, status: 'Hoạt động' },
    { code: '006', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Trẻ em', joinedAt: '03/12/2025', streak: 8, status: 'Chưa xác thực' },
    { code: '007', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Vị thành niên', joinedAt: '03/12/2025', streak: 3, status: 'Hoạt động' },
    { code: '008', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Vị thành niên', joinedAt: '03/12/2025', streak: 3, status: 'Chưa xác thực' },
    { code: '009', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Vị thành niên', joinedAt: '03/12/2025', streak: 19, status: 'Hoạt động' },
    { code: '010', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Người lớn', joinedAt: '03/12/2025', streak: 3, status: 'Đã khóa' },
    { code: '011', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Trẻ em', joinedAt: '03/12/2025', streak: 3, status: 'Hoạt động' },
    { code: '012', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Trẻ em', joinedAt: '03/12/2025', streak: 9, status: 'Hoạt động' },
    { code: '013', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Trẻ em', joinedAt: '03/12/2025', streak: 12, status: 'Hoạt động' },
    { code: '014', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Trẻ em', joinedAt: '03/12/2025', streak: 15, status: 'Đã khóa' },
    { code: '015', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Người lớn', joinedAt: '03/12/2025', streak: 3, status: 'Hoạt động' },
    { code: '016', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Người lớn', joinedAt: '03/12/2025', streak: 4, status: 'Hoạt động' },
    { code: '017', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Người lớn', joinedAt: '03/12/2025', streak: 5, status: 'Hoạt động' },
    { code: '018', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Vị thành niên', joinedAt: '03/12/2025', streak: 8, status: 'Hoạt động' },
    { code: '019', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Người lớn', joinedAt: '03/12/2025', streak: 3, status: 'Đã khóa' },
    { code: '020', fullName: 'Trần Thị Thảo', email: 'tranthithaok18@example.com', audience: 'Người lớn', joinedAt: '03/12/2025', streak: 10, status: 'Đã khóa' },
];

function statusClass(status: StudentStatus): string {
    if (status === 'Hoạt động') return styles.studentStatusActive;
    if (status === 'Chưa xác thực') return styles.studentStatusPending;
    return styles.studentStatusLocked;
}

export const AdminStudentsScreen: React.FC = () => {
    const [openActionFor, setOpenActionFor] = useState<string | null>('002');
    const rows = useMemo(() => STUDENTS, []);

    return (
        <BaseAdminLayout>
            <section className={styles.studentsHeader}>
                <h1>Hồ sơ học viên</h1>
                <p>Quản lý thông tin tài khoản và theo dõi hoạt động của người dùng.</p>
            </section>

            <section className={styles.studentsFilterCard}>
                <div className={styles.studentsSortRow}>
                    <span>Sắp xếp theo:</span>
                    <select className={styles.studentsSelect}>
                        <option>Mới nhất</option>
                        <option>Cũ nhất</option>
                    </select>
                    <select className={styles.studentsSelect}>
                        <option>Ngày tham gia</option>
                        <option>Chuỗi học tập</option>
                    </select>
                </div>

                <div className={styles.studentsFilterBlock}>
                    <h3>Đối tượng</h3>
                    <div className={styles.studentsChipRow}>
                        <button type="button" className={`${styles.studentsChip} ${styles.studentsChipActive}`}>Mọi đối tượng</button>
                        <button type="button" className={styles.studentsChip}>Trẻ em</button>
                        <button type="button" className={styles.studentsChip}>Vị thành niên</button>
                        <button type="button" className={styles.studentsChip}>Người lớn</button>
                    </div>
                </div>

                <div className={styles.studentsFilterBlock}>
                    <h3>Trạng thái tài khoản</h3>
                    <div className={styles.studentsChipRow}>
                        <button type="button" className={`${styles.studentsChip} ${styles.studentsChipActive}`}>Tất cả</button>
                        <button type="button" className={styles.studentsChip}>Hoạt động</button>
                        <button type="button" className={styles.studentsChip}>Chờ xác thực</button>
                        <button type="button" className={styles.studentsChip}>Đã khóa</button>
                    </div>
                </div>

                <div className={styles.studentsFilterBlock}>
                    <h3>Chuỗi học tập</h3>
                    <div className={styles.studentsChipRow}>
                        <button type="button" className={`${styles.studentsChip} ${styles.studentsChipActive}`}>Tất cả</button>
                        <button type="button" className={styles.studentsChip}>0 ngày</button>
                        <button type="button" className={styles.studentsChip}>1-7 ngày</button>
                        <button type="button" className={styles.studentsChip}>+8 ngày</button>
                    </div>
                </div>
            </section>

            <section className={styles.studentsTableCard}>
                <div className={styles.studentsTableIntro}>
                    <h2>Danh sách người dùng</h2>
                    <p>Quản lý hồ sơ và thông tin người dùng</p>
                </div>

                <div className={styles.studentsTableToolbar}>
                    <div className={styles.studentsSearchWrap}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" stroke="#C0C4CC" strokeWidth="1.8" />
                            <path d="M20 20L16.5 16.5" stroke="#C0C4CC" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <input type="text" placeholder="Tìm kiếm theo MSSV, tên..." />
                    </div>

                    <div className={styles.studentsActions}>
                        <button type="button" className={styles.studentsGhostBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 15V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 9.5L12 6L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Nhập Excel
                        </button>
                        <button type="button" className={styles.studentsGhostBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 6V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 11.5L12 15L15.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Xuất Excel
                        </button>
                        <button type="button" className={styles.studentsPrimaryBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Thêm học viên
                        </button>
                    </div>
                </div>

                <div className={styles.studentsTableWrap}>
                    <table className={styles.studentsTable}>
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Chọn tất cả" /></th>
                                <th><span className={styles.headCell}>Mã</span></th>
                                <th><span className={styles.headCell}>Họ tên</span></th>
                                <th><span className={styles.headCell}>Email</span></th>
                                <th><span className={styles.headCell}>Đối tượng</span></th>
                                <th><span className={styles.headCell}>Ngày tham gia</span></th>
                                <th><span className={styles.headCell}>Chuỗi</span></th>
                                <th><span className={styles.headCell}>Trạng thái</span></th>
                                <th><span className={styles.headCell}>HĐ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.code}>
                                    <td><input type="checkbox" aria-label={`Chọn ${row.code}`} /></td>
                                    <td>{row.code}</td>
                                    <td className={styles.studentsName}>{row.fullName}</td>
                                    <td>{row.email}</td>
                                    <td>{row.audience}</td>
                                    <td>{row.joinedAt}</td>
                                    <td>{row.streak}</td>
                                    <td>
                                        <span className={`${styles.studentStatusPill} ${statusClass(row.status)}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={styles.studentsActionCell}>
                                        <button
                                            type="button"
                                            className={styles.studentsMoreBtn}
                                            onClick={() => setOpenActionFor((prev) => (prev === row.code ? null : row.code))}
                                            aria-label={`Thao tác ${row.code}`}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <circle cx="12" cy="5" r="1.7" fill="currentColor" />
                                                <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                                                <circle cx="12" cy="19" r="1.7" fill="currentColor" />
                                            </svg>
                                        </button>
                                        {openActionFor === row.code && (
                                            <div className={styles.studentsMenu}>
                                                <button type="button">
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                        <path d="M2.5 12C4.5 7.5 8 5.25 12 5.25C16 5.25 19.5 7.5 21.5 12C19.5 16.5 16 18.75 12 18.75C8 18.75 4.5 16.5 2.5 12Z" stroke="currentColor" strokeWidth="1.8" />
                                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                                                    </svg>
                                                    Xem chi tiết
                                                </button>
                                                <button type="button">
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                        <path d="M4 20H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                        <path d="M6.75 15.75L15.75 6.75L18.25 9.25L9.25 18.25L6 19L6.75 15.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                    </svg>
                                                    Chỉnh sửa
                                                </button>
                                                <button type="button" className={styles.studentsDeleteBtn}>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                        <path d="M4.5 7.5H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                        <path d="M9.5 4.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                        <path d="M8 7.5V19.25H16V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                    </svg>
                                                    Xóa người dùng
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.studentsPagination}>
                    <p>Hiển thị <b>1-20</b> trong tổng số <b>2,847</b> người dùng</p>
                    <div className={styles.studentsPageControls}>
                        <button type="button">Trước</button>
                        <button type="button" className={styles.studentsPageActive}>1</button>
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
