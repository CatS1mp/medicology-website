'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';
import {
    adminCreateLesson,
    adminCreateSection,
    adminDeleteLesson,
    adminDeleteSection,
    adminGetCourse,
    adminListCourses,
    adminListSections,
    adminListLessons,
    adminPatchCourseActive,
    adminPatchLessonStatus,
    adminUpdateCourse,
    adminUpdateLesson,
    adminUpdateSection,
} from '@/shared/api/admin-learning';
import { getSectionAssessment } from '@/shared/api/assessment';
import type { AssessmentDiscoveryResponse } from '@/shared/types/assessment';
import type { CourseResponse, LessonResponse, SectionResponse } from '@/shared/types/learning';

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

function countQuizBlocks(lesson: LessonResponse): number {
    return lesson.blocks?.filter((b) => b.kind === 'QUIZ_MCQ' || b.assessmentId).length ?? 0;
}

type CurriculumItem =
    | { kind: 'lesson'; lesson: LessonResponse }
    | { kind: 'test'; assessment: AssessmentDiscoveryResponse };

type SectionBundle = {
    section: SectionResponse;
    lessons: LessonResponse[];
    sectionAssessment: AssessmentDiscoveryResponse | null;
    lessonAssessmentByLessonId: Record<string, AssessmentDiscoveryResponse | null>;
};

function buildCurriculumItems(bundle: SectionBundle): CurriculumItem[] {
    const { lessons, sectionAssessment, lessonAssessmentByLessonId } = bundle;
    const out: CurriculumItem[] = [];
    const used = new Set<string>();
    for (const lesson of lessons) {
        out.push({ kind: 'lesson', lesson });
        const la = lessonAssessmentByLessonId[lesson.id];
        if (la?.lessonId === lesson.id && la.id && !used.has(la.id)) {
            used.add(la.id);
            out.push({ kind: 'test', assessment: la });
        }
    }
    if (sectionAssessment?.lessonId == null && sectionAssessment?.id && !used.has(sectionAssessment.id)) {
        out.push({ kind: 'test', assessment: sectionAssessment });
    }
    return out;
}

function sectionPublished(bundle: SectionBundle): boolean {
    if (bundle.lessons.length === 0) return false;
    return bundle.lessons.every((l) => l.isActive);
}

async function loadSectionBundles(courseId: string): Promise<SectionBundle[]> {
    const sections = (await adminListSections(courseId)).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    return Promise.all(
        sections.map(async (section) => {
            const lessons = (await adminListLessons(section.id)).slice().sort((a, b) => a.orderIndex - b.orderIndex);
            const [sectionAssessment, ...lessonAssessments] = await Promise.all([
                getSectionAssessment(section.id).catch(() => null),
                ...lessons.map((l) => getSectionAssessment(section.id, l.id).catch(() => null)),
            ]);
            const lessonAssessmentByLessonId: Record<string, AssessmentDiscoveryResponse | null> = {};
            lessons.forEach((l, i) => {
                lessonAssessmentByLessonId[l.id] = lessonAssessments[i] ?? null;
            });
            return {
                section,
                lessons,
                sectionAssessment: sectionAssessment ?? null,
                lessonAssessmentByLessonId,
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
    const [description, setDescription] = useState(course.description ?? '');
    const [colorCode, setColorCode] = useState(course.colorCode ?? '#1cb0f6');
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
                description: description.trim() || null,
                colorCode: colorCode || null,
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
                <form onSubmit={(e) => void handleSave(e)}>
                    <label className={styles.curriculumField}>
                        <span>Tên khóa học</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} className={styles.curriculumInput} />
                    </label>
                    <label className={styles.curriculumField}>
                        <span>Mô tả</span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={styles.curriculumTextarea}
                            rows={4}
                        />
                    </label>
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
                    bundles.flatMap((b) => b.lessons.map((l) => adminPatchLessonStatus(l.id, true)))
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

    const reorderLessons = async (sectionId: string, from: number, to: number, list: LessonResponse[]) => {
        if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
        const next = list.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        const bundleIdx = bundles.findIndex((b) => b.section.id === sectionId);
        if (bundleIdx < 0) return;
        const copy = bundles.slice();
        copy[bundleIdx] = { ...copy[bundleIdx], lessons: next };
        setBundles(copy);
        try {
            await Promise.all(next.map((l, idx) => adminUpdateLesson(l.id, { orderIndex: idx })));
        } catch {
            window.alert('Không sắp xếp lại bài học được.');
            await load();
        }
    };

    const addSection = async () => {
        const name = window.prompt('Tên phần học mới');
        if (!name?.trim()) return;
        const slug = slugifyName(name);
        if (!slug) {
            window.alert('Slug không hợp lệ.');
            return;
        }
        try {
            await adminCreateSection(courseId, {
                name: name.trim(),
                slug,
                orderIndex: bundles.length,
            });
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Không tạo được phần học.');
        }
    };

    const editSection = async (section: SectionResponse) => {
        const name = window.prompt('Tên phần học', section.name);
        if (!name?.trim()) return;
        const s = slugifyName(name);
        try {
            await adminUpdateSection(section.id, {
                themeId: section.courseId,
                name: name.trim(),
                slug: s || section.slug,
                orderIndex: section.orderIndex,
                estimatedDurationMinutes: section.estimatedDurationMinutes,
            });
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Cập nhật thất bại.');
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

    const addLesson = async (sectionId: string) => {
        const name = window.prompt('Tên bài học');
        if (!name?.trim()) return;
        const slug = slugifyName(name);
        if (!slug) {
            window.alert('Slug không hợp lệ.');
            return;
        }
        const bundle = bundles.find((b) => b.section.id === sectionId);
        const orderIndex = bundle?.lessons.length ?? 0;
        try {
            await adminCreateLesson({
                sectionId,
                name: name.trim(),
                slug,
                orderIndex,
            });
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Không tạo được bài học.');
        }
    };

    const deleteLesson = async (lesson: LessonResponse) => {
        if (!window.confirm(`Xóa bài học "${lesson.name}"?`)) return;
        try {
            await adminDeleteLesson(lesson.id);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Xóa thất bại.');
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
                            onClick={() => void publishCourse()}
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

                {loading && <p className={styles.curriculumMuted}>Đang tải…</p>}
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
                                                onClick={() => void editSection(section)}
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
                                                    if (item.kind === 'test') {
                                                        const a = item.assessment;
                                                        const menuKey = `test-${a.id}`;
                                                        return (
                                                            <div key={`test-${a.id}`} className={styles.curriculumRowTest}>
                                                                <button
                                                                    type="button"
                                                                    className={styles.curriculumGripSmall}
                                                                    aria-hidden
                                                                    tabIndex={-1}
                                                                >
                                                                    <span className={styles.curriculumGripDots} />
                                                                </button>
                                                                <div className={styles.curriculumRowIconTest}>
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                                                        <path
                                                                            d="M12 2L14.5 8.5L21 10L14.5 11.5L12 18L9.5 11.5L3 10L9.5 8.5L12 2Z"
                                                                            fill="currentColor"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <div className={styles.curriculumRowMain}>
                                                                    <div className={styles.curriculumRowTitle}>{a.title}</div>
                                                                    <div className={styles.curriculumRowMeta}>
                                                                        {a.timeLimitMinutes != null && (
                                                                            <span>{a.timeLimitMinutes} phút</span>
                                                                        )}
                                                                        <span>
                                                                            Điểm đạt:{' '}
                                                                            {Math.round(a.passScore <= 1 ? a.passScore * 100 : a.passScore)}%
                                                                        </span>
                                                                        <span
                                                                            className={
                                                                                a.active
                                                                                    ? styles.curriculumBadgePub
                                                                                    : styles.curriculumBadgeDraft
                                                                            }
                                                                        >
                                                                            {a.active ? 'Đã đăng tải' : 'Bản nháp'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className={styles.curriculumRowMenuWrap} ref={openMenu === menuKey ? menuRef : null}>
                                                                    <button
                                                                        type="button"
                                                                        className={styles.curriculumRowMore}
                                                                        aria-label="Thêm thao tác"
                                                                        onClick={() => setOpenMenu((p) => (p === menuKey ? null : menuKey))}
                                                                    >
                                                                        ⋮
                                                                    </button>
                                                                    {openMenu === menuKey && (
                                                                        <div className={styles.curriculumRowMenu} role="menu">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setOpenMenu(null);
                                                                                    router.push(`/admin/tests/edit?assessmentId=${encodeURIComponent(a.id)}`);
                                                                                }}
                                                                            >
                                                                                Sửa nội dung
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    const lesson = item.lesson;
                                                    const qCount = countQuizBlocks(lesson);
                                                    const dur =
                                                        lesson.estimatedDurationMinutes != null
                                                            ? `${lesson.estimatedDurationMinutes} phút`
                                                            : '—';
                                                    const menuKey = `lesson-${lesson.id}`;
                                                    const lessonIdx = bundle.lessons.findIndex((l) => l.id === lesson.id);

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
                                                                    void reorderLessons(section.id, fromIdx, lessonIdx, bundle.lessons);
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
                                                                                    `/courses/${encodeURIComponent(headerCourse.slug)}/lessons/${encodeURIComponent(lesson.slug)}`
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
                                                                                void deleteLesson(lesson);
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
                                                    onClick={() => void addLesson(section.id)}
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

                        <button type="button" className={styles.curriculumAddSection} onClick={() => void addSection()}>
                            <span className={styles.curriculumAddPlus}>+</span>
                            Thêm phần học mới
                        </button>
                    </div>
                )}
            </div>
        </BaseAdminLayout>
    );
};
