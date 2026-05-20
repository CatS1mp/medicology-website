'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminUploadDictionaryAsset } from '@/shared/api/admin-dictionary';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '@/features/admin/admin.module.css';
import { BaseAdminLayout } from '@/features/admin/components/layout/BaseAdminLayout';
import { adminListBlockTemplates, adminUpdateContent } from '@/shared/api/admin-learning';
import { getContentDetail } from '@/shared/api/learning';
import type { ContentBlockKind, ContentBlockResponse, ContentBlockTemplateResponse } from '@/shared/types/learning';
import { Skeleton } from '@/shared/components/Skeleton';
import { LessonBlockStep } from '@/features/courses/components/lesson/LessonBlockStep';
import { useToast } from '@/shared/contexts/ToastContext';

function difficultyLabel(raw?: string | null): string {
    if (!raw) return 'CƠ BẢN';
    const u = raw.toUpperCase();
    if (u.includes('ADV') || u.includes('NÂNG')) return 'NÂNG CAO';
    if (u.includes('INTER') || u.includes('TRUNG')) return 'TRUNG BÌNH';
    return 'CƠ BẢN';
}

type ContentBlockItem = {
    id: string;
    kind: ContentBlockKind;
    payload: string;
    content: string;
    type: string;
    points: number;
    displayOrder: number;
    difficultyLevel: string | null;
    isGradable: boolean;
    isNew?: boolean;
};

type ContentEditorDetail = {
    id: string;
    sectionId: string;
    slug: string;
    orderIndex: number;
    title: string;
    description?: string | null;
    difficultyLevel?: string | null;
    passScore: number;
    timeLimitMinutes: number;
    maxAttempts: number;
    status: string;
    active: boolean;
    content: string | null;
    blocks: ContentBlockItem[];
};

function mapBlockType(kind: ContentBlockResponse['kind']): string {
    switch (kind) {
        case 'QUIZ_MCQ':
            return 'MCQ';
        case 'FILL_IN_THE_BLANKS':
            return 'FILL_BLANK';
        case 'SHORT_ANSWER':
            return 'SHORT_ANSWER';
        case 'MATCHING':
            return 'MATCHING';
        case 'ORDERING':
            return 'ORDERING';
        default:
            return kind;
    }
}

function extractBlockText(block: ContentBlockResponse): string {
    if (!block.payload) {
        return `Khối #${block.orderIndex + 1}`;
    }
    try {
        const parsed = JSON.parse(block.payload) as Record<string, unknown>;
        const fields = [
            parsed.question,
            parsed.prompt,
            parsed.stem,
            parsed.title,
            parsed.content,
            parsed.text,
            parsed.template,
        ];
        const firstText = fields.find((item) => typeof item === 'string' && item.trim().length > 0);
        if (typeof firstText === 'string') {
            return firstText;
        }
    } catch {
        /* payload is plain text, not JSON */
    }
    return block.payload.trim() || `Khối #${block.orderIndex + 1}`;
}

function toEditorDetailFromContent(content: Awaited<ReturnType<typeof getContentDetail>>): ContentEditorDetail {
    const sortedBlocks = (content.blocks ?? [])
        .sort((left, right) => left.orderIndex - right.orderIndex);
    const blocks: ContentBlockItem[] = sortedBlocks.map((block) => ({
        id: block.id,
        kind: block.kind,
        payload: block.payload,
        content: extractBlockText(block),
        type: mapBlockType(block.kind),
        points: block.maxScore ?? 0,
        displayOrder: block.orderIndex,
        difficultyLevel: content.difficultyLevel,
        isGradable: block.isGradable,
    }));

    return {
        id: content.id,
        sectionId: content.sectionId,
        slug: content.slug,
        orderIndex: content.orderIndex,
        title: content.name,
        description: content.description,
        difficultyLevel: content.difficultyLevel,
        passScore: 70,
        timeLimitMinutes: content.estimatedDurationMinutes ?? 30,
        maxAttempts: 3,
        status: content.isActive ? 'PUBLISHED' : 'DRAFT',
        active: content.isActive,
        content: content.content,
        blocks,
    };
}

function extractBlockTextFromPayload(payload: string, orderIndex: number): string {
    if (!payload) return `Khối #${orderIndex + 1}`;
    try {
        const parsed = JSON.parse(payload) as Record<string, unknown>;
        const fields = [parsed.question, parsed.prompt, parsed.stem, parsed.title, parsed.content, parsed.text, parsed.template];
        const firstText = fields.find((item) => typeof item === 'string' && item.trim().length > 0);
        if (typeof firstText === 'string') return firstText;
    } catch {
        return payload.trim() || `Khối #${orderIndex + 1}`;
    }
    return payload.trim() || `Khối #${orderIndex + 1}`;
}

function tryParsePayload(payload: string): Record<string, unknown> {
    try {
        const parsed = JSON.parse(payload) as unknown;
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    } catch {
        return {};
    }
}

function normalizePayloadForKind(kind: ContentBlockKind, payload: string): string {
    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(payload) as Record<string, unknown>;
    } catch {
        return payload;
    }
    if (!parsed || typeof parsed !== 'object') {
        return payload;
    }

    if (kind === 'RICH_TEXT') {
        const title = String(parsed.title ?? '').trim() || 'Nội dung học';
        const body = String(parsed.body ?? parsed.content ?? parsed.description ?? parsed.text ?? '').trim();
        return JSON.stringify({ ...parsed, title, body: body || 'Nội dung đang được cập nhật.' });
    }

    if (kind === 'QUIZ_MCQ') {
        const question = String(parsed.question ?? parsed.prompt ?? parsed.title ?? '').trim() || 'Câu hỏi trắc nghiệm';
        const rawOptions = Array.isArray(parsed.options) ? parsed.options : [];
        const options = rawOptions.map((option) => String(option)).filter((option) => option.trim().length > 0);
        const correctOptionIndex = Number.isFinite(Number(parsed.correctOptionIndex)) ? Number(parsed.correctOptionIndex) : 0;
        return JSON.stringify({ ...parsed, question, options, correctOptionIndex });
    }

    if (kind === 'FILL_IN_THE_BLANKS') {
        const template = String(parsed.template ?? parsed.prompt ?? parsed.question ?? '').trim() || 'Điền đáp án vào chỗ trống.';
        const rawAnswers = Array.isArray(parsed.answers) ? parsed.answers : [parsed.answer ?? parsed.correctAnswer].filter(Boolean);
        const answers = rawAnswers.map((answer) => String(answer)).filter((answer) => answer.trim().length > 0);
        return JSON.stringify({ ...parsed, template, answers });
    }

    if (kind === 'SHORT_ANSWER') {
        const prompt = String(parsed.prompt ?? parsed.question ?? '').trim() || 'Nhập câu trả lời ngắn';
        const sampleAnswer = String(parsed.sampleAnswer ?? parsed.answer ?? '').trim() || 'N/A';
        return JSON.stringify({ ...parsed, prompt, sampleAnswer });
    }

    if (kind === 'MATCHING') {
        const prompt = String(parsed.prompt ?? '').trim() || 'Ghép cặp thuật ngữ và định nghĩa';
        const rawPairs = Array.isArray(parsed.pairs) ? parsed.pairs : [];
        const pairs = rawPairs
            .map((p) => {
                const o = (p ?? {}) as Record<string, unknown>;
                return { left: String(o.left ?? '').trim(), right: String(o.right ?? '').trim() };
            })
            .filter((p) => p.left.length > 0 && p.right.length > 0);
        const safePairs = pairs.length >= 1 ? pairs : [{ left: 'Thuật ngữ', right: 'Định nghĩa' }];
        return JSON.stringify({ ...parsed, prompt, pairs: safePairs });
    }

    if (kind === 'ORDERING') {
        const prompt = String(parsed.prompt ?? '').trim() || 'Sắp xếp theo đúng thứ tự';
        const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
        const items = rawItems.map((it, index) => {
            const o = (it ?? {}) as Record<string, unknown>;
            const text = String(o.text ?? o.label ?? '').trim();
            const id = String(o.id ?? o.stableKey ?? o.key ?? '').trim() || `k${index + 1}`;
            return { id, text: text || `Bước ${index + 1}` };
        });
        const safeItems =
            items.length >= 2
                ? items
                : [
                      { id: 'k1', text: 'Bước thứ nhất' },
                      { id: 'k2', text: 'Bước thứ hai' },
                  ];
        return JSON.stringify({ ...parsed, prompt, items: safeItems });
    }

    if (kind === 'TIMELINE') {
        const title = String(parsed.title ?? '').trim() || 'Dòng thời gian';
        const rawEvents = Array.isArray(parsed.events) ? parsed.events : [];
        const events = rawEvents.map((ev, index) => {
            const o = (ev ?? {}) as Record<string, unknown>;
            const time = String(o.time ?? o.date ?? '').trim() || `T${index + 1}`;
            const eventTitle = String(o.title ?? '').trim() || `Sự kiện ${index + 1}`;
            const description = String(o.description ?? '').trim();
            return { time, title: eventTitle, description };
        });
        const safeEvents =
            events.length >= 1
                ? events
                : [{ time: 'Giai đoạn 1', title: 'Sự kiện mẫu', description: 'Mô tả ngắn (tuỳ chọn).' }];
        return JSON.stringify({ ...parsed, title, events: safeEvents });
    }

    if (kind === 'INFOGRAPHIC') {
        const title = String(parsed.title ?? '').trim() || 'Infographic';
        const mediaType = parsed.mediaType === 'video' ? 'video' : 'image';
        const imageUrl = String(parsed.imageUrl ?? '');
        const videoUrl = String(parsed.videoUrl ?? '');
        const caption = String(parsed.caption ?? '');
        const assetId = parsed.assetId;
        return JSON.stringify({
            ...parsed,
            title,
            mediaType,
            imageUrl,
            videoUrl,
            caption,
            ...(typeof assetId === 'string' && assetId.trim() ? { assetId: assetId.trim() } : {}),
        });
    }

    return JSON.stringify(parsed);
}

const compactLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 };
const compactInput: React.CSSProperties = {
    width: '100%',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    padding: '8px 10px',
    fontSize: 13,
    outline: 'none',
};
const compactTextarea: React.CSSProperties = { ...compactInput, minHeight: 72, resize: 'vertical' as const };

type BlockPayloadEditorProps = {
    block: ContentBlockItem;
    orderIndex: number;
    onPatch: (next: ContentBlockItem) => void;
};

function BlockPayloadEditor({ block, orderIndex, onPatch }: BlockPayloadEditorProps) {
    const [infographicUploading, setInfographicUploading] = useState(false);
    const [infographicUploadError, setInfographicUploadError] = useState<string | null>(null);
    const parsed = tryParsePayload(block.payload);

    useEffect(() => {
        setInfographicUploadError(null);
    }, [block.id, block.kind]);

    const commitPayload = (merged: Record<string, unknown>) => {
        const payload = JSON.stringify(merged);
        onPatch({
            ...block,
            payload,
            content: extractBlockTextFromPayload(payload, orderIndex),
        });
    };

    if (block.kind === 'QUIZ_MCQ') {
        const question = String(parsed.question ?? '');
        const rawOpts = Array.isArray(parsed.options) ? parsed.options : [];
        const options = rawOpts.length >= 2 ? rawOpts.map((o) => String(o)) : ['', ''];
        const correctOptionIndex = Number.isFinite(Number(parsed.correctOptionIndex))
            ? Number(parsed.correctOptionIndex)
            : 0;

        const setQuestion = (value: string) => {
            commitPayload({ ...parsed, question: value });
        };
        const setOptionAt = (idx: number, value: string) => {
            const next = options.slice();
            next[idx] = value;
            commitPayload({ ...parsed, question, options: next, correctOptionIndex });
        };
        const addOption = () => {
            commitPayload({ ...parsed, question, options: [...options, ''], correctOptionIndex });
        };
        const removeOption = (idx: number) => {
            if (options.length <= 2) return;
            const next = options.filter((_, i) => i !== idx);
            let ci = correctOptionIndex;
            if (idx === ci) ci = 0;
            else if (idx < ci) ci -= 1;
            if (ci >= next.length) ci = next.length - 1;
            commitPayload({ ...parsed, question, options: next, correctOptionIndex: ci });
        };

        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Câu hỏi</span>
                    <textarea style={{ ...compactTextarea, minHeight: 56 }} value={question} onChange={(e) => setQuestion(e.target.value)} />
                </label>
                <div style={{ display: 'grid', gap: 8 }}>
                    <span style={compactLabel}>Các lựa chọn</span>
                    {options.map((opt, idx) => (
                        <div key={`opt-${idx}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                type="radio"
                                name={`correct-${block.id}`}
                                checked={correctOptionIndex === idx}
                                onChange={() => commitPayload({ ...parsed, question, options, correctOptionIndex: idx })}
                                aria-label={`Đáp án đúng ${idx + 1}`}
                            />
                            <input
                                style={{ ...compactInput, flex: 1 }}
                                value={opt}
                                onChange={(e) => setOptionAt(idx, e.target.value)}
                                placeholder={`Lựa chọn ${idx + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeOption(idx)}
                                disabled={options.length <= 2}
                                style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff' }}
                            >
                                −
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addOption} style={{ alignSelf: 'start', fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px dashed #94a3b8', background: '#f8fafc' }}>
                        + Thêm lựa chọn
                    </button>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Chọn nút tròn bên trái để đặt đáp án đúng.</p>
            </div>
        );
    }

    if (block.kind === 'FILL_IN_THE_BLANKS') {
        const template = String(parsed.template ?? '');
        const rawAnswers = Array.isArray(parsed.answers) ? parsed.answers.map(String) : [];
        const answersText = rawAnswers.join('\n');

        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Mẫu câu (dùng ___ làm chỗ trống)</span>
                    <textarea
                        style={{ ...compactTextarea, minHeight: 56 }}
                        value={template}
                        onChange={(e) => commitPayload({ ...parsed, template: e.target.value, answers: rawAnswers.length ? rawAnswers : ['đáp án'] })}
                    />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Đáp án đúng (mỗi dòng một đáp án theo thứ tự chỗ trống)</span>
                    <textarea
                        style={compactTextarea}
                        value={answersText}
                        onChange={(e) => {
                            const answers = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                            commitPayload({ ...parsed, template, answers: answers.length ? answers : ['đáp án'] });
                        }}
                    />
                </label>
            </div>
        );
    }

    if (block.kind === 'SHORT_ANSWER') {
        const prompt = String(parsed.prompt ?? '');
        const sampleAnswer = String(parsed.sampleAnswer ?? '');
        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Yêu cầu</span>
                    <textarea style={{ ...compactTextarea, minHeight: 56 }} value={prompt} onChange={(e) => commitPayload({ ...parsed, prompt: e.target.value, sampleAnswer })} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Đáp án mẫu / tham chiếu chấm</span>
                    <textarea style={{ ...compactTextarea, minHeight: 48 }} value={sampleAnswer} onChange={(e) => commitPayload({ ...parsed, prompt, sampleAnswer: e.target.value })} />
                </label>
            </div>
        );
    }

    if (block.kind === 'RICH_TEXT') {
        const title = String(parsed.title ?? '');
        const body = String(parsed.body ?? '');
        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Tiêu đề</span>
                    <input style={compactInput} value={title} onChange={(e) => commitPayload({ ...parsed, title: e.target.value, body })} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Nội dung</span>
                    <textarea style={{ ...compactTextarea, minHeight: 120 }} value={body} onChange={(e) => commitPayload({ ...parsed, title, body: e.target.value })} />
                </label>
            </div>
        );
    }

    if (block.kind === 'FLASHCARD') {
        const front = String(parsed.front ?? '');
        const back = String(parsed.back ?? '');
        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Mặt trước</span>
                    <textarea style={{ ...compactTextarea, minHeight: 48 }} value={front} onChange={(e) => commitPayload({ ...parsed, front: e.target.value, back })} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Mặt sau</span>
                    <textarea style={{ ...compactTextarea, minHeight: 48 }} value={back} onChange={(e) => commitPayload({ ...parsed, front, back: e.target.value })} />
                </label>
            </div>
        );
    }

    if (block.kind === 'INFOGRAPHIC') {
        const title = String(parsed.title ?? '');
        const mediaType = String(parsed.mediaType ?? 'image');
        const imageUrl = String(parsed.imageUrl ?? '');
        const videoUrl = String(parsed.videoUrl ?? '');
        const caption = String(parsed.caption ?? '');

        const runInfographicUpload = async (file: File | undefined) => {
            if (!file) return;
            setInfographicUploading(true);
            setInfographicUploadError(null);
            try {
                const uploaded = await adminUploadDictionaryAsset(file);
                commitPayload({
                    ...parsed,
                    title,
                    mediaType: 'image',
                    imageUrl: uploaded.url,
                    assetId: uploaded.assetId,
                    videoUrl,
                    caption,
                });
            } catch (err) {
                setInfographicUploadError(err instanceof Error ? err.message : 'Tải ảnh thất bại.');
            } finally {
                setInfographicUploading(false);
            }
        };

        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Tiêu đề</span>
                    <input style={compactInput} value={title} onChange={(e) => commitPayload({ ...parsed, title: e.target.value })} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Loại media</span>
                    <select
                        style={compactInput}
                        value={mediaType === 'video' ? 'video' : 'image'}
                        onChange={(e) => commitPayload({ ...parsed, title, mediaType: e.target.value, imageUrl, videoUrl, caption })}
                    >
                        <option value="image">Ảnh</option>
                        <option value="video">Video</option>
                    </select>
                </label>
                {mediaType === 'video' ? (
                    <label style={{ display: 'grid', gap: 6 }}>
                        <span style={compactLabel}>URL video</span>
                        <input style={compactInput} value={videoUrl} onChange={(e) => commitPayload({ ...parsed, title, mediaType: 'video', videoUrl: e.target.value, imageUrl, caption })} />
                    </label>
                ) : (
                    <>
                        <div className={styles.infographicUploadBox}>
                            <span style={compactLabel}>Tải ảnh từ máy</span>
                            <label className={styles.infographicUploadLabel}>
                                {infographicUploading ? 'Đang tải lên…' : 'Chọn file ảnh'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className={styles.infographicFileInput}
                                    disabled={infographicUploading}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        e.target.value = '';
                                        void runInfographicUpload(file);
                                    }}
                                />
                            </label>
                            {infographicUploadError && <p className={styles.infographicUploadError}>{infographicUploadError}</p>}
                            {imageUrl.trim() && (
                                <div className={styles.infographicUploadPreview}>
                                    <img src={imageUrl} alt="Xem trước infographic" />
                                </div>
                            )}
                        </div>
                        <label style={{ display: 'grid', gap: 6 }}>
                            <span style={compactLabel}>Hoặc dán URL ảnh</span>
                            <input
                                style={compactInput}
                                value={imageUrl}
                                onChange={(e) => commitPayload({ ...parsed, title, mediaType: 'image', imageUrl: e.target.value, videoUrl, caption })}
                            />
                        </label>
                    </>
                )}
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Chú thích (tuỳ chọn)</span>
                    <input style={compactInput} value={caption} onChange={(e) => commitPayload({ ...parsed, title, mediaType, imageUrl, videoUrl, caption: e.target.value })} />
                </label>
            </div>
        );
    }

    if (block.kind === 'MATCHING') {
        const prompt = String(parsed.prompt ?? '');
        const rawPairs = Array.isArray(parsed.pairs) ? parsed.pairs : [];
        const pairs: { left: string; right: string }[] =
            rawPairs.length > 0
                ? rawPairs.map((p) => {
                      const o = (p ?? {}) as Record<string, unknown>;
                      return { left: String(o.left ?? ''), right: String(o.right ?? '') };
                  })
                : [{ left: '', right: '' }];

        const updatePairs = (next: { left: string; right: string }[]) => {
            commitPayload({ ...parsed, prompt, pairs: next });
        };

        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                    Người học sẽ ghép <strong>cột trái</strong> (ý/thuật ngữ) với <strong>cột phải</strong> (định nghĩa). Thêm ít nhất một cặp hợp lệ trước khi lưu.
                </p>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Hướng dẫn / câu hỏi</span>
                    <textarea
                        style={{ ...compactTextarea, minHeight: 48 }}
                        value={prompt}
                        onChange={(e) => commitPayload({ ...parsed, prompt: e.target.value, pairs })}
                    />
                </label>
                <div style={{ display: 'grid', gap: 10 }}>
                    <span style={compactLabel}>Các cặp ghép</span>
                    {pairs.map((pair, idx) => (
                        <div key={`pair-${idx}`} className={styles.matchingPairRow}>
                            <input
                                style={compactInput}
                                value={pair.left}
                                onChange={(e) => {
                                    const next = pairs.map((p, j) => (j === idx ? { ...p, left: e.target.value } : p));
                                    updatePairs(next);
                                }}
                                placeholder="Thuật ngữ / bên trái"
                            />
                            <input
                                style={compactInput}
                                value={pair.right}
                                onChange={(e) => {
                                    const next = pairs.map((p, j) => (j === idx ? { ...p, right: e.target.value } : p));
                                    updatePairs(next);
                                }}
                                placeholder="Định nghĩa / bên phải"
                            />
                            <button
                                type="button"
                                disabled={pairs.length <= 1}
                                onClick={() => {
                                    if (pairs.length <= 1) return;
                                    updatePairs(pairs.filter((_, j) => j !== idx));
                                }}
                                style={{ fontSize: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff1f2', color: '#b91c1c', fontWeight: 700 }}
                            >
                                Xóa
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => updatePairs([...pairs, { left: '', right: '' }])}
                        style={{ alignSelf: 'start', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px dashed #94a3b8', background: '#f8fafc', fontWeight: 600 }}
                    >
                        + Thêm một cặp
                    </button>
                </div>
            </div>
        );
    }

    if (block.kind === 'ORDERING') {
        const prompt = String(parsed.prompt ?? '');
        const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
        const items: { id: string; text: string }[] =
            rawItems.length >= 2
                ? rawItems.map((it, index) => {
                      const o = (it ?? {}) as Record<string, unknown>;
                      const text = String(o.text ?? o.label ?? '');
                      const id = String(o.id ?? o.stableKey ?? o.key ?? '').trim() || `k${index + 1}`;
                      return { id, text };
                  })
                : [
                      { id: 'k1', text: '' },
                      { id: 'k2', text: '' },
                  ];

        const commitItems = (next: { id: string; text: string }[]) => {
            commitPayload({ ...parsed, prompt, items: next });
        };

        const moveItem = (from: number, dir: -1 | 1) => {
            const to = from + dir;
            if (to < 0 || to >= items.length) return;
            const next = items.slice();
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            commitItems(next);
        };

        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                    Người học kéo–thả để sắp xếp các dòng theo đúng thứ tự. <strong>ID bước</strong> (k1, k2...) dùng nội bộ để lưu đáp án; có thể để mặc định.
                </p>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Yêu cầu</span>
                    <textarea style={{ ...compactTextarea, minHeight: 48 }} value={prompt} onChange={(e) => commitPayload({ ...parsed, prompt: e.target.value, items })} />
                </label>
                <div style={{ display: 'grid', gap: 10 }}>
                    <span style={compactLabel}>Thứ tự đúng (từ trên xuống)</span>
                    {items.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className={styles.orderingItemRow}>
                            <input
                                style={{ ...compactInput, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                                value={item.id}
                                onChange={(e) => {
                                    const v = e.target.value.trim() || `k${idx + 1}`;
                                    const next = items.map((row, j) => (j === idx ? { ...row, id: v } : row));
                                    commitItems(next);
                                }}
                                title="Mã định danh bước (không trùng nhau)"
                                aria-label={`Mã bước ${idx + 1}`}
                            />
                            <input
                                style={compactInput}
                                value={item.text}
                                onChange={(e) => {
                                    const next = items.map((row, j) => (j === idx ? { ...row, text: e.target.value } : row));
                                    commitItems(next);
                                }}
                                placeholder={`Nội dung bước ${idx + 1}`}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => moveItem(idx, -1)}
                                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    disabled={idx >= items.length - 1}
                                    onClick={() => moveItem(idx, 1)}
                                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    disabled={items.length <= 2}
                                    onClick={() => {
                                        if (items.length <= 2) return;
                                        commitItems(items.filter((_, j) => j !== idx));
                                    }}
                                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', color: '#b91c1c', background: '#fff1f2', fontWeight: 700 }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            const n = items.length + 1;
                            commitItems([...items, { id: `k${n}`, text: '' }]);
                        }}
                        style={{ alignSelf: 'start', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px dashed #94a3b8', background: '#f8fafc', fontWeight: 600 }}
                    >
                        + Thêm bước
                    </button>
                </div>
            </div>
        );
    }

    if (block.kind === 'TIMELINE') {
        const title = String(parsed.title ?? '');
        const rawEvents = Array.isArray(parsed.events) ? parsed.events : [];
        const events: { time: string; title: string; description: string }[] =
            rawEvents.length > 0
                ? rawEvents.map((ev) => {
                      const o = (ev ?? {}) as Record<string, unknown>;
                      return {
                          time: String(o.time ?? o.date ?? ''),
                          title: String(o.title ?? ''),
                          description: String(o.description ?? ''),
                      };
                  })
                : [{ time: '', title: '', description: '' }];

        const updateEvents = (next: { time: string; title: string; description: string }[]) => {
            commitPayload({ ...parsed, title, events: next });
        };

        return (
            <div style={{ display: 'grid', gap: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                    Mỗi dòng là một mốc trên timeline: <strong>thời điểm</strong> (nhãn hiển thị), <strong>tiêu đề</strong> và mô tả tuỳ chọn.
                </p>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={compactLabel}>Tiêu đề dòng thời gian</span>
                    <input style={compactInput} value={title} onChange={(e) => commitPayload({ ...parsed, title: e.target.value, events })} />
                </label>
                <div style={{ display: 'grid', gap: 10 }}>
                    <span style={compactLabel}>Các mốc</span>
                    {events.map((ev, idx) => (
                        <div
                            key={`ev-${idx}`}
                            style={{
                                display: 'grid',
                                gap: 8,
                                padding: 12,
                                border: '1px solid #e2e8f0',
                                borderRadius: 10,
                                background: '#fff',
                            }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                                <label style={{ display: 'grid', gap: 4 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>Thời điểm / nhãn</span>
                                    <input
                                        style={compactInput}
                                        value={ev.time}
                                        onChange={(e) => {
                                            const next = events.map((row, j) => (j === idx ? { ...row, time: e.target.value } : row));
                                            updateEvents(next);
                                        }}
                                        placeholder="VD: Phút 0, Ngày 1…"
                                    />
                                </label>
                                <label style={{ display: 'grid', gap: 4 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>Tiêu đề sự kiện</span>
                                    <input
                                        style={compactInput}
                                        value={ev.title}
                                        onChange={(e) => {
                                            const next = events.map((row, j) => (j === idx ? { ...row, title: e.target.value } : row));
                                            updateEvents(next);
                                        }}
                                        placeholder="Tóm tắt mốc"
                                    />
                                </label>
                            </div>
                            <label style={{ display: 'grid', gap: 4 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>Mô tả (tuỳ chọn)</span>
                                <textarea
                                    style={{ ...compactTextarea, minHeight: 52 }}
                                    value={ev.description}
                                    onChange={(e) => {
                                        const next = events.map((row, j) => (j === idx ? { ...row, description: e.target.value } : row));
                                        updateEvents(next);
                                    }}
                                    placeholder="Chi tiết thêm cho mốc này"
                                />
                            </label>
                            <button
                                type="button"
                                disabled={events.length <= 1}
                                onClick={() => {
                                    if (events.length <= 1) return;
                                    updateEvents(events.filter((_, j) => j !== idx));
                                }}
                                style={{ justifySelf: 'end', fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff1f2', color: '#b91c1c', fontWeight: 700 }}
                            >
                                Xóa mốc
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => updateEvents([...events, { time: '', title: '', description: '' }])}
                        style={{ alignSelf: 'start', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px dashed #94a3b8', background: '#f8fafc', fontWeight: 600 }}
                    >
                        + Thêm mốc
                    </button>
                </div>
            </div>
        );
    }

    return (
        <label style={{ display: 'grid', gap: 6 }}>
            <span style={compactLabel}>Payload JSON (chỉnh sửa thủ công)</span>
            <textarea
                style={{ ...compactTextarea, minHeight: 140, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                value={block.payload}
                onChange={(e) =>
                    onPatch({
                        ...block,
                        payload: e.target.value,
                        content: extractBlockTextFromPayload(e.target.value, orderIndex),
                    })
                }
                spellCheck={false}
            />
        </label>
    );
}

export const AdminTestDetailScreen: React.FC = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const contentId = searchParams.get('contentId') ?? searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');
    const [detail, setDetail] = useState<ContentEditorDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passScore, setPassScore] = useState(70);
    const [timeLimit, setTimeLimit] = useState(30);
    const [maxAttempts, setMaxAttempts] = useState(3);
    const [selectedBlock, setSelectedBlock] = useState<ContentBlockItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState<ContentBlockTemplateResponse[]>([]);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    const load = useCallback(async () => {
        if (!contentId) {
            setDetail(null);
            setError('Thiếu contentId trên URL (ví dụ ?contentId=...).');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [content, templateList] = await Promise.all([
                getContentDetail(contentId),
                adminListBlockTemplates(),
            ]);
            const d = toEditorDetailFromContent(content);
            setDetail(d);
            setTemplates(templateList);
            setPassScore(d.passScore ?? 70);
            setTimeLimit(d.timeLimitMinutes ?? 30);
            setMaxAttempts(d.maxAttempts ?? 3);
            const contentBlocks = d.blocks ?? [];
            setSelectedBlock(contentBlocks[0] ?? null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được bài kiểm tra.');
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [contentId]);

    useEffect(() => {
        void load();
    }, [load]);

    const blocks = detail?.blocks ?? [];
    const totalPoints = blocks.reduce((s, block) => s + (block.points ?? 0), 0);

    const handleAddBlockFromTemplate = (template: ContentBlockTemplateResponse) => {
        if (!detail) return;
        const orderIndex = detail.blocks.length;
        const block: ContentBlockItem = {
            id: `new-${template.id}-${Date.now()}`,
            kind: template.kind,
            payload: template.starterPayloadJson,
            content: extractBlockTextFromPayload(template.starterPayloadJson, orderIndex),
            type: mapBlockType(template.kind),
            points: template.defaultMaxScore ?? 0,
            displayOrder: orderIndex,
            difficultyLevel: detail.difficultyLevel ?? null,
            isGradable: Boolean(template.defaultIsGradable),
            isNew: true,
        };
        setDetail((previous) => previous ? { ...previous, blocks: [...previous.blocks, block] } : previous);
        setSelectedBlock(block);
        setShowTemplatePicker(false);
    };

    const handleDeleteBlock = (blockId: string) => {
        setDetail((previous) => {
            if (!previous) return previous;
            const remaining = previous.blocks
                .filter((block) => block.id !== blockId)
                .map((block, index) => ({ ...block, displayOrder: index }));
            setSelectedBlock((current) => {
                if (current?.id !== blockId) return current;
                return remaining[0] ?? null;
            });
            return { ...previous, blocks: remaining };
        });
    };

    const patchBlock = useCallback((blockId: string, next: ContentBlockItem) => {
        setDetail((previous) => {
            if (!previous) return previous;
            const blocks = previous.blocks.map((block) => (block.id === blockId ? next : block));
            return { ...previous, blocks };
        });
        setSelectedBlock((current) => (current?.id === blockId ? next : current));
    }, []);

    const reorderBlocks = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        setDetail((previous) => {
            if (!previous) return previous;
            const list = previous.blocks.slice();
            if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return previous;
            const [moved] = list.splice(fromIndex, 1);
            list.splice(toIndex, 0, moved);
            const blocks = list.map((block, index) => ({ ...block, displayOrder: index }));
            setSelectedBlock((current) => {
                if (!current) return current;
                return blocks.find((b) => b.id === current.id) ?? current;
            });
            return { ...previous, blocks };
        });
    }, []);

    const handleChangeSelectedScore = (value: number) => {
        if (!selectedBlock) return;
        const normalized = Math.max(1, value || 1);
        patchBlock(selectedBlock.id, { ...selectedBlock, points: normalized });
    };

    const toggleGradable = () => {
        if (!selectedBlock) return;
        const nextGradable = !selectedBlock.isGradable;
        patchBlock(selectedBlock.id, {
            ...selectedBlock,
            isGradable: nextGradable,
            points: nextGradable ? Math.max(1, selectedBlock.points || 1) : 0,
        });
    };

    const handleSave = async () => {
        if (!contentId || !detail) return;
        setSaving(true);
        try {
            const updatedContent = await adminUpdateContent(contentId, {
                sectionId: detail.sectionId,
                name: detail.title,
                description: detail.description ?? null,
                slug: detail.slug,
                orderIndex: detail.orderIndex,
                estimatedDurationMinutes: timeLimit,
                difficultyLevel: detail.difficultyLevel ?? null,
                isActive: detail.active,
                content: detail.content ?? '',
                blocks: detail.blocks.map((block, index) => ({
                    orderIndex: index,
                    kind: block.kind,
                    payload: normalizePayloadForKind(block.kind, block.payload),
                    isGradable: block.isGradable,
                    maxScore: block.isGradable ? Math.max(1, block.points || 1) : null,
                })),
            });
            setDetail((previous) => {
                if (!previous) return previous;
                return {
                    ...previous,
                    timeLimitMinutes: updatedContent.estimatedDurationMinutes ?? timeLimit,
                    blocks: previous.blocks.map((block, index) => ({ ...block, displayOrder: index, isNew: false })),
                };
            });
            showToast('Lưu cấu hình nội dung thành công.', 'success');
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Lưu thất bại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseAdminLayout>
            <div className={styles.lessonContentDetailRoot}>
            <section
                className={styles.reportHeader}
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, marginBottom: 16, flexShrink: 0 }}
            >
                <div className={styles.reportTitleGroup}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        style={{ marginBottom: 12, width: 'fit-content' }}
                        onClick={() => router.push(courseId ? `/admin/courses/${encodeURIComponent(courseId)}/curriculum` : '/admin/courses')}
                    >
                        ← Quay lại roadmap
                    </button>
                    <h1>Chi tiết nội dung bài học</h1>
                    <p>Hiển thị danh sách khối học tập của content và cấu hình thời lượng hiển thị.</p>
                </div>
                {!loading && detail && (
                    <>
                        <label style={{ display: 'grid', gap: 6, margin: '16px 0 0' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tên bài học / bài tập</span>
                            <input
                                type="text"
                                value={detail.title}
                                onChange={(e) => setDetail((p) => (p ? { ...p, title: e.target.value } : p))}
                                style={{
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: '#1e293b',
                                    width: '100%',
                                    maxWidth: '100%',
                                    boxSizing: 'border-box',
                                    padding: '8px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 10,
                                    background: '#fff',
                                }}
                                autoComplete="off"
                            />
                        </label>
                        <div className={styles.lessonStatusStrip}>
                            <div className={styles.statusMsg}>
                                <span>⚠️</span>{' '}
                                {totalPoints < passScore
                                    ? 'Tổng điểm khối có thể chưa đạt mức điểm đạt yêu cầu.'
                                    : 'Danh sách khối đã đồng bộ từ API learning-service.'}
                            </div>
                            <div className={styles.statusInfo}>
                                <span>☁️ Trạng thái: </span>
                                <b>Đã tải</b>
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 16,
                                marginTop: 16,
                                paddingBottom: 16,
                                borderBottom: '1px solid #f1f5f9',
                            }}
                        >
                            <div className={styles.settingRow} style={{ flex: '1 1 auto', minWidth: 0, paddingBottom: 0, borderBottom: 'none', margin: 0 }}>
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
                            <button
                                type="button"
                                className={styles.btnPrimary}
                                style={{ flexShrink: 0, marginLeft: 'auto' }}
                                onClick={() => void handleSave()}
                                disabled={saving}
                            >
                                {saving ? 'Đang lưu…' : 'Lưu cấu hình nội dung'}
                            </button>
                        </div>
                    </>
                )}
            </section>

            {error && (
                <section className={styles.filterSection} style={{ borderColor: '#fecaca', background: '#fef2f2', padding: 16 }}>
                    <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                    <button type="button" className={styles.btnPrimary} style={{ marginTop: 12 }} onClick={() => void load()}>
                        Thử lại
                    </button>
                </section>
            )}

            {loading && (
                <div style={{ padding: 16 }}>
                    <Skeleton className="h-10 w-1/3 rounded-xl" />
                    <Skeleton className="mt-3 h-28 w-full rounded-2xl" />
                </div>
            )}

            {!loading && detail && (
                <div className={styles.editorContainer}>
                    <aside className={styles.questionListSidebar}>
                        <div style={{ display: 'grid', gap: 8 }}>
                            <button
                                type="button"
                                className={styles.btnPrimary}
                                style={{ width: '100%', borderRadius: 12 }}
                                onClick={() => setShowTemplatePicker((prev) => !prev)}
                            >
                                + Thêm khối học tập
                            </button>
                            {showTemplatePicker && (
                                <div style={{ border: '1px solid #dbeafe', borderRadius: 12, padding: 10, background: '#eff6ff', display: 'grid', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                                    {templates.map((template) => (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => handleAddBlockFromTemplate(template)}
                                            style={{ textAlign: 'left', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 12px', background: 'white' }}
                                        >
                                            <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8' }}>{template.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{template.kind}</div>
                                        </button>
                                    ))}
                                    {templates.length === 0 && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Không có template khả dụng.</p>}
                                </div>
                            )}
                        </div>

                        <div className={styles.questionListScroll}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 4px' }}>Khối học tập</p>
                            {blocks.length === 0 && (
                                <p style={{ fontSize: 12, color: '#94a3b8' }}>Chưa có khối học tập từ API.</p>
                            )}
                            {blocks.map((block, blockIndex) => {
                                const snippet = block.content.length > 64 ? `${block.content.slice(0, 64)}…` : block.content;
                                return (
                                    <div
                                        key={block.id}
                                        className={`${styles.qItemCard} ${selectedBlock?.id === block.id ? styles.qItemCardActive : ''}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'stretch',
                                            gap: 6,
                                            padding: '6px 8px',
                                            width: '100%',
                                            minHeight: 0,
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const from = Number(e.dataTransfer.getData('application/admin-block-index'));
                                            if (!Number.isFinite(from)) return;
                                            reorderBlocks(from, blockIndex);
                                        }}
                                    >
                                        <button
                                            type="button"
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/admin-block-index', String(blockIndex));
                                                e.dataTransfer.effectAllowed = 'move';
                                            }}
                                            style={{
                                                flexShrink: 0,
                                                width: 22,
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 6,
                                                background: '#f8fafc',
                                                color: '#64748b',
                                                fontSize: 12,
                                                lineHeight: 1,
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'grab',
                                            }}
                                            title="Kéo để đổi thứ tự"
                                            aria-label="Kéo để đổi thứ tự"
                                        >
                                            ⋮⋮
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBlock(block)}
                                            style={{
                                                all: 'unset',
                                                flex: 1,
                                                minWidth: 0,
                                                cursor: 'pointer',
                                                display: 'block',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 800,
                                                            color: '#64748b',
                                                            background: '#f1f5f9',
                                                            padding: '2px 6px',
                                                            borderRadius: 4,
                                                        }}
                                                        title="Thứ tự trong bài học"
                                                    >
                                                        #{block.displayOrder + 1}
                                                    </span>
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6' }}>{block.type}</span>
                                                </span>
                                                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                                                    {block.isGradable ? `${block.points}đ` : '—'}
                                                </span>
                                            </div>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 12,
                                                    color: '#334155',
                                                    lineHeight: 1.35,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={block.content}
                                            >
                                                {snippet || `Khối #${blockIndex + 1}`}
                                            </p>
                                            <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, display: 'inline-block' }}>
                                                {difficultyLabel(block.difficultyLevel)}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteBlock(block.id);
                                            }}
                                            title="Xóa thẻ"
                                            style={{
                                                flexShrink: 0,
                                                alignSelf: 'flex-start',
                                                border: '1px solid #fecaca',
                                                color: '#b91c1c',
                                                background: '#fff1f2',
                                                borderRadius: 6,
                                                padding: '2px 6px',
                                                fontSize: 11,
                                                fontWeight: 700,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
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
                            <span style={{ color: '#3b82f6' }}>Tổng số khối: {blocks.length}</span>
                            <span style={{ color: '#64748b' }}>Tổng điểm: {totalPoints}</span>
                        </div>
                    </aside>

                    <section className={styles.editorMain}>
                        {selectedBlock && (
                            <>
                                <div className={styles.infoRow}>
                                    <div className={styles.infoGroup}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Loại khối</span>
                                            <span className={styles.infoValue} style={{ color: '#3b82f6' }}>
                                                {selectedBlock.type}
                                            </span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Điểm số</span>
                                            <span className={styles.infoValue} style={{ textAlign: 'center' }}>
                                                {selectedBlock.isGradable ? selectedBlock.points : '—'}
                                            </span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Mức độ khó</span>
                                            <span className={styles.infoValue}>{difficultyLabel(selectedBlock.difficultyLevel)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', background: '#fafafa' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={selectedBlock.isGradable} onChange={toggleGradable} />
                                            Khối chấm điểm
                                        </label>
                                        {selectedBlock.isGradable && (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                                <span style={{ color: '#64748b' }}>Điểm tối đa</span>
                                                <input
                                                    className={styles.stepperInput}
                                                    type="number"
                                                    min={1}
                                                    style={{ maxWidth: 80 }}
                                                    value={selectedBlock.points}
                                                    onChange={(e) => handleChangeSelectedScore(Number(e.target.value))}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <p style={{ ...compactLabel, marginBottom: 10 }}>Chỉnh sửa nội dung</p>
                                    <BlockPayloadEditor
                                        block={selectedBlock}
                                        orderIndex={selectedBlock.displayOrder}
                                        onPatch={(next) => patchBlock(next.id, next)}
                                    />
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <p style={{ ...compactLabel, marginBottom: 8 }}>Xem trước (học viên)</p>
                                    <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', maxHeight: 280, overflowY: 'auto', background: '#fff' }}>
                                        <div style={{ transform: 'scale(0.92)', transformOrigin: 'top left', width: '108%' }}>
                                            <LessonBlockStep
                                                block={{
                                                    id: selectedBlock.id,
                                                    kind: selectedBlock.kind,
                                                    payload: normalizePayloadForKind(selectedBlock.kind, selectedBlock.payload),
                                                    orderIndex: selectedBlock.displayOrder,
                                                    isGradable: selectedBlock.isGradable,
                                                    maxScore: selectedBlock.isGradable ? selectedBlock.points : null,
                                                    createdAt: '',
                                                    updatedAt: '',
                                                }}
                                                readOnly
                                                onStateChange={() => { }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteBlock(selectedBlock.id)}
                                        style={{ border: '1px solid #fecaca', color: '#b91c1c', background: '#fff1f2', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 700 }}
                                    >
                                        Xóa thẻ đang chọn
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            )}

            </div>
        </BaseAdminLayout>
    );
};
