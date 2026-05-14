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
const CROP_RATIO = 4 / 3;

function slugifyName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export const AdminAddCourseModal: React.FC<AdminAddCourseModalProps> = ({ onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugLocked, setSlugLocked] = useState(true);
    const [description, setDescription] = useState('');
    const [colorCode, setColorCode] = useState(DEFAULT_COLOR);

    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [iconFileName, setIconFileName] = useState<string | null>(null);
    const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
    const [frameSize, setFrameSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [renderSize, setRenderSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cropFrameRef = useRef<HTMLDivElement>(null);
    /** Keeps clamp math in sync with latest layout (avoid stale closures while dragging). */
    const cropMetricsRef = useRef({ fw: 0, fh: 0, rw: 0, rh: 0 });
    const dragState = useRef<{
        dragging: boolean;
        pointerId: number;
        startX: number;
        startY: number;
        baseX: number;
        baseY: number;
        frameEl: HTMLDivElement | null;
        cleanup?: () => void;
    }>({
        dragging: false,
        pointerId: -1,
        startX: 0,
        startY: 0,
        baseX: 0,
        baseY: 0,
        frameEl: null,
    });

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

    useEffect(() => {
        return () => {
            if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
        };
    }, [iconPreviewUrl]);

    useEffect(() => {
        const frame = cropFrameRef.current;
        if (!frame) return;

        const updateSize = () => {
            const width = frame.clientWidth;
            const height = Math.round(width / CROP_RATIO);
            setFrameSize({ width, height });
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(frame);
        return () => observer.disconnect();
    }, [iconPreviewUrl]);

    useEffect(() => {
        if (!naturalSize || frameSize.width <= 0 || frameSize.height <= 0) return;

        const scale = Math.max(frameSize.width / naturalSize.width, frameSize.height / naturalSize.height);
        const width = naturalSize.width * scale;
        const height = naturalSize.height * scale;
        setRenderSize({ width, height });
        setOffset({ x: (frameSize.width - width) / 2, y: (frameSize.height - height) / 2 });
    }, [naturalSize, frameSize.width, frameSize.height]);

    useEffect(() => {
        cropMetricsRef.current = {
            fw: frameSize.width,
            fh: frameSize.height,
            rw: renderSize.width,
            rh: renderSize.height,
        };
    }, [frameSize.width, frameSize.height, renderSize.width, renderSize.height]);

    const teardownWindowDragListeners = () => {
        dragState.current.cleanup?.();
        dragState.current.cleanup = undefined;
    };

    useEffect(() => () => teardownWindowDragListeners(), []);

    const clearSelectedImage = () => {
        teardownWindowDragListeners();
        dragState.current.dragging = false;
        if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
        setSourceFile(null);
        setIconFileName(null);
        setIconPreviewUrl(null);
        setNaturalSize(null);
        setRenderSize({ width: 0, height: 0 });
        setOffset({ x: 0, y: 0 });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFile = (files: FileList | null) => {
        const f = files?.[0];
        if (!f) return;

        const objectUrl = URL.createObjectURL(f);
        const image = new Image();
        image.onload = () => {
            if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
            setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
            setSourceFile(f);
            setIconFileName(f.name);
            setIconPreviewUrl(objectUrl);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            setFormError('Ảnh không hợp lệ. Vui lòng chọn file ảnh khác.');
        };
        image.src = objectUrl;
    };

    const clampOffsetFromRefs = (x: number, y: number) => {
        const { fw, fh, rw, rh } = cropMetricsRef.current;
        if (fw <= 0 || fh <= 0 || rw <= 0 || rh <= 0) {
            return { x: 0, y: 0 };
        }
        const minX = fw - rw;
        const minY = fh - rh;
        return { x: clamp(x, minX, 0), y: clamp(y, minY, 0) };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!iconPreviewUrl) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        teardownWindowDragListeners();
        e.preventDefault();

        const frameEl = e.currentTarget;
        dragState.current = {
            dragging: true,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            baseX: offset.x,
            baseY: offset.y,
            frameEl,
            cleanup: undefined,
        };

        frameEl.setPointerCapture(e.pointerId);

        const onMove = (ev: PointerEvent) => {
            if (!dragState.current.dragging || ev.pointerId !== dragState.current.pointerId) return;
            ev.preventDefault();
            const dx = ev.clientX - dragState.current.startX;
            const dy = ev.clientY - dragState.current.startY;
            setOffset(clampOffsetFromRefs(dragState.current.baseX + dx, dragState.current.baseY + dy));
        };

        const onUp = (ev: PointerEvent) => {
            if (ev.pointerId !== dragState.current.pointerId) return;
            dragState.current.dragging = false;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            dragState.current.cleanup = undefined;

            const el = dragState.current.frameEl;
            dragState.current.frameEl = null;
            if (el) {
                try {
                    el.releasePointerCapture(ev.pointerId);
                } catch {
                    // no-op
                }
            }
        };

        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        dragState.current.cleanup = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    };

    const buildCroppedFile = async (file: File): Promise<File> => {
        if (!naturalSize || frameSize.width <= 0 || frameSize.height <= 0 || renderSize.width <= 0 || renderSize.height <= 0) {
            throw new Error('Không xác định được vùng cắt ảnh.');
        }

        const canvas = document.createElement('canvas');
        canvas.width = frameSize.width;
        canvas.height = frameSize.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Không khởi tạo được canvas để cắt ảnh.');

        const image = new Image();
        const srcUrl = URL.createObjectURL(file);
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Không đọc được ảnh để cắt.'));
            image.src = srcUrl;
        });

        const safeOffset = clampOffsetFromRefs(offset.x, offset.y);
        ctx.drawImage(image, safeOffset.x, safeOffset.y, renderSize.width, renderSize.height);
        URL.revokeObjectURL(srcUrl);

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((result) => {
                if (!result) {
                    reject(new Error('Không thể tạo ảnh đã cắt.'));
                    return;
                }
                resolve(result);
            }, file.type || 'image/jpeg', 0.92);
        });

        const ratio = canvas.width / canvas.height;
        if (Math.abs(ratio - CROP_RATIO) > 0.01) {
            throw new Error('Ảnh cắt chưa đúng tỷ lệ 4:3.');
        }

        const dotIndex = file.name.lastIndexOf('.');
        const baseName = dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name;
        const extension = dotIndex > 0 ? file.name.slice(dotIndex) : '.jpg';
        return new File([blob], `${baseName}-4x3${extension}`, {
            type: blob.type || file.type,
            lastModified: Date.now(),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        const n = name.trim();
        const s = slug.trim();

        if (!n) return setFormError('Vui lòng nhập tên khóa học.');
        if (!s) return setFormError('Vui lòng nhập đường dẫn (slug).');
        if (!sourceFile) return setFormError('Vui lòng chọn ảnh đại diện khóa học.');

        let uploadFile: File;
        try {
            uploadFile = await buildCroppedFile(sourceFile);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Không cắt được ảnh 4:3.');
            return;
        }

        const payload = {
            name: n,
            slug: s,
            description: description.trim() || null,
            iconFile: uploadFile,
            colorCode: colorCode || null,
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
            <div className={styles.addCourseModal} role="dialog" aria-modal="true" aria-labelledby="add-course-title" onClick={(ev) => ev.stopPropagation()}>
                <button type="button" className={styles.addCourseClose} onClick={onClose} aria-label="Đóng">×</button>

                <div className={styles.addCourseHeader}>
                    <h2 id="add-course-title" className={styles.addCourseTitle}>Thêm khóa học mới</h2>
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
                                <input className={styles.addStudentInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên khóa học..." disabled={submitting} autoComplete="off" />
                            </label>
                            <label className={styles.addStudentLabel}>
                                Đường dẫn (slug)
                                <div className={styles.addCourseSlugRow}>
                                    <input
                                        className={styles.addStudentInput}
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
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
                                    >
                                        {slugLocked ? 'Lock' : 'Auto'}
                                    </button>
                                </div>
                            </label>
                            <label className={styles.addStudentLabel}>
                                <span className={styles.addCourseDescLabelRow}>
                                    Mô tả khóa học
                                    <span className={styles.addCourseCharCount}>{description.length} / {DESC_MAX}</span>
                                </span>
                                <textarea className={styles.addCourseTextarea} value={description} onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))} rows={6} disabled={submitting} />
                            </label>
                        </div>

                        <div className={styles.addCourseColRight}>
                            <h3 className={styles.addCourseSectionTitle}>Phân loại &amp; cấu hình</h3>

                            <div className={styles.addCourseUpload}>
                                <input ref={fileInputRef} type="file" accept="image/*" className={styles.addCourseFileInput} onChange={(e) => handleFile(e.target.files)} />

                                {!iconPreviewUrl && (
                                    <button type="button" className={styles.addCourseUploadInner} onClick={() => fileInputRef.current?.click()} disabled={submitting}>
                                        <span className={styles.addCourseUploadIcon} aria-hidden>
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 16V8m0 0l3 3m-3-3L9 11M4 17.2V19a2 2 0 002 2h12a2 2 0 002-2v-1.8" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        <span className={styles.addCourseUploadText}>Nhấn để tải ảnh lên</span>
                                    </button>
                                )}

                                {iconPreviewUrl && (
                                    <div className={styles.addCourseCropBox}>
                                        <button type="button" className={styles.addCourseCropRemove} onClick={clearSelectedImage} aria-label="Bỏ ảnh">×</button>
                                        <div
                                            ref={cropFrameRef}
                                            className={styles.addCourseCropFrame}
                                            onPointerDown={onPointerDown}
                                        >
                                            {/* Using native img intentionally for draggable crop preview */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={iconPreviewUrl}
                                                alt="Course preview"
                                                className={styles.addCourseCropImage}
                                                draggable={false}
                                                style={{
                                                    width: `${renderSize.width}px`,
                                                    height: `${renderSize.height}px`,
                                                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                                                }}
                                            />
                                        </div>
                                        <div className={styles.addCourseCropHint}>Kéo ảnh để chọn vùng cắt theo khung 4:3.</div>
                                        {iconFileName && <span className={styles.addCourseFileName}>{iconFileName}</span>}
                                    </div>
                                )}
                            </div>

                            <label className={styles.addStudentLabel}>
                                Màu chủ đạo
                                <div className={styles.addCourseColorRow}>
                                    <input type="color" className={styles.addCourseColorPicker} value={colorPickerValue} onChange={(e) => setColorCode(e.target.value)} disabled={submitting} aria-label="Chọn màu" />
                                    <input className={styles.addStudentInput} value={colorCode} onChange={(e) => setColorCode(e.target.value)} placeholder="#1CB0F6" disabled={submitting} spellCheck={false} />
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className={styles.addCourseFooter}>
                        <button type="button" className={styles.addStudentBtnCancel} onClick={onClose} disabled={submitting}>Hủy</button>
                        <button type="submit" className={styles.addCourseBtnSubmit} disabled={submitting}>{submitting ? 'Đang tạo…' : 'Tạo khóa học'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
