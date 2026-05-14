'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';
import {
    adminCreateContent,
    adminCreateSection,
    adminDeleteContent,
    adminDeleteSection,
    adminGetCourse,
    adminListCourses,
    adminListSections,
    adminListContents,
    adminPatchCourseActive,
    adminPatchContentStatus,
    adminUpdateCourse,
    adminUpdateContent,
    adminUpdateSection,
} from '@/shared/api/admin-learning';
import type { ContentResponse, CourseResponse, SectionResponse } from '@/shared/types/learning';
import { Skeleton } from '@/shared/components/Skeleton';

const SECTION_PROGRESS_TARGET = 20;

function slugifyName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function countQuizBlocks(content: ContentResponse): number {
    return content.blocks?.filter((b) => b.isGradable || b.kind === 'QUIZ_MCQ').length ?? 0;
}

type CurriculumItem = { kind: 'content'; content: ContentResponse };

type SectionBundle = {
    section: SectionResponse;
    contents: ContentResponse[];
};

function buildCurriculumItems(bundle: SectionBundle): CurriculumItem[] {
    return bundle.contents.map((content) => ({ kind: 'content', content }));
}

function sectionPublished(bundle: SectionBundle): boolean {
    if (bundle.contents.length === 0) return false;
    return bundle.contents.every((c) => c.isActive);
}

async function loadSectionBundles(courseId: string): Promise<SectionBundle[]> {
    const sections = (await adminListSections(courseId)).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    return Promise.all(
        sections.map(async (section) => {
            const contents = (await adminListContents(section.id)).slice().sort((a, b) => a.orderIndex - b.orderIndex);
            return {
                section,
                contents,
            };
        })
    );
}

async function resolveCourse(courseId: string): Promise<CourseResponse> {
    try {
        return await adminGetCourse(courseId);
    } catch {
        const all = await adminListCourses();
        const c = all.find((x) => x.id === courseId);
        if (!c) throw new Error('Không tìm thấy khóa học.');
        return c;
    }
}

type CourseInfoModalProps = {
    course: CourseResponse;
    onClose: () => void;
    onSaved: (c: CourseResponse) => void;
};

const CourseInfoModal: React.FC<CourseInfoModalProps> = ({ course, onClose, onSaved }) => {
    const [name, setName] = useState(course.name);
    const [slug, setSlug] = useState(course.slug);
    const [description, setDescription] = useState(course.description ?? '');
    const [colorCode, setColorCode] = useState(course.colorCode ?? '#1cb0f6');
    const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>(course.isActive ? 'PUBLISHED' : 'DRAFT');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        const n = name.trim();
        if (!n) {
            setErr('Vui lòng nhập tên khóa học.');
            return;
        }
        setSaving(true);
        try {
            const updated = await adminUpdateCourse(course.id, {
                name: n,
                slug: slug.trim() || course.slug,
                description: description.trim() || null,
                colorCode: colorCode || null,
                isActive: status === 'PUBLISHED',
                orderIndex: course.orderIndex,
            });
            onSaved(updated);
            onClose();
        } catch (er) {
            setErr(er instanceof Error ? er.message : 'Không lưu được.');
        } finally {
            setSaving(false);
        }
    };

    const colorPicker = /^#[0-9A-Fa-f]{6}$/.test(colorCode) ? colorCode : '#1cb0f6';

    return (
        <div className={styles.curriculumMetaBackdrop} role="presentation" onClick={onClose}>
            <div
                className={styles.curriculumMetaModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="course-meta-title"
                onClick={(ev) => ev.stopPropagation()}
            >
                <h2 id="course-meta-title" className={styles.curriculumMetaTitle}>
                    Thông tin khóa học
                </h2>
                <p className={styles.curriculumMetaSubtitle}>Hiển thị thông tin và cấu hình của khóa học trên hệ thống</p>
                <form onSubmit={(e) => void handleSave(e)}>
                    <div className={styles.curriculumMetaGrid}>
                        <div className={styles.curriculumMetaCol}>
                            <h3 className={styles.curriculumMetaGroupTitle}>Thông tin chung</h3>
                            <label className={styles.curriculumField}>
                                <span>Tên khóa học</span>
                                <input value={name} onChange={(e) => setName(e.target.value)} className={styles.curriculumInput} />
                            </label>
                            <label className={styles.curriculumField}>
                                <span>Đường dẫn (Slug)</span>
                                <input value={slug} onChange={(e) => setSlug(e.target.value)} className={styles.curriculumInput} />
                            </label>
                            <label className={styles.curriculumField}>
                                <span className={styles.curriculumLabelRow}>
                                    <span>Mô tả khóa học</span>
                                    <span>{description.length} / 1000</span>
                                </span>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                                    className={styles.curriculumTextarea}
                                    rows={7}
                                />
                            </label>
                        </div>
                        <div className={styles.curriculumMetaColTone}>
                            <h3 className={styles.curriculumMetaGroupTitle}>Phân loại & cấu hình</h3>
                            <div className={styles.curriculumImagePreview} />
                            <label className={styles.curriculumField}>
                                <span>Màu chủ đạo</span>
                                <span className={styles.curriculumColorRow}>
                                    <input
                                        type="color"
                                        value={colorPicker}
                                        onChange={(e) => setColorCode(e.target.value)}
                                        className={styles.curriculumColorPicker}
                                    />
                                    <input
                                        value={colorCode}
                                        onChange={(e) => setColorCode(e.target.value)}
                                        className={styles.curriculumInput}
                                        spellCheck={false}
                                    />
                                </span>
                            </label>
                            <div className={styles.curriculumField}>
                                <span>Trạng thái hiển thị</span>
                                <div className={styles.curriculumSegment}>
                                    <button
                                        type="button"
                                        className={status === 'PUBLISHED' ? styles.curriculumSegmentActive : ''}
                                        onClick={() => setStatus('PUBLISHED')}
                                    >
                                        Đã đăng tải
                                    </button>
                                    <button
                                        type="button"
                                        className={status === 'DRAFT' ? styles.curriculumSegmentActive : ''}
                                        onClick={() => setStatus('DRAFT')}
                                    >
                                        Bản nháp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {err && <p className={styles.curriculumFormError}>{err}</p>}
                    <div className={styles.curriculumMetaActions}>
                        <button type="button" className={styles.curriculumBtnGhost} onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className={styles.curriculumBtnPrimary} disabled={saving}>
                            {saving ? 'Đang lưu…' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type SectionEditorState = {
    sectionId?: string;
    name: string;
    durationMinutes: number;
};

type SectionEditorDialogProps = {
    initialState: SectionEditorState;
    onClose: () => void;
    onSubmit: (state: SectionEditorState) => Promise<void>;
};

const SectionEditorDialog: React.FC<SectionEditorDialogProps> = ({ initialState, onClose, onSubmit }) => {
    const [form, setForm] = useState(initialState);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim()) {
            setError('Vui lòng nhập tên section.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onSubmit({ ...form, name: form.name.trim() });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không thể lưu section.');
            setSaving(false);
        }
    };

    return (
        <div className={styles.curriculumMetaBackdrop} role="presentation" onClick={onClose}>
            <div className={styles.curriculumMetaModalWide} onClick={(ev) => ev.stopPropagation()}>
                <h2 className={styles.curriculumMetaTitle}>Thêm phần học mới</h2>
                <p className={styles.curriculumMetaSubtitle}>Nhập các thông tin cần có để thiết lập phần học trên hệ thống</p>
                <form onSubmit={(event) => void handleSubmit(event)}>
                    <label className={styles.curriculumField}>
                        <span>Tên section *</span>
                        <input
                            className={styles.curriculumInput}
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="Ví dụ: Kỹ năng xử lý vết thương hở"
                        />
                    </label>
                    <div className={styles.curriculumMetaGridTwo}>
                        <label className={styles.curriculumField}>
                            <span>Thời lượng (phút)</span>
                            <input
                                type="number"
                                min={1}
                                className={styles.curriculumInput}
                                value={form.durationMinutes}
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, durationMinutes: Number(event.target.value) || 1 }))
                                }
                            />
                        </label>
                    </div>
                    {error && <p className={styles.curriculumFormError}>{error}</p>}
                    <div className={styles.curriculumMetaActions}>
                        <button type="button" className={styles.curriculumBtnGhost} onClick={onClose} disabled={saving}>
                            Hủy bỏ
                        </button>
                        <button type="submit" className={styles.curriculumBtnPrimary} disabled={saving}>
                            {saving ? 'Đang lưu…' : 'Lưu Section'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type AddLessonDialogProps = {
    onClose: () => void;
    onSubmit: (payload: { name: string; estimatedDurationMinutes: number; mode: 'lesson' | 'exercise' }) => Promise<void>;
};

const AddLessonDialog: React.FC<AddLessonDialogProps> = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [duration, setDuration] = useState(8);
    const [mode, setMode] = useState<'lesson' | 'exercise'>('lesson');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim()) {
            setError('Vui lòng nhập tên bài học/bài tập.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onSubmit({ name: name.trim(), estimatedDurationMinutes: duration, mode });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không thể tạo mới.');
            setSaving(false);
        }
    };

    return (
        <div className={styles.curriculumMetaBackdrop} role="presentation" onClick={onClose}>
            <div className={styles.curriculumMetaModalWide} onClick={(ev) => ev.stopPropagation()}>
                <h2 className={styles.curriculumMetaTitle}>Thêm thẻ mới</h2>
                <p className={styles.curriculumMetaSubtitle}>Chọn loại thẻ nội dung thay vì gõ lệnh chèn khối.</p>
                <form onSubmit={(event) => void submit(event)}>
                    <div className={styles.curriculumMiniCards}>
                        <button
                            type="button"
                            className={`${styles.curriculumMiniCard} ${mode === 'lesson' ? styles.curriculumMiniCardActive : ''}`}
                            onClick={() => setMode('lesson')}
                        >
                            Bài học
                        </button>
                        <button
                            type="button"
                            className={`${styles.curriculumMiniCard} ${mode === 'exercise' ? styles.curriculumMiniCardActive : ''}`}
                            onClick={() => setMode('exercise')}
                        >
                            Bài tập
                        </button>
                    </div>
                    <label className={styles.curriculumField}>
                        <span>Tên hiển thị</span>
                        <input className={styles.curriculumInput} value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label className={styles.curriculumField}>
                        <span>Thời lượng (phút)</span>
                        <input
                            type="number"
                            min={1}
                            className={styles.curriculumInput}
                            value={duration}
                            onChange={(event) => setDuration(Number(event.target.value) || 1)}
                        />
                    </label>
                    {mode === 'exercise' && (
                        <p className={styles.curriculumMuted}>
                            Bài tập sẽ dùng cùng layout với bài học và có thể gắn câu hỏi ở bước chỉnh sửa nội dung.
                        </p>
                    )}
                    {error && <p className={styles.curriculumFormError}>{error}</p>}
                    <div className={styles.curriculumMetaActions}>
                        <button type="button" className={styles.curriculumBtnGhost} onClick={onClose} disabled={saving}>
                            Hủy
                        </button>
                        <button type="submit" className={styles.curriculumBtnPrimary} disabled={saving}>
                            {saving ? 'Đang tạo…' : 'Lưu thẻ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type ConfirmDialogProps = {
    title: string;
    description: string;
    note: string;
    confirmLabel: string;
    danger?: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    description,
    note,
    confirmLabel,
    danger = false,
    onClose,
    onConfirm,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    return (
        <div className={styles.curriculumMetaBackdrop} role="presentation" onClick={onClose}>
            <div className={styles.curriculumConfirmModal} onClick={(ev) => ev.stopPropagation()}>
                <h2 className={styles.curriculumMetaTitle}>{title}</h2>
                <p className={styles.curriculumConfirmText}>{description}</p>
                <p className={danger ? styles.curriculumConfirmWarn : styles.curriculumConfirmInfo}>{note}</p>
                {error && <p className={styles.curriculumFormError}>{error}</p>}
                <div className={styles.curriculumMetaActions}>
                    <button type="button" className={styles.curriculumBtnGhost} disabled={loading} onClick={onClose}>
                        Hủy
                    </button>
                    <button
                        type="button"
                        className={danger ? styles.curriculumBtnDanger : styles.curriculumBtnPrimary}
                        disabled={loading}
                        onClick={() => {
                            setLoading(true);
                            Promise.resolve(onConfirm())
                                .then(() => onClose())
                                .catch((e) => {
                                    setError(e instanceof Error ? e.message : 'Thao tác thất bại.');
                                    setLoading(false);
                                });
                        }}
                    >
                        {loading ? 'Đang xử lý…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AdminCourseCurriculumScreen: React.FC = () => {
    const params = useParams();
    const courseId = String(params?.courseId ?? '');
    const router = useRouter();

    const [course, setCourse] = useState<CourseResponse | null>(null);
    const [bundles, setBundles] = useState<SectionBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [infoOpen, setInfoOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [sectionEditor, setSectionEditor] = useState<SectionEditorState | null>(null);
    const [addingLessonSectionId, setAddingLessonSectionId] = useState<string | null>(null);
    const [deletingLesson, setDeletingLesson] = useState<ContentResponse | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const load = useCallback(async () => {
        if (!courseId) {
            setError('Thiếu mã khóa học trên URL.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const c = await resolveCourse(courseId);
            setCourse(c);
            const b = await loadSectionBundles(courseId);
            setBundles(b);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được chương trình.');
            setCourse(null);
            setBundles([]);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpenMenu(null);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const sectionCount = bundles.length;
    const progressPct = Math.min(100, (sectionCount / SECTION_PROGRESS_TARGET) * 100);

    const publishCourse = async () => {
        if (!courseId || !course) return;
        setPublishing(true);
        try {
            try {
                await adminPatchCourseActive(courseId, true);
            } catch {
                await Promise.all(
                    bundles.flatMap((b) => b.contents.map((c) => adminPatchContentStatus(c.id, true)))
                );
            }
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Đăng tải thất bại.');
        } finally {
            setPublishing(false);
        }
    };

    const reorderSections = async (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= bundles.length || to >= bundles.length) return;
        const next = bundles.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setBundles(next);
        try {
            await Promise.all(
                next.map((b, idx) =>
                    adminUpdateSection(b.section.id, {
                        themeId: b.section.courseId,
                        name: b.section.name,
                        slug: b.section.slug,
                        orderIndex: idx,
                        estimatedDurationMinutes: b.section.estimatedDurationMinutes,
                    })
                )
            );
        } catch {
            window.alert('Không sắp xếp lại phần học được.');
            await load();
        }
    };

    const reorderContents = async (sectionId: string, from: number, to: number, list: ContentResponse[]) => {
        if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
        const next = list.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        const bundleIdx = bundles.findIndex((b) => b.section.id === sectionId);
        if (bundleIdx < 0) return;
        const copy = bundles.slice();
        copy[bundleIdx] = { ...copy[bundleIdx], contents: next };
        setBundles(copy);
        try {
            await Promise.all(next.map((c, idx) => adminUpdateContent(c.id, { orderIndex: idx })));
        } catch {
            window.alert('Không sắp xếp lại bài học được.');
            await load();
        }
    };

    const addSection = async (state: SectionEditorState) => {
        const slug = slugifyName(state.name);
        if (!slug) {
            window.alert('Slug không hợp lệ.');
            return;
        }
        try {
            await adminCreateSection(courseId, {
                name: state.name.trim(),
                slug,
                orderIndex: bundles.length,
                estimatedDurationMinutes: state.durationMinutes,
            });
            setSectionEditor(null);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Không tạo được phần học.');
            throw e;
        }
    };

    const editSection = async (section: SectionResponse, state: SectionEditorState) => {
        const s = slugifyName(state.name);
        try {
            await adminUpdateSection(section.id, {
                themeId: section.courseId,
                name: state.name.trim(),
                slug: s || section.slug,
                orderIndex: section.orderIndex,
                estimatedDurationMinutes: state.durationMinutes,
            });
            setSectionEditor(null);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Cập nhật thất bại.');
            throw e;
        }
    };

    const removeSection = async (section: SectionResponse) => {
        if (!window.confirm(`Xóa phần "${section.name}" và nội dung liên quan?`)) return;
        try {
            await adminDeleteSection(section.id);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Xóa thất bại.');
        }
    };

    const addLesson = async (
        sectionId: string,
        payload: { name: string; estimatedDurationMinutes: number; mode: 'lesson' | 'exercise' }
    ) => {
        const lessonName = payload.mode === 'exercise' ? `${payload.name} (Bài tập)` : payload.name;
        const slug = slugifyName(lessonName);
        if (!slug) {
            window.alert('Slug không hợp lệ.');
            return;
        }
        const bundle = bundles.find((b) => b.section.id === sectionId);
        const orderIndex = bundle?.contents.length ?? 0;
        try {
            await adminCreateContent({
                sectionId,
                name: lessonName,
                slug,
                orderIndex,
                estimatedDurationMinutes: payload.estimatedDurationMinutes,
                difficultyLevel: payload.mode === 'exercise' ? 'INTERMEDIATE' : null,
            });
            setAddingLessonSectionId(null);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Không tạo được bài học.');
            throw e;
        }
    };

    const deleteLesson = async (lesson: ContentResponse) => {
        try {
            await adminDeleteContent(lesson.id);
            setDeletingLesson(null);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Xóa thất bại.');
            throw e;
        }
    };

    const toggleCollapsed = (id: string) => {
        setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const headerCourse = course;

    return (
        <BaseAdminLayout>
            {infoOpen && headerCourse && (
                <CourseInfoModal
                    course={headerCourse}
                    onClose={() => setInfoOpen(false)}
                    onSaved={(c) => setCourse(c)}
                />
            )}
            {publishDialogOpen && headerCourse && (
                <ConfirmDialog
                    title="Xác nhận xuất bản khóa học?"
                    description={`Bạn chuẩn bị xuất bản khóa học [${headerCourse.name}]`}
                    note={`Hệ thống phát hiện có ${bundles.filter((b) => b.contents.length === 0).length} phần học đang trống nội dung.`}
                    confirmLabel="Xuất bản"
                    onClose={() => setPublishDialogOpen(false)}
                    onConfirm={publishCourse}
                />
            )}
            {deletingLesson && (
                <ConfirmDialog
                    title="Xác nhận xóa bài học"
                    description={`Bạn có chắc chắn muốn xóa bài học [${deletingLesson.name}] không?`}
                    note="Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu liên quan và không thể hoàn tác."
                    confirmLabel="Xóa phần học"
                    danger
                    onClose={() => setDeletingLesson(null)}
                    onConfirm={() => deleteLesson(deletingLesson)}
                />
            )}
            {sectionEditor && (
                <SectionEditorDialog
                    initialState={sectionEditor}
                    onClose={() => setSectionEditor(null)}
                    onSubmit={(state) => {
                        if (state.sectionId) {
                            const section = bundles.find((b) => b.section.id === state.sectionId)?.section;
                            if (!section) return Promise.resolve();
                            return editSection(section, state);
                        }
                        return addSection(state);
                    }}
                />
            )}
            {addingLessonSectionId && (
                <AddLessonDialog
                    onClose={() => setAddingLessonSectionId(null)}
                    onSubmit={({ name, estimatedDurationMinutes, mode }) => {
                        return addLesson(addingLessonSectionId, { name, estimatedDurationMinutes, mode });
                    }}
                />
            )}

            <div className={styles.curriculumPage}>
                <div className={styles.curriculumTop}>
                    <div className={styles.curriculumTopMain}>
                        <button type="button" className={styles.curriculumBack} onClick={() => router.push('/admin/courses')}>
                            ← Danh sách khóa học
                        </button>
                        {headerCourse && (
                            <>
                                <h1 className={styles.curriculumCourseTitle}>
                                    Khoá học: {headerCourse.name}
                                </h1>
                                <div className={styles.curriculumProgressWrap}>
                                    <div className={styles.curriculumProgressTrack}>
                                        <div
                                            className={styles.curriculumProgressFill}
                                            style={{ width: `${progressPct}%` }}
                                        />
                                        <div
                                            className={styles.curriculumProgressKnob}
                                            style={{ left: `calc(${progressPct}% - 10px)` }}
                                        />
                                    </div>
                                    <span className={styles.curriculumProgressLabel}>
                                        {sectionCount} / {SECTION_PROGRESS_TARGET} phần học
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className={styles.curriculumTopActions}>
                        <button
                            type="button"
                            className={styles.curriculumBtnGhost}
                            onClick={() => setInfoOpen(true)}
                            disabled={!headerCourse}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                                <path d="M12 10V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <circle cx="12" cy="7" r="1.2" fill="currentColor" />
                            </svg>
                            Thông tin
                        </button>
                        <button
                            type="button"
                            className={styles.curriculumBtnPublish}
                            onClick={() => setPublishDialogOpen(true)}
                            disabled={!headerCourse || publishing || loading}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M8 19H15C17.2091 19 19 17.2091 19 15C19 12.7909 17.2091 11 15 11H14.5C14.0036 8.71776 12.0156 7 9.63636 7C6.98023 7 4.78525 8.91817 4.27759 11.4279C2.99783 11.8353 2 13.0203 2 14.4C2 16.3882 3.61177 18 5.6 18H8"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M12 15V6M9.5 9.5L12 6L14.5 9.5"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {publishing ? 'Đang đăng…' : 'Đăng tải'}
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-1/3 rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                    </div>
                )}
                {error && (
                    <div className={styles.curriculumErrorBox}>
                        <p>{error}</p>
                        <button type="button" className={styles.curriculumBtnPrimary} onClick={() => void load()}>
                            Thử lại
                        </button>
                    </div>
                )}

                {!loading && !error && headerCourse && (
                    <div className={styles.curriculumList}>
                        {bundles.map((bundle, sectionIndex) => {
                            const { section } = bundle;
                            const items = buildCurriculumItems(bundle);
                            const isCollapsed = collapsed[section.id];
                            return (
                                <section key={section.id} className={styles.curriculumSection}>
                                    <div
                                        className={styles.curriculumSectionHead}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const from = Number(e.dataTransfer.getData('application/curriculum-section'));
                                            if (!Number.isFinite(from)) return;
                                            void reorderSections(from, sectionIndex);
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className={styles.curriculumGrip}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/curriculum-section', String(sectionIndex));
                                                e.dataTransfer.effectAllowed = 'move';
                                            }}
                                            aria-label="Kéo để sắp xếp phần học"
                                        >
                                            <span className={styles.curriculumGripDots} />
                                        </button>
                                        <div className={styles.curriculumSectionHeadText}>
                                            <div className={styles.curriculumSectionTitleRow}>
                                                <h2 className={styles.curriculumSectionTitle}>{section.name}</h2>
                                                <span
                                                    className={
                                                        sectionPublished(bundle)
                                                            ? styles.curriculumBadgePub
                                                            : styles.curriculumBadgeDraft
                                                    }
                                                >
                                                    {sectionPublished(bundle) ? 'Đã đăng tải' : 'Bản nháp'}
                                                </span>
                                                <span className={styles.curriculumBadgeNeutral}>Mọi đối tượng</span>
                                            </div>
                                        </div>
                                        <div className={styles.curriculumSectionTools}>
                                            <button
                                                type="button"
                                                className={styles.curriculumIconBtn}
                                                onClick={() =>
                                                    setSectionEditor({
                                                        sectionId: section.id,
                                                        name: section.name,
                                                        durationMinutes: section.estimatedDurationMinutes ?? 45,
                                                    })
                                                }
                                                aria-label="Sửa phần học"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <path
                                                        d="M4 20H20"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                    />
                                                    <path
                                                        d="M6.75 15.75L15.75 6.75L18.25 9.25L9.25 18.25L6 19L6.75 15.75Z"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.curriculumIconBtn} ${styles.curriculumIconDanger}`}
                                                onClick={() => void removeSection(section)}
                                                aria-label="Xóa phần học"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <path d="M4.5 7.5H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                    <path d="M9.5 4.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                    <path
                                                        d="M8 7.5V19.25H16V7.5"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.curriculumIconBtn}
                                                onClick={() => toggleCollapsed(section.id)}
                                                aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                                            >
                                                <svg
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    aria-hidden="true"
                                                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : undefined }}
                                                >
                                                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {!isCollapsed && (
                                        <div className={styles.curriculumSectionBody}>
                                            <div className={styles.curriculumTreeLine} aria-hidden="true" />
                                            <div className={styles.curriculumItems}>
                                                {items.map((item) => {
                                                    const lesson = item.content;
                                                    const qCount = countQuizBlocks(lesson);
                                                    const dur =
                                                        lesson.estimatedDurationMinutes != null
                                                            ? `${lesson.estimatedDurationMinutes} phút`
                                                            : '—';
                                                    const menuKey = `lesson-${lesson.id}`;
                                                    const lessonIdx = bundle.contents.findIndex((l) => l.id === lesson.id);

                                                    return (
                                                        <div key={lesson.id} className={styles.curriculumRowLesson}>
                                                            <button
                                                                type="button"
                                                                className={styles.curriculumGripSmall}
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    e.dataTransfer.setData('application/curriculum-section-id', section.id);
                                                                    e.dataTransfer.setData(
                                                                        'application/curriculum-lesson-idx',
                                                                        String(Math.max(0, lessonIdx))
                                                                    );
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                }}
                                                                onDragOver={(e) => {
                                                                    e.preventDefault();
                                                                    e.dataTransfer.dropEffect = 'move';
                                                                }}
                                                                onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    const sid = e.dataTransfer.getData('application/curriculum-section-id');
                                                                    const fromIdx = Number(
                                                                        e.dataTransfer.getData('application/curriculum-lesson-idx')
                                                                    );
                                                                    if (sid !== section.id || !Number.isFinite(fromIdx)) return;
                                                                    void reorderContents(section.id, fromIdx, lessonIdx, bundle.contents);
                                                                }}
                                                                aria-label="Kéo để sắp xếp bài học"
                                                            >
                                                                <span className={styles.curriculumGripDots} />
                                                            </button>
                                                            <div className={styles.curriculumRowIconLesson}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                                                    <path
                                                                        d="M8 4H16V8L12 12L16 16V20H8V16L12 12L8 8V4Z"
                                                                        fill="currentColor"
                                                                        opacity="0.9"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div className={styles.curriculumRowMain}>
                                                                <div className={styles.curriculumRowTitle}>{lesson.name}</div>
                                                                <div className={styles.curriculumRowMeta}>
                                                                    <span>{dur}</span>
                                                                    {qCount > 0 && <span>{qCount} câu hỏi</span>}
                                                                    <span
                                                                        className={
                                                                            lesson.isActive
                                                                                ? styles.curriculumBadgePub
                                                                                : styles.curriculumBadgeDraft
                                                                        }
                                                                    >
                                                                        {lesson.isActive ? 'Đã đăng tải' : 'Bản nháp'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className={styles.curriculumRowMenuWrap} ref={openMenu === menuKey ? menuRef : null}>
                                                                <button
                                                                    type="button"
                                                                    className={styles.curriculumRowMore}
                                                                    onClick={() => setOpenMenu((p) => (p === menuKey ? null : menuKey))}
                                                                    aria-label="Thêm thao tác"
                                                                >
                                                                    ⋮
                                                                </button>
                                                                {openMenu === menuKey && (
                                                                    <div className={styles.curriculumRowMenu} role="menu">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenMenu(null);
                                                                                router.push(
                                                                                    `/admin/tests/edit?contentId=${encodeURIComponent(lesson.id)}&courseId=${encodeURIComponent(courseId)}`
                                                                                );
                                                                            }}
                                                                        >
                                                                            Sửa nội dung
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className={styles.curriculumMenuDanger}
                                                                            onClick={() => {
                                                                                setOpenMenu(null);
                                                                                setDeletingLesson(lesson);
                                                                            }}
                                                                        >
                                                                            Xóa bài học
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                <button
                                                    type="button"
                                                    className={styles.curriculumAddItem}
                                                    onClick={() => setAddingLessonSectionId(section.id)}
                                                >
                                                    <span className={styles.curriculumAddPlus}>+</span>
                                                    Thêm bài học/bài tập
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            );
                        })}

                        <button
                            type="button"
                            className={styles.curriculumAddSection}
                            onClick={() => setSectionEditor({ name: '', durationMinutes: 45 })}
                        >
                            <span className={styles.curriculumAddPlus}>+</span>
                            Thêm phần học mới
                        </button>
                    </div>
                )}
            </div>
        </BaseAdminLayout>
    );
};
