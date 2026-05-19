'use client';

import React, { useCallback, useEffect, useState } from 'react';
import styles from '@/features/admin/admin.module.css';
import { BaseAdminLayout } from '@/features/admin/components/layout/BaseAdminLayout';
import { deleteAdminUser, fetchAdminUserProfile, fetchAdminUsers, patchAdminUserStatus } from '@/shared/api/admin-users';
import {
    mapAdminUserToStudentRow,
    type AdminUserApiRecord,
    type StudentStatusUi,
    type StudentTableRow,
} from '@/shared/types/admin';
import { AdminAddStudentModal } from '@/features/admin/components/users/AdminAddStudentModal';
import { AdminStudentProfileModal } from '@/features/admin/components/users/AdminStudentProfileModal';
import { AdminTableSkeleton } from '@/features/admin/components/shared/AdminTableSkeleton';

function statusClass(status: StudentStatusUi): string {
    if (status === 'Hoạt động') return styles.studentStatusActive;
    if (status === 'Chưa xác thực') return styles.studentStatusPending;
    return styles.studentStatusLocked;
}

export const AdminStudentsScreen: React.FC = () => {
    const [openActionFor, setOpenActionFor] = useState<string | null>(null);
    const [adminUsers, setAdminUsers] = useState<AdminUserApiRecord[]>([]);
    const [profileSelection, setProfileSelection] = useState<{ raw: AdminUserApiRecord; row: StudentTableRow } | null>(
        null
    );
    const [rows, setRows] = useState<StudentTableRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [addStudentOpen, setAddStudentOpen] = useState(false);
    const [profileDetailLoading, setProfileDetailLoading] = useState(false);
    const [profileDetailError, setProfileDetailError] = useState<string | null>(null);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const load = useCallback(async (): Promise<AdminUserApiRecord[]> => {
        setLoading(true);
        setError(null);
        try {
            const { items, total: t } = await fetchAdminUsers({ page: page - 1, size: PAGE_SIZE });
            setAdminUsers(items);
            setRows(items.map(mapAdminUserToStudentRow));
            setTotal(t);
            return items;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được danh sách học viên.');
            setAdminUsers([]);
            setRows([]);
            setTotal(0);
            return [];
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleStatus = async (row: StudentTableRow, next: 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION') => {
        setActionLoading(row.id);
        try {
            await patchAdminUserStatus(row.id, next);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Cập nhật trạng thái thất bại.');
        } finally {
            setActionLoading(null);
            setOpenActionFor(null);
        }
    };

    const handleDeleteUser = async (row: StudentTableRow) => {
        if (
            !window.confirm(
                `Xóa vĩnh viễn người dùng "${row.fullName}" (${row.email})? Hành động không thể hoàn tác.`
            )
        ) {
            return;
        }
        setActionLoading(row.id);
        try {
            await deleteAdminUser(row.id);
            await load();
            setProfileSelection(null);
            setOpenActionFor(null);
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Xóa người dùng thất bại.');
        } finally {
            setActionLoading(null);
        }
    };

    const displayFrom = rows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
    const displayTo = (page - 1) * PAGE_SIZE + rows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const openProfile = (row: StudentTableRow) => {
        const raw = adminUsers.find((u) => u.id === row.id);
        if (!raw) return;
        setProfileDetailError(null);
        setProfileSelection({ raw, row });
        setProfileDetailLoading(true);
        void fetchAdminUserProfile(row.id)
            .then((fresh) => {
                setProfileSelection((prev) =>
                    prev && prev.raw.id === fresh.id ? { raw: fresh, row: mapAdminUserToStudentRow(fresh) } : prev
                );
            })
            .catch((e) => {
                setProfileDetailError(e instanceof Error ? e.message : 'Không tải được hồ sơ chi tiết.');
            })
            .finally(() => {
                setProfileDetailLoading(false);
            });
    };

    return (
        <BaseAdminLayout>
            {addStudentOpen && (
                <AdminAddStudentModal
                    onClose={() => setAddStudentOpen(false)}
                    onCreated={() => void load()}
                />
            )}
            {profileSelection && (
                <AdminStudentProfileModal
                    raw={profileSelection.raw}
                    row={profileSelection.row}
                    onClose={() => setProfileSelection(null)}
                    onDelete={() => void handleDeleteUser(profileSelection.row)}
                    deletePending={actionLoading === profileSelection.row.id}
                    onSaved={async () => {
                        const items = await load();
                        setProfileSelection((prev) => {
                            if (!prev) return null;
                            const next = items.find((u) => u.id === prev.raw.id);
                            return next ? { raw: next, row: mapAdminUserToStudentRow(next) } : null;
                        });
                    }}
                    profileDetailLoading={profileDetailLoading}
                    profileDetailError={profileDetailError}
                />
            )}
            <section className={styles.studentsHeader}>
                <h1>Hồ sơ học viên</h1>
                <p>Quản lý thông tin tài khoản và theo dõi hoạt động của người dùng.</p>
            </section>

            {error && (
                <section className={styles.studentsFilterCard} style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                    <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                    <button type="button" className={styles.studentsPrimaryBtn} style={{ marginTop: 12 }} onClick={() => void load()}>
                        Thử lại
                    </button>
                </section>
            )}

            <section className={styles.studentsFilterCard}>
                <div className={styles.studentsFilterHead}>
                    <strong>Bộ lọc</strong>
                    <button
                        type="button"
                        className={styles.studentsFilterToggle}
                        onClick={() => setFiltersCollapsed((prev) => !prev)}
                    >
                        {filtersCollapsed ? 'Mở bộ lọc' : 'Thu gọn bộ lọc'}
                    </button>
                </div>
                {!filtersCollapsed && (
                    <div className={styles.studentsFilterBody}>
                        <div className={styles.studentsSortRow}>
                            <span>Sắp xếp theo:</span>
                            <select className={styles.studentsSelect} disabled>
                                <option>Mới nhất</option>
                                <option>Cũ nhất</option>
                            </select>
                            <select className={styles.studentsSelect} disabled>
                                <option>Ngày tham gia</option>
                                <option>Chuỗi học tập</option>
                            </select>
                        </div>

                        <div className={styles.studentsFilterBlock}>
                            <h3>Đối tượng</h3>
                            <div className={styles.studentsChipRow}>
                                <button type="button" className={`${styles.studentsChip} ${styles.studentsChipActive}`}>
                                    Mọi đối tượng
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    Trẻ em
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    Vị thành niên
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    Người lớn
                                </button>
                            </div>
                        </div>

                        <div className={styles.studentsFilterBlock}>
                            <h3>Trạng thái tài khoản</h3>
                            <div className={styles.studentsChipRow}>
                                <button type="button" className={`${styles.studentsChip} ${styles.studentsChipActive}`}>
                                    Tất cả
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    Hoạt động
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    Chờ xác thực
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    Đã khóa
                                </button>
                            </div>
                        </div>

                        <div className={styles.studentsFilterBlock}>
                            <h3>Chuỗi học tập</h3>
                            <div className={styles.studentsChipRow}>
                                <button type="button" className={`${styles.studentsChip} ${styles.studentsChipActive}`}>
                                    Tất cả
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    0 ngày
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    1-7 ngày
                                </button>
                                <button type="button" className={styles.studentsChip} disabled>
                                    +8 ngày
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
                        <input type="text" placeholder="Tìm kiếm theo MSSV, tên..." disabled />
                    </div>

                    <div className={styles.studentsActions}>
                        <button type="button" className={styles.studentsGhostBtn} disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 15V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 9.5L12 6L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Nhập Excel
                        </button>
                        <button type="button" className={styles.studentsGhostBtn} disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 6V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M8.5 11.5L12 15L15.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 16.75V18.25H18.75V16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Xuất Excel
                        </button>
                        <button type="button" className={styles.studentsPrimaryBtn} onClick={() => setAddStudentOpen(true)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Thêm học viên
                        </button>
                    </div>
                </div>

                {loading && (
                    <AdminTableSkeleton
                        columns={[
                            { key: 'sel', width: 'w-6' },
                            { key: 'name', width: 'w-56' },
                            { key: 'email', width: 'w-64' },
                            { key: 'joined', width: 'w-28' },
                            { key: 'status', width: 'w-24' },
                            { key: 'act', width: 'w-12' },
                        ]}
                    />
                )}
                {!loading && !error && rows.length === 0 && (
                    <p style={{ padding: '0 24px 16px', color: '#64748b' }}>Chưa có dữ liệu học viên.</p>
                )}

                <div className={styles.studentsTableWrap}>
                    <table className={styles.studentsTable}>
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" aria-label="Chọn tất cả" disabled />
                                </th>
                                <th>
                                    <span className={styles.headCell}>Họ tên</span>
                                </th>
                                <th>
                                    <span className={styles.headCell}>Email</span>
                                </th>
                                <th>
                                    <span className={styles.headCell}>Ngày tham gia</span>
                                </th>
                                <th>
                                    <span className={styles.headCell}>Trạng thái</span>
                                </th>
                                <th>
                                    <span className={styles.headCell}>HĐ</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={`${styles.studentsTableRowClickable}${
                                        openActionFor === row.id ? ` ${styles.studentsTableRowMenuOpen}` : ''
                                    }`}
                                    onClick={() => openProfile(row)}
                                >
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" aria-label={`Chọn ${row.code}`} disabled />
                                    </td>
                                    <td className={styles.studentsName}>{row.fullName}</td>
                                    <td>{row.email}</td>
                                    <td>{row.joinedAt}</td>
                                    <td>
                                        <span className={`${styles.studentStatusPill} ${statusClass(row.status)}`}>{row.status}</span>
                                    </td>
                                    <td className={styles.studentsActionCell} onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            className={styles.studentsMoreBtn}
                                            onClick={() => setOpenActionFor((prev) => (prev === row.id ? null : row.id))}
                                            aria-label={`Thao tác ${row.code}`}
                                            disabled={!!actionLoading}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <circle cx="12" cy="5" r="1.7" fill="currentColor" />
                                                <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                                                <circle cx="12" cy="19" r="1.7" fill="currentColor" />
                                            </svg>
                                        </button>
                                        {openActionFor === row.id && (
                                            <div className={styles.studentsMenu}>
                                                {row.status !== 'Đã khóa' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleStatus(row, 'LOCKED')}
                                                        disabled={actionLoading === row.id}
                                                    >
                                                        Khóa tài khoản
                                                    </button>
                                                )}
                                                {row.status === 'Đã khóa' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleStatus(row, 'ACTIVE')}
                                                        disabled={actionLoading === row.id}
                                                    >
                                                        Mở khóa
                                                    </button>
                                                )}
                                                {row.status === 'Chưa xác thực' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleStatus(row, 'ACTIVE')}
                                                        disabled={actionLoading === row.id}
                                                    >
                                                        Kích hoạt (đã xác thực)
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className={styles.studentsDeleteBtn}
                                                    onClick={() => void handleDeleteUser(row)}
                                                    disabled={actionLoading === row.id}
                                                >
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
                    <p>
                        Hiển thị{' '}
                        <b>
                            {displayFrom}-{displayTo}
                        </b>{' '}
                        trong tổng số <b>{total}</b> người dùng
                    </p>
                    <div className={styles.studentsPageControls}>
                        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                            Trước
                        </button>
                        <button type="button" className={styles.studentsPageActive}>
                            {page}
                        </button>
                        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                            Sau
                        </button>
                    </div>
                </div>
            </section>
        </BaseAdminLayout>
    );
};
