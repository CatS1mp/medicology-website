'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';
import { getAssessmentAdmin, putAssessmentAdmin, type AssessmentAdminDetail, type AssessmentAdminQuestion } from '@/shared/api/admin-assessment';

function difficultyLabel(raw?: string | null): string {
    if (!raw) return 'CƠ BẢN';
    const u = raw.toUpperCase();
    if (u.includes('ADV') || u.includes('NÂNG')) return 'NÂNG CAO';
    if (u.includes('INTER') || u.includes('TRUNG')) return 'TRUNG BÌNH';
    return 'CƠ BẢN';
}

export const AdminTestDetailScreen: React.FC = () => {
    const searchParams = useSearchParams();
    const assessmentId = searchParams.get('assessmentId');
    const [detail, setDetail] = useState<AssessmentAdminDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passScore, setPassScore] = useState(70);
    const [timeLimit, setTimeLimit] = useState(30);
    const [maxAttempts, setMaxAttempts] = useState(3);
    const [selectedQ, setSelectedQ] = useState<AssessmentAdminQuestion | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!assessmentId) {
            setDetail(null);
            setError('Thiếu assessmentId trên URL (ví dụ ?assessmentId=...).');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const d = await getAssessmentAdmin(assessmentId);
            setDetail(d);
            setPassScore(d.passScore ?? 70);
            setTimeLimit(d.timeLimitMinutes ?? 30);
            setMaxAttempts(d.maxAttempts ?? 3);
            const qs = d.questions ?? [];
            setSelectedQ(qs[0] ?? null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được bài kiểm tra.');
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [assessmentId]);

    useEffect(() => {
        void load();
    }, [load]);

    const questions = detail?.questions ?? [];
    const totalPoints = questions.reduce((s, q) => s + (q.points ?? 0), 0);

    const handleSave = async () => {
        if (!assessmentId || !detail) return;
        setSaving(true);
        try {
            const updated = await putAssessmentAdmin(assessmentId, {
                title: detail.title,
                passScore,
                timeLimitMinutes: timeLimit,
                maxAttempts,
            });
            setDetail(updated);
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Lưu thất bại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Chi tiết Quản lý Bài tập/Bài kiểm tra</h1>
                    <p>Quản lý tập trung hệ thống câu hỏi và thiết lập cấu hình bài kiểm tra trong toàn bộ hệ thống</p>
                </div>
            </section>

            {error && (
                <section className={styles.filterSection} style={{ borderColor: '#fecaca', background: '#fef2f2', padding: 16 }}>
                    <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                    <button type="button" className={styles.btnPrimary} style={{ marginTop: 12 }} onClick={() => void load()}>
                        Thử lại
                    </button>
                </section>
            )}

            <div className={styles.tabGroup}>
                <div className={`${styles.tabBtn} ${styles.tabBtnActive}`}>Bài kiểm tra khoá học</div>
                <div className={`${styles.tabBtn} ${styles.tabBtnInactive}`}>Bài kiểm tra đầu vào</div>
            </div>

            {loading && <p style={{ padding: 16, color: '#94a3b8' }}>Đang tải…</p>}

            {!loading && detail && (
                <div className={styles.editorContainer}>
                    <aside className={styles.questionListSidebar}>
                        <button type="button" className={styles.btnPrimary} style={{ width: '100%', borderRadius: 12 }} disabled>
                            + Thêm câu hỏi (API cần endpoint)
                        </button>

                        <div className={styles.chipGroup} style={{ backgroundColor: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                            <button type="button" className={`${styles.chip} ${styles.chipActive}`} style={{ flex: 1, border: 'none' }}>
                                Tất cả
                            </button>
                            <button type="button" className={styles.chip} style={{ flex: 1, border: 'none', background: 'transparent' }} disabled>
                                Bản nháp
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Câu hỏi đánh giá</p>
                            {questions.length === 0 && (
                                <p style={{ fontSize: 13, color: '#94a3b8' }}>Chưa có câu hỏi từ API.</p>
                            )}
                            {questions.map((q) => (
                                <button
                                    type="button"
                                    key={q.id}
                                    className={`${styles.qItemCard} ${selectedQ?.id === q.id ? styles.qItemCardActive : ''}`}
                                    onClick={() => setSelectedQ(q)}
                                    style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
                                >
                                    <div className={styles.qItemHeader}>
                                        <span className={styles.qTypeBadge}>{q.type ?? 'MCQ'}</span>
                                        <span className={styles.qScoreBadge}>{q.points ?? 0} Điểm</span>
                                    </div>
                                    <p className={styles.qTextSnippet}>{q.content}</p>
                                    <span className={styles.levelBadge} style={{ fontSize: 9, padding: '2px 8px' }}>
                                        {difficultyLabel(q.difficultyLevel)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div
                            style={{
                                marginTop: 'auto',
                                paddingTop: 16,
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 11,
                                fontWeight: 700,
                            }}
                        >
                            <span style={{ color: '#3b82f6' }}>Tổng số câu hỏi: {questions.length}</span>
                            <span style={{ color: '#64748b' }}>Tổng điểm: {totalPoints}</span>
                        </div>
                    </aside>

                    <section className={styles.editorMain}>
                        <div className={styles.infoRow}>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{detail.title}</h2>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingItem}>
                                <span className={styles.settingLabel}>Điểm đạt</span>
                                <div className={styles.inputStepper}>
                                    <button type="button" className={styles.stepperBtn} onClick={() => setPassScore((p) => Math.max(0, p - 5))}>
                                        -
                                    </button>
                                    <input
                                        className={styles.stepperInput}
                                        value={passScore}
                                        onChange={(e) => setPassScore(Number(e.target.value) || 0)}
                                    />
                                    <button type="button" className={styles.stepperBtn} onClick={() => setPassScore((p) => Math.min(100, p + 5))}>
                                        +
                                    </button>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>%</span>
                            </div>

                            <div className={styles.settingItem}>
                                <span className={styles.settingLabel}>Thời gian</span>
                                <div className={styles.inputStepper}>
                                    <button type="button" className={styles.stepperBtn} onClick={() => setTimeLimit((t) => Math.max(1, t - 1))}>
                                        -
                                    </button>
                                    <input
                                        className={styles.stepperInput}
                                        value={timeLimit}
                                        onChange={(e) => setTimeLimit(Number(e.target.value) || 0)}
                                    />
                                    <button type="button" className={styles.stepperBtn} onClick={() => setTimeLimit((t) => t + 1)}>
                                        +
                                    </button>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>PHÚT</span>
                            </div>

                            <div className={styles.settingItem}>
                                <span className={styles.settingLabel}>Số lần làm tối đa</span>
                                <div className={styles.inputStepper}>
                                    <button type="button" className={styles.stepperBtn} onClick={() => setMaxAttempts((m) => Math.max(1, m - 1))}>
                                        -
                                    </button>
                                    <input
                                        className={styles.stepperInput}
                                        value={maxAttempts}
                                        onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                                    />
                                    <button type="button" className={styles.stepperBtn} onClick={() => setMaxAttempts((m) => m + 1)}>
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {selectedQ && (
                            <>
                                <div className={styles.infoRow}>
                                    <div className={styles.infoGroup}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Loại câu hỏi</span>
                                            <span className={styles.infoValue} style={{ color: '#3b82f6' }}>
                                                {selectedQ.type ?? 'MCQ'}
                                            </span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Điểm số</span>
                                            <span className={styles.infoValue} style={{ textAlign: 'center' }}>
                                                {selectedQ.points ?? 0}
                                            </span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Mức độ khó</span>
                                            <span className={styles.infoValue}>{difficultyLabel(selectedQ.difficultyLevel)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>
                                        Nội dung câu hỏi
                                    </p>
                                    <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{selectedQ.content}</h3>
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: 24 }}>
                            <button type="button" className={styles.btnPrimary} onClick={() => void handleSave()} disabled={saving}>
                                {saving ? 'Đang lưu…' : 'Lưu cấu hình bài kiểm tra'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            <footer className={styles.statusBar}>
                <div className={styles.statusMsg}>
                    <span>⚠️</span> {totalPoints < passScore ? 'Tổng điểm câu hỏi có thể chưa đạt mức điểm đạt yêu cầu.' : 'Cấu hình đã được đồng bộ từ API.'}
                </div>
                <div className={styles.statusInfo}>
                    <span>☁️ Trạng thái: </span>
                    <b>{detail ? 'Đã tải' : '—'}</b>
                </div>
            </footer>
        </BaseAdminLayout>
    );
};
