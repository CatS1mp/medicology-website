'use client';

import React, { useCallback, useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { updateAdminUser } from '@/shared/api/admin-users';
import type { AdminUserApiRecord, StudentTableRow } from '@/shared/types/admin';
import { LazyImage } from '@/shared/components/LazyImage';
import { Skeleton } from '@/shared/components/Skeleton';

export type AdminStudentProfileModalProps = {
    raw: AdminUserApiRecord;
    row: StudentTableRow;
    onClose: () => void;
    onDelete?: () => void;
    deletePending?: boolean;
    onSaved?: () => void | Promise<void>;
    /** True while parent is loading GET /admin/users/:id after row click. */
    profileDetailLoading?: boolean;
    profileDetailError?: string | null;
};

const AUDIENCE_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: '— Không chọn —' },
    { value: 'CHILD', label: 'Trẻ em' },
    { value: 'TEEN', label: 'Vị thành niên' },
    { value: 'ADULT', label: 'Người lớn' },
];

function formatMonthYear(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${m}/${d.getFullYear()}`;
}

function formatDateTimeVi(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN');
}

function displayUsername(raw: AdminUserApiRecord, row: StudentTableRow): string {
    if (raw.username?.trim()) return `@${raw.username.replace(/^@/, '')}`;
    const email = raw.email?.split('@')[0];
    if (email) return `@${email}`;
    return `@${row.code}`;
}

function toInputDate(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

function audienceSelectValue(r: AdminUserApiRecord): string {
    const v = (r.targetAudience ?? r.audience ?? '').trim();
    if (!v) return '';
    const u = v.toUpperCase();
    if (u.includes('CHILD') || u.includes('TRE')) return 'CHILD';
    if (u.includes('TEEN') || u.includes('VỊ')) return 'TEEN';
    if (u.includes('ADULT') || u.includes('NGƯỜI')) return 'ADULT';
    if (['CHILD', 'TEEN', 'ADULT'].includes(v.toUpperCase())) return v.toUpperCase();
    return '';
}

function usernameFieldValue(raw: AdminUserApiRecord, row: StudentTableRow): string {
    if (raw.username?.trim()) return raw.username.replace(/^@/, '');
    const email = raw.email?.split('@')[0];
    if (email) return email;
    return row.code;
}

function StatusBadge({ children, variant }: { children: React.ReactNode; variant: 'verified' | 'active' | 'pending' | 'locked' }) {
    const cls =
        variant === 'verified'
            ? styles.studentModalBadgeVerified
            : variant === 'active'
              ? styles.studentModalBadgeActive
              : variant === 'pending'
                ? styles.studentModalBadgePending
                : styles.studentModalBadgeLocked;
    return <span className={cls}>{children}</span>;
}

export const AdminStudentProfileModal: React.FC<AdminStudentProfileModalProps> = ({
    raw,
    row,
    onClose,
    onDelete,
    deletePending,
    onSaved,
    profileDetailLoading = false,
    profileDetailError = null,
}) => {
    const [editing, setEditing] = useState(false);
    const [savePending, setSavePending] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [address, setAddress] = useState('');
    const [bio, setBio] = useState('');
    const [audience, setAudience] = useState('');

    const fillFormFromProps = useCallback(() => {
        setFullName(row.fullName);
        setUsername(usernameFieldValue(raw, row));
        setGender(raw.gender?.trim() ?? '');
        setDateOfBirth(toInputDate(raw.dateOfBirth));
        setAddress(raw.address?.trim() ?? '');
        setBio(raw.bio?.trim() ?? '');
        setAudience(audienceSelectValue(raw));
    }, [raw, row]);

    useEffect(() => {
        setEditing(false);
        setSaveError(null);
    }, [raw.id]);

    useEffect(() => {
        if (!editing) fillFormFromProps();
    }, [editing, fillFormFromProps]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (editing) {
                setEditing(false);
                setSaveError(null);
            } else {
                onClose();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, editing]);

    const beginEdit = () => {
        fillFormFromProps();
        setSaveError(null);
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setSaveError(null);
    };

    const handleSave = async () => {
        const fn = fullName.trim();
        if (!fn) {
            setSaveError('Vui lòng nhập họ và tên.');
            return;
        }
        setSavePending(true);
        setSaveError(null);
        try {
            await updateAdminUser(raw.id, {
                fullName: fn,
                username: username.trim() || undefined,
                gender: gender.trim() || undefined,
                dateOfBirth: dateOfBirth || undefined,
                address: address.trim() || undefined,
                bio: bio.trim() || undefined,
                targetAudience: audience || undefined,
            });
            await onSaved?.();
            setEditing(false);
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Không lưu được hồ sơ.');
        } finally {
            setSavePending(false);
        }
    };

    const verified =
        raw.verified !== false &&
        raw.emailVerified !== false &&
        row.status !== 'Chưa xác thực' &&
        row.status !== 'Đã khóa';
    const statusUi = row.status;
    const streak = row.streak;
    const longest = raw.longestStreakDays ?? streak;
    const joinSource = raw.joinedAt ?? raw.createdAt;
    const emailDisplay = row.email !== '—' ? row.email : (raw.email ?? '');
    const usernameDisplay = raw.username?.trim() || '—';
    const genderDisplay = raw.gender?.trim() || '—';
    const dobDisplay = raw.dateOfBirth
        ? new Date(raw.dateOfBirth).toLocaleDateString('vi-VN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : '—';
    const addressDisplay = raw.address?.trim() || '—';
    const bioDisplay =
        raw.bio?.trim() ||
        'Học viên Medicology — thông tin tiểu sử sẽ hiển thị khi API cung cấp trường bio.';
    const lastAccess = formatDateTimeVi(raw.lastLoginAt);

    const learningRows: { course: string; completed: string; score: string; passed: boolean }[] = [];

    const disableActions = !!deletePending || savePending || profileDetailLoading;

    return (
        <div className={styles.studentModalBackdrop} role="presentation" onClick={onClose}>
            <div
                className={styles.studentModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className={styles.studentModalClose} onClick={onClose} aria-label="Đóng">
                    ×
                </button>

                <div className={styles.studentModalHeader}>
                    <div className={styles.studentModalAvatarWrap}>
                        {raw.avatarUrl ? (
                            <LazyImage src={raw.avatarUrl} alt="" className={styles.studentModalAvatarImg} />
                        ) : (
                            <span className={styles.studentModalAvatarFallback} aria-hidden>
                                {row.fullName.slice(0, 1).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className={styles.studentModalHeaderText}>
                        <div className={styles.studentModalTitleRow}>
                            <h2 id="student-modal-title" className={styles.studentModalName}>
                                {row.fullName}
                            </h2>
                            <div className={styles.studentModalBadges}>
                                {verified ? (
                                    <StatusBadge variant="verified">ĐÃ XÁC MINH</StatusBadge>
                                ) : (
                                    <StatusBadge variant="pending">CHƯA XÁC MINH</StatusBadge>
                                )}
                                {statusUi === 'Hoạt động' && <StatusBadge variant="active">HOẠT ĐỘNG</StatusBadge>}
                                {statusUi === 'Chưa xác thực' && <StatusBadge variant="pending">CHỜ XÁC THỰC</StatusBadge>}
                                {statusUi === 'Đã khóa' && <StatusBadge variant="locked">ĐÃ KHÓA</StatusBadge>}
                            </div>
                        </div>
                        <p className={styles.studentModalUsername}>{displayUsername(raw, row)}</p>
                        <p className={styles.studentModalJoined}>
                            <span className={styles.studentModalJoinedIcon} aria-hidden>
                                📅
                            </span>
                            Tham gia từ {formatMonthYear(joinSource)}
                        </p>
                    </div>
                </div>

                {profileDetailLoading && (
                    <div className={styles.studentModalProfileHint}>
                        <Skeleton className="h-4 w-56 rounded" />
                    </div>
                )}
                {profileDetailError && !profileDetailLoading && (
                    <p className={styles.studentModalProfileWarn}>{profileDetailError} — hiển thị dữ liệu từ danh sách.</p>
                )}

                <div
                    className={`${styles.studentModalBody}${profileDetailLoading ? ` ${styles.studentModalBodyDimmed}` : ''}`}
                >
                    <div className={styles.studentModalCol}>
                        <h3 className={styles.studentModalSectionTitle}>Thông tin liên hệ & cá nhân</h3>
                        {editing ? (
                            <div className={styles.studentModalEditForm}>
                                {saveError && <p className={styles.studentModalEditError}>{saveError}</p>}
                                <label className={styles.studentModalEditLabel}>
                                    Họ và tên *
                                    <input
                                        className={styles.studentModalEditInput}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={savePending}
                                        autoComplete="name"
                                    />
                                </label>
                                <label className={styles.studentModalEditLabel}>
                                    Email
                                    <input
                                        className={styles.studentModalEditInput}
                                        type="email"
                                        value={emailDisplay}
                                        readOnly
                                        disabled
                                        tabIndex={-1}
                                        autoComplete="email"
                                        aria-readonly="true"
                                    />
                                </label>
                                <label className={styles.studentModalEditLabel}>
                                    Username
                                    <input
                                        className={styles.studentModalEditInput}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={savePending}
                                        autoComplete="username"
                                    />
                                </label>
                                <label className={styles.studentModalEditLabel}>
                                    Giới tính
                                    <input
                                        className={styles.studentModalEditInput}
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        disabled={savePending}
                                    />
                                </label>
                                <label className={styles.studentModalEditLabel}>
                                    Ngày sinh
                                    <input
                                        className={styles.studentModalEditInput}
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        disabled={savePending}
                                    />
                                </label>
                                <label className={styles.studentModalEditLabel}>
                                    Địa chỉ
                                    <input
                                        className={styles.studentModalEditInput}
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        disabled={savePending}
                                    />
                                </label>
                                <label className={styles.studentModalEditLabel}>
                                    Đối tượng
                                    <select
                                        className={styles.studentModalEditSelect}
                                        value={audience}
                                        onChange={(e) => setAudience(e.target.value)}
                                        disabled={savePending}
                                    >
                                        {AUDIENCE_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        ) : (
                            <ul className={styles.studentModalInfoList}>
                                <li>
                                    <span className={styles.studentModalInfoIcon} aria-hidden>
                                        ✉
                                    </span>
                                    <span>{row.email}</span>
                                </li>
                                <li>
                                    <span className={styles.studentModalInfoIcon} aria-hidden>
                                        👤
                                    </span>
                                    <span>{usernameDisplay}</span>
                                </li>
                                <li>
                                    <span className={styles.studentModalInfoIcon} aria-hidden>
                                        ⚥
                                    </span>
                                    <span>{genderDisplay}</span>
                                </li>
                                <li>
                                    <span className={styles.studentModalInfoIcon} aria-hidden>
                                        🎂
                                    </span>
                                    <span>{dobDisplay}</span>
                                </li>
                                <li>
                                    <span className={styles.studentModalInfoIcon} aria-hidden>
                                        📍
                                    </span>
                                    <span>{addressDisplay}</span>
                                </li>
                            </ul>
                        )}
                    </div>
                    <div className={styles.studentModalCol}>
                        <div className={styles.studentModalStatCards}>
                            <div className={styles.studentModalStatCard}>
                                <span className={styles.studentModalStatLabel}>Chuỗi hiện tại</span>
                                <span className={styles.studentModalStatValue}>
                                    🔥 {streak} ngày
                                </span>
                            </div>
                            <div className={styles.studentModalStatCard}>
                                <span className={styles.studentModalStatLabel}>Kỷ lục dài nhất</span>
                                <span className={styles.studentModalStatValue}>
                                    🏆 {longest} ngày
                                </span>
                            </div>
                        </div>
                        <h3 className={styles.studentModalSectionTitle}>Tiểu sử</h3>
                        {editing ? (
                            <label className={styles.studentModalEditLabel}>
                                <span className={styles.studentModalEditLabelInline}>Nội dung</span>
                                <textarea
                                    className={styles.studentModalEditTextarea}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    disabled={savePending}
                                    rows={5}
                                />
                            </label>
                        ) : (
                            <p className={styles.studentModalBio}>{bioDisplay}</p>
                        )}
                    </div>
                </div>

                <div className={styles.studentModalTableSection}>
                    <h3 className={styles.studentModalSectionTitle}>Kết quả học tập & đánh giá</h3>
                    <div className={styles.studentModalTableWrap}>
                        <table className={styles.studentModalTable}>
                            <thead>
                                <tr>
                                    <th>Khóa học</th>
                                    <th>Ngày hoàn thành</th>
                                    <th>Kết quả (điểm)</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {learningRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className={styles.studentModalTableEmpty}>
                                            Chưa có dữ liệu tiến độ — kết nối API học tập để hiển thị tại đây.
                                        </td>
                                    </tr>
                                ) : (
                                    learningRows.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.course}</td>
                                            <td>{r.completed}</td>
                                            <td className={styles.studentModalScore}>{r.score}</td>
                                            <td>
                                                {r.passed ? (
                                                    <span className={styles.studentModalPassed}>PASSED</span>
                                                ) : (
                                                    <span>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.studentModalFooter}>
                    <p className={styles.studentModalLastAccess}>Truy cập lần cuối: {lastAccess}</p>
                    <div className={styles.studentModalFooterActions}>
                        {onDelete && (
                            <button
                                type="button"
                                className={styles.studentModalBtnDanger}
                                onClick={onDelete}
                                disabled={disableActions}
                            >
                                {deletePending ? 'Đang xóa…' : 'Xóa người dùng'}
                            </button>
                        )}
                        {editing ? (
                            <>
                                <button
                                    type="button"
                                    className={styles.studentModalBtnGhost}
                                    onClick={cancelEdit}
                                    disabled={savePending}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className={styles.studentModalBtnPrimary}
                                    onClick={() => void handleSave()}
                                    disabled={savePending}
                                >
                                    {savePending ? 'Đang lưu…' : 'Lưu thay đổi'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" className={styles.studentModalBtnGhost} onClick={onClose}>
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    className={styles.studentModalBtnPrimary}
                                    onClick={beginEdit}
                                    disabled={disableActions}
                                >
                                    Chỉnh sửa hồ sơ
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
