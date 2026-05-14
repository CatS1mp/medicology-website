'use client';

import React, { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { createAdminStudent, type AdminCreateStudentPayload } from '@/shared/api/admin-users';

export type AdminAddStudentModalProps = {
    onClose: () => void;
    onCreated: () => void;
};

export const AdminAddStudentModal: React.FC<AdminAddStudentModalProps> = ({ onClose, onCreated }) => {
    const [fullName, setFullName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const audience = '';
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        const fn = fullName.trim();
        const em = email.trim();
        const un = username.trim();
        if (!fn) {
            setFormError('Vui lòng nhập họ và tên.');
            return;
        }
        if (!em) {
            setFormError('Vui lòng nhập email.');
            return;
        }
        if (!un) {
            setFormError('Vui lòng nhập username.');
            return;
        }

        const payload: AdminCreateStudentPayload = {
            fullName: fn,
            email: em,
            username: un,
            password: password.trim() || undefined,
            dateOfBirth: dateOfBirth || undefined,
            phone: phone.trim() || undefined,
            targetAudience: audience || undefined,
        };

        setSubmitting(true);
        try {
            await createAdminStudent(payload);
            onCreated();
            onClose();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Không tạo được tài khoản.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.addStudentBackdrop} role="presentation" onClick={onClose}>
            <div
                className={styles.addStudentModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-student-title"
                onClick={(ev) => ev.stopPropagation()}
            >
                <button type="button" className={styles.addStudentClose} onClick={onClose} aria-label="Đóng">
                    ×
                </button>

                <div className={styles.addStudentHeader}>
                    <h2 id="add-student-title" className={styles.addStudentTitle}>
                        Thêm học viên mới
                    </h2>
                    <p className={styles.addStudentSubtitle}>Nhập đầy đủ thông tin để tạo tài khoản Medicology</p>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)}>
                    <p className={styles.addStudentRequiredNote}>* Các trường bắt buộc</p>
                    {formError && <p className={styles.addStudentFormError}>{formError}</p>}

                    <div className={styles.addStudentGrid}>
                        <div className={styles.addStudentColumn}>
                            <h3 className={styles.addStudentSectionTitle}>
                                <span className={styles.addStudentSectionIcon} aria-hidden>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 1116 0"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                                Thông tin cá nhân
                            </h3>

                            <label className={styles.addStudentLabel}>
                                Họ và tên *
                                <input
                                    type="text"
                                    className={styles.addStudentInput}
                                    placeholder="Nguyễn Văn A"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    autoComplete="name"
                                />
                            </label>

                            <label className={styles.addStudentLabel}>
                                Ngày sinh
                                <input
                                    type="date"
                                    className={styles.addStudentInput}
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                />
                            </label>

                            <label className={styles.addStudentLabel}>
                                Số điện thoại
                                <span className={styles.addStudentInputIconWrap}>
                                    <input
                                        type="tel"
                                        className={styles.addStudentInput}
                                        placeholder="09xx xxx xxx"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        autoComplete="tel"
                                    />
                                    <span className={styles.addStudentInputIcon} aria-hidden>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M5 4h3l2 5-2 1a12 12 0 006 6l1-2 5 2v3a2 2 0 01-2.2 2C9.5 18 4 12.5 4 5.2 4 4 5 4z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </span>
                            </label>
                        </div>

                        <div className={styles.addStudentColumn}>
                            <h3 className={styles.addStudentSectionTitle}>
                                <span className={styles.addStudentSectionIcon} aria-hidden>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                                        <path
                                            d="M5 20a7 7 0 0114 0"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                                Thông tin tài khoản
                            </h3>

                            <label className={styles.addStudentLabel}>
                                Email *
                                <span className={styles.addStudentInputIconWrap}>
                                    <input
                                        type="email"
                                        className={styles.addStudentInput}
                                        placeholder="example@medicology.vn"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                    />
                                    <span className={styles.addStudentInputIcon} aria-hidden>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M4 6h16v12H4V6z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinejoin="round"
                                            />
                                            <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                </span>
                            </label>

                            <div className={styles.addStudentRow2}>
                                <label className={styles.addStudentLabel}>
                                    Username *
                                    <input
                                        type="text"
                                        className={styles.addStudentInput}
                                        placeholder="user123"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoComplete="username"
                                    />
                                </label>
                                <label className={styles.addStudentLabel}>
                                    Mật khẩu
                                    <span className={styles.addStudentInputIconWrap}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className={styles.addStudentInput}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className={styles.addStudentPwToggle}
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            {showPassword ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                    <path
                                                        d="M3 3l18 18M10.5 10.5a3 3 0 004 4M9.5 5.5A10 10 0 0112 5c4 0 7.5 3 9 7-1 2.5-2.5 4.5-4.5 6"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                    />
                                                    <path
                                                        d="M6.5 6.5C4.5 8 3 10 2 12c2 5 7 8 10 8 1.5 0 3-.5 4.5-1.5"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                    <path
                                                        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                    />
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                                                </svg>
                                            )}
                                        </button>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={styles.addStudentFooter}>
                        <button type="button" className={styles.addStudentBtnCancel} onClick={onClose} disabled={submitting}>
                            Hủy
                        </button>
                        <button type="submit" className={styles.addStudentBtnSubmit} disabled={submitting}>
                            <span aria-hidden>+</span> {submitting ? 'Đang thêm…' : 'Thêm học viên'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
