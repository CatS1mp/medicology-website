'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '../admin.module.css';
import { adminCreateCourse } from '@/shared/api/admin-learning';

export type AdminAddCourseModalProps = {
    onClose: () => void;
    onCreated: () => void;
};

const DESC_MAX = 1000;
const DEFAULT_COLOR = '#1cb0f6';

function slugifyName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

type Audience = 'CHILD' | 'TEEN' | 'ADULT';
type ContentRating = 'General' | 'Teen' | 'Adult';

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
    { value: 'CHILD', label: 'Trẻ em' },
    { value: 'TEEN', label: 'Vị thành niên' },
    { value: 'ADULT', label: 'Người lớn' },
];

const RATING_OPTIONS: ContentRating[] = ['General', 'Teen', 'Adult'];

export const AdminAddCourseModal: React.FC<AdminAddCourseModalProps> = ({ onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugLocked, setSlugLocked] = useState(true);
    const [description, setDescription] = useState('');
    const [colorCode, setColorCode] = useState(DEFAULT_COLOR);
    const [orderIndex, setOrderIndex] = useState(5);
    const [audience, setAudience] = useState<Audience>('CHILD');
    const [contentRating, setContentRating] = useState<ContentRating>('General');
    const [iconFileName, setIconFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const colorPickerValue = /^#[0-9A-Fa-f]{6}$/.test(colorCode) ? colorCode : DEFAULT_COLOR;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        if (slugLocked) {
            setSlug(slugifyName(name));
        }
    }, [name, slugLocked]);

    const handleFile = (files: FileList | null) => {
        const f = files?.[0];
        if (f) setIconFileName(f.name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        const n = name.trim();
        const s = slug.trim();
        if (!n) {
            setFormError('Vui lòng nhập tên khóa học.');
            return;
        }
        if (!s) {
            setFormError('Vui lòng nhập đường dẫn (slug).');
            return;
        }

        const payload = {
            name: n,
            slug: s,
            description: description.trim() || null,
            iconFileName,
            colorCode: colorCode || null,
            orderIndex,
            targetAudience: audience,
            contentRating,
        };

        setSubmitting(true);
        try {
            await adminCreateCourse(payload);
            onCreated();
            onClose();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Không tạo được khóa học.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.addCourseBackdrop} role="presentation" onClick={onClose}>
            <div
                className={styles.addCourseModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-course-title"
                onClick={(ev) => ev.stopPropagation()}
            >
                <button type="button" className={styles.addCourseClose} onClick={onClose} aria-label="Đóng">
                    ×
                </button>

                <div className={styles.addCourseHeader}>
                    <h2 id="add-course-title" className={styles.addCourseTitle}>
                        Thêm khóa học mới
                    </h2>
                    <p className={styles.addCourseSubtitle}>Nhập các thông tin cơ bản để thiết lập khóa học trên hệ thống</p>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)}>
                    <p className={styles.addCourseRequiredNote}>* Các trường bắt buộc</p>
                    {formError && <p className={styles.addCourseFormError}>{formError}</p>}

                    <div className={styles.addCourseGrid}>
                        <div className={styles.addCourseColLeft}>
                            <h3 className={styles.addCourseSectionTitle}>Thông tin chung</h3>
                            <label className={styles.addStudentLabel}>
                                Tên khóa học *
                                <input
                                    className={styles.addStudentInput}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nhập tên khóa học..."
                                    disabled={submitting}
                                    autoComplete="off"
                                />
                            </label>
                            <label className={styles.addStudentLabel}>
                                Đường dẫn (slug)
                                <div className={styles.addCourseSlugRow}>
                                    <input
                                        className={styles.addStudentInput}
                                        value={slug}
                                        onChange={(e) => {
                                            setSlug(e.target.value);
                                        }}
                                        placeholder="ten-khoa-hoc"
                                        disabled={submitting || slugLocked}
                                        readOnly={slugLocked}
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        className={styles.addCourseSlugLock}
                                        onClick={() => setSlugLocked((v) => !v)}
                                        aria-label={slugLocked ? 'Mở khóa chỉnh slug' : 'Khóa slug tự động'}
                                        title={slugLocked ? 'Chỉnh sửa slug' : 'Gắn theo tên khóa học'}
                                    >
                                        {slugLocked ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                                <path
                                                    d="M7 11V8a5 5 0 0110 0v3M6 11h12v10H6V11z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                                <path
                                                    d="M7 11V8a5 5 0 019.9-1M6 11h12v10H6V11z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </label>
                            <label className={styles.addStudentLabel}>
                                <span className={styles.addCourseDescLabelRow}>
                                    Mô tả khóa học
                                    <span className={styles.addCourseCharCount}>
                                        {description.length} / {DESC_MAX}
                                    </span>
                                </span>
                                <textarea
                                    className={styles.addCourseTextarea}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                                    placeholder="Nhập tóm tắt nội dung khóa học..."
                                    rows={6}
                                    disabled={submitting}
                                />
                            </label>
                        </div>

                        <div className={styles.addCourseColRight}>
                            <h3 className={styles.addCourseSectionTitle}>Phân loại &amp; cấu hình</h3>

                            <div className={styles.addCourseUpload}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className={styles.addCourseFileInput}
                                    onChange={(e) => handleFile(e.target.files)}
                                />
                                <button
                                    type="button"
                                    className={styles.addCourseUploadInner}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={submitting}
                                >
                                    <span className={styles.addCourseUploadIcon} aria-hidden>
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M12 16V8m0 0l3 3m-3-3L9 11M4 17.2V19a2 2 0 002 2h12a2 2 0 002-2v-1.8"
                                                stroke="#94a3b8"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                    <span className={styles.addCourseUploadText}>Kéo thả hoặc nhấn để tải ảnh lên</span>
                                    {iconFileName && (
                                        <span className={styles.addCourseFileName}>{iconFileName}</span>
                                    )}
                                </button>
                            </div>

                            <label className={styles.addStudentLabel}>
                                Màu chủ đạo
                                <div className={styles.addCourseColorRow}>
                                    <input
                                        type="color"
                                        className={styles.addCourseColorPicker}
                                        value={colorPickerValue}
                                        onChange={(e) => setColorCode(e.target.value)}
                                        disabled={submitting}
                                        aria-label="Chọn màu"
                                    />
                                    <input
                                        className={styles.addStudentInput}
                                        value={colorCode}
                                        onChange={(e) => setColorCode(e.target.value)}
                                        placeholder="#1CB0F6"
                                        disabled={submitting}
                                        spellCheck={false}
                                    />
                                </div>
                            </label>

                            <label className={styles.addStudentLabel}>
                                Thứ tự hiển thị
                                <div className={styles.addCourseStepper}>
                                    <button
                                        type="button"
                                        className={styles.addCourseStepBtn}
                                        onClick={() => setOrderIndex((v) => Math.max(0, v - 1))}
                                        disabled={submitting || orderIndex <= 0}
                                        aria-label="Giảm"
                                    >
                                        −
                                    </button>
                                    <span className={styles.addCourseStepValue}>{orderIndex}</span>
                                    <button
                                        type="button"
                                        className={styles.addCourseStepBtn}
                                        onClick={() => setOrderIndex((v) => v + 1)}
                                        disabled={submitting}
                                        aria-label="Tăng"
                                    >
                                        +
                                    </button>
                                </div>
                            </label>

                            <div className={styles.addCourseFieldBlock}>
                                <span className={styles.addCourseFieldLabel}>Đối tượng người dùng *</span>
                                <div className={styles.addCourseSegmentRow} role="group" aria-label="Đối tượng">
                                    {AUDIENCE_OPTIONS.map((o) => (
                                        <button
                                            key={o.value}
                                            type="button"
                                            className={`${styles.addCourseSegment} ${audience === o.value ? styles.addCourseSegmentActive : ''}`}
                                            onClick={() => setAudience(o.value)}
                                            disabled={submitting}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className={styles.addStudentLabel}>
                                Xếp hạng nội dung *
                                <div className={styles.addStudentSelectWrap}>
                                    <select
                                        className={styles.addStudentSelect}
                                        value={contentRating}
                                        onChange={(e) => setContentRating(e.target.value as ContentRating)}
                                        disabled={submitting}
                                    >
                                        {RATING_OPTIONS.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                    <span className={styles.addStudentSelectChevron} aria-hidden>
                                        ▾
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className={styles.addCourseFooter}>
                        <button
                            type="button"
                            className={styles.addStudentBtnCancel}
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button type="submit" className={styles.addCourseBtnSubmit} disabled={submitting}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            {submitting ? 'Đang tạo…' : 'Tạo khóa học'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
