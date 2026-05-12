import React, { useEffect, useMemo, useState } from 'react';
import { ContentBlockResponse } from '@/shared/types/learning';
import { AttemptReviewAnswerResponse } from '@/shared/types/assessment';
import { LazyImage } from '@/shared/components/LazyImage';

type BlockProgressStatus = 'IN_PROGRESS' | 'COMPLETED';
const gradableKinds = new Set(['QUIZ_MCQ', 'FILL_IN_THE_BLANKS', 'SHORT_ANSWER', 'MATCHING', 'ORDERING']);

export interface LessonBlockStepProgress {
    status: BlockProgressStatus;
    userAnswer?: string;
}

interface LessonBlockStepProps {
    block: ContentBlockResponse | null;
    legacyContent?: string | null;
    resultRevealRequested?: boolean;
    readOnly?: boolean;
    reviewAnswer?: AttemptReviewAnswerResponse | null;
    /** When not read-only, hydrate gradable inputs from a previously saved attempt answer. */
    prefillUserAnswer?: string | null;
    onStateChange: (state: { canContinue: boolean; progress: LessonBlockStepProgress }) => void;
}

const baseCardClassName = 'rounded-2xl border border-gray-200 bg-white p-5';
type GenericPayload = Record<string, unknown>;
type MatchingPair = { left: string; right: string };
type OrderingItem = { id: string; label: string };

export function LessonBlockStep({
    block,
    legacyContent,
    resultRevealRequested = false,
    readOnly = false,
    reviewAnswer = null,
    prefillUserAnswer = null,
    onStateChange,
}: LessonBlockStepProps) {
    const kind = normalizeBlockKind(block?.kind);
    /** Chỉ các block có isGradable và kind hỗ trợ chấm mới hiện UI nhập đáp án / badge chấm điểm. */
    const blockNeedsGradableLearnerFlow = Boolean(block?.isGradable && gradableKinds.has(kind));
    const payload = useMemo(() => parsePayload(block?.payload), [block?.payload]);
    const matchingPairs = useMemo(() => parseMatchingPairs(payload), [payload]);
    const matchingOptions = useMemo(() => uniqueStrings(matchingPairs.map((pair) => pair.right)), [matchingPairs]);

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [shortAnswer, setShortAnswer] = useState('');
    const [blankAnswer, setBlankAnswer] = useState('');
    const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
    const [orderingItems, setOrderingItems] = useState<OrderingItem[]>(() => parseOrderingItems(payload));
    const [draggingOrderIndex, setDraggingOrderIndex] = useState<number | null>(null);

    useEffect(() => {
        setOrderingItems(parseOrderingItems(payload));
    }, [payload]);

    useEffect(() => {
        if (!readOnly || !blockNeedsGradableLearnerFlow) return;
        const userAnswer = reviewAnswer?.userAnswer ?? '';
        if (!userAnswer) return;

        if (kind === 'QUIZ_MCQ') {
            const options = parseOptions(payload);
            const selected = options.findIndex((option) => normalize(option) === normalize(userAnswer));
            setSelectedOption(selected >= 0 ? selected : null);
            return;
        }

        if (kind === 'SHORT_ANSWER') {
            setShortAnswer(userAnswer);
            return;
        }

        if (kind === 'FILL_IN_THE_BLANKS') {
            setBlankAnswer(userAnswer);
            return;
        }

        if (kind === 'MATCHING') {
            setMatchingSelections(parseMatchingAnswer(userAnswer));
            return;
        }

        if (kind === 'ORDERING') {
            const baseItems = parseOrderingItems(payload);
            const orderedIds = parseOrderingAnswer(userAnswer);
            if (orderedIds.length === 0) {
                setOrderingItems(baseItems);
                return;
            }
            setOrderingItems(reorderByIds(baseItems, orderedIds));
            return;
        }
    }, [blockNeedsGradableLearnerFlow, kind, payload, readOnly, reviewAnswer?.userAnswer]);

    useEffect(() => {
        if (readOnly || !prefillUserAnswer || !blockNeedsGradableLearnerFlow) return;
        const userAnswer = prefillUserAnswer;
        if (!userAnswer) return;

        if (kind === 'QUIZ_MCQ') {
            const options = parseOptions(payload);
            const selected = options.findIndex((option) => normalize(option) === normalize(userAnswer));
            setSelectedOption(selected >= 0 ? selected : null);
            return;
        }

        if (kind === 'SHORT_ANSWER') {
            setShortAnswer(userAnswer);
            return;
        }

        if (kind === 'FILL_IN_THE_BLANKS') {
            setBlankAnswer(userAnswer);
            return;
        }

        if (kind === 'MATCHING') {
            setMatchingSelections(parseMatchingAnswer(userAnswer));
            return;
        }

        if (kind === 'ORDERING') {
            const baseItems = parseOrderingItems(payload);
            const orderedIds = parseOrderingAnswer(userAnswer);
            if (orderedIds.length === 0) {
                setOrderingItems(baseItems);
                return;
            }
            setOrderingItems(reorderByIds(baseItems, orderedIds));
            return;
        }
    }, [block?.id, blockNeedsGradableLearnerFlow, kind, payload, readOnly, prefillUserAnswer]);

    useEffect(() => {
        if (!block) {
            onStateChange({ canContinue: true, progress: { status: 'IN_PROGRESS' } });
            return;
        }
        if (!blockNeedsGradableLearnerFlow) {
            onStateChange({ canContinue: true, progress: { status: 'COMPLETED' } });
            return;
        }

        let userAnswer = '';
        if (kind === 'QUIZ_MCQ') {
            const options = parseOptions(payload);
            userAnswer = selectedOption === null ? '' : String(options[selectedOption] ?? '');
        } else if (kind === 'SHORT_ANSWER') {
            userAnswer = shortAnswer.trim();
        } else if (kind === 'FILL_IN_THE_BLANKS') {
            userAnswer = blankAnswer.trim();
        } else if (kind === 'MATCHING') {
            const hasMappedAll = matchingPairs.length > 0
                && matchingPairs.every((pair) => (matchingSelections[pair.left] ?? '').trim().length > 0);
            userAnswer = hasMappedAll
                ? JSON.stringify(matchingPairs.map((pair) => ({
                    left: pair.left,
                    right: matchingSelections[pair.left],
                })))
                : '';
        } else if (kind === 'ORDERING') {
            userAnswer = orderingItems.length > 0
                ? JSON.stringify(orderingItems.map((item) => item.id))
                : '';
        }

        const hasAnswer = userAnswer.length > 0 || readOnly;
        onStateChange({
            canContinue: readOnly ? true : hasAnswer,
            progress: {
                status: hasAnswer ? 'COMPLETED' : 'IN_PROGRESS',
                userAnswer,
            },
        });
    }, [
        block,
        kind,
        onStateChange,
        payload,
        resultRevealRequested,
        selectedOption,
        shortAnswer,
        blankAnswer,
        matchingPairs,
        matchingSelections,
        orderingItems,
        readOnly,
        blockNeedsGradableLearnerFlow,
    ]);

    const reviewTone = getReviewTone(reviewAnswer);
    const reviewBadge =
        readOnly && blockNeedsGradableLearnerFlow ? (
            <div className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold ${reviewTone.className}`}>
                {reviewTone.label}
            </div>
        ) : null;

    if (!block) {
        return (
            <section className={baseCardClassName}>
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{legacyContent || 'Nội dung bài học hiện chưa có trong service.'}</p>
            </section>
        );
    }

    if (kind === 'QUIZ_MCQ') {
        const options = parseOptions(payload);
        if (!blockNeedsGradableLearnerFlow) {
            return (
                <section className={baseCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nội dung học</p>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">{readText(payload, ['question', 'prompt'], 'Câu hỏi trắc nghiệm')}</h3>
                    <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-700">
                        {options.map((option, index) => (
                            <li key={`ro-opt-${index}`}>{String(option)}</li>
                        ))}
                    </ol>
                </section>
            );
        }
        return (
            <section className={baseCardClassName}>
                <h3 className="text-lg font-bold text-gray-900">{readText(payload, ['question', 'prompt'], 'Câu hỏi trắc nghiệm')}</h3>
                {reviewBadge}
                <div className="mt-4 grid gap-3">
                    {options.map((option, index) => (
                        <button
                            key={`${option}-${index}`}
                            type="button"
                            onClick={() => {
                                if (readOnly) return;
                                setSelectedOption(index);
                            }}
                            disabled={readOnly}
                            className={`rounded-xl border px-4 py-3 text-left text-sm ${selectedOption === index
                                ? 'border-[#2aa4e8] bg-[#f3fbff] text-[#126b98]'
                                : 'border-gray-200 bg-white text-gray-700'} ${readOnly ? 'cursor-not-allowed opacity-90' : ''
                                }`}
                        >
                            {String(option)}
                        </button>
                    ))}
                </div>
                {resultRevealRequested && selectedOption !== null ? <p className="mt-3 text-sm font-semibold text-[#126b98]">Đã lưu đáp án để backend chấm.</p> : null}
            </section>
        );
    }

    if (kind === 'SHORT_ANSWER') {
        if (!blockNeedsGradableLearnerFlow) {
            return (
                <section className={baseCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nội dung học</p>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">{readText(payload, ['prompt', 'question'], 'Câu trả lời ngắn')}</h3>
                    {readText(payload, ['hint', 'description'], '') ? (
                        <p className="mt-3 text-sm text-gray-600">{readText(payload, ['hint', 'description'], '')}</p>
                    ) : null}
                </section>
            );
        }
        return (
            <section className={baseCardClassName}>
                <h3 className="text-lg font-bold text-gray-900">{readText(payload, ['prompt', 'question'], 'Nhập câu trả lời ngắn')}</h3>
                {reviewBadge}
                <textarea
                    value={shortAnswer}
                    onChange={(event) => {
                        if (readOnly) return;
                        setShortAnswer(event.target.value);
                    }}
                    disabled={readOnly}
                    className="mt-4 min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2aa4e8]"
                    placeholder="Nhập câu trả lời của bạn..."
                />
                {resultRevealRequested && shortAnswer.trim() ? <p className="mt-3 text-sm font-semibold text-[#126b98]">Đã gửi câu trả lời để hệ thống AI chấm.</p> : null}
            </section>
        );
    }

    if (kind === 'FILL_IN_THE_BLANKS') {
        if (!blockNeedsGradableLearnerFlow) {
            return (
                <section className={baseCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nội dung học</p>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">{readText(payload, ['prompt', 'template'], 'Điền đáp án')}</h3>
                </section>
            );
        }
        return (
            <section className={baseCardClassName}>
                <h3 className="text-lg font-bold text-gray-900">{readText(payload, ['prompt', 'template'], 'Điền đáp án')}</h3>
                {reviewBadge}
                <input
                    value={blankAnswer}
                    onChange={(event) => {
                        if (readOnly) return;
                        setBlankAnswer(event.target.value);
                    }}
                    disabled={readOnly}
                    className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2aa4e8]"
                    placeholder="Nhập câu trả lời (ví dụ: đáp án1|đáp án2)"
                />
            </section>
        );
    }

    if (kind === 'MATCHING') {
        if (!blockNeedsGradableLearnerFlow) {
            return (
                <section className={baseCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nội dung học</p>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">{readText(payload, ['prompt'], 'Ghép cặp')}</h3>
                    <div className="mt-4 space-y-2">
                        {matchingPairs.map((pair, index) => (
                            <div key={`ro-m-${index}`} className="flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                                <span className="font-semibold">{pair.left}</span>
                                <span className="text-gray-400">→</span>
                                <span>{pair.right}</span>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }
        const showMissing = resultRevealRequested && matchingPairs.some((pair) => !(matchingSelections[pair.left] ?? '').trim());
        return (
            <section className={baseCardClassName}>
                <h3 className="text-lg font-bold text-gray-900">{readText(payload, ['prompt'], 'Ghép cặp')}</h3>
                {reviewBadge}
                <div className="mt-4 space-y-3">
                    {matchingPairs.map((pair, index) => (
                        <div key={`matching-${index}`} className="grid gap-2 rounded-xl border border-gray-200 p-3 md:grid-cols-[1fr_1fr] md:items-center">
                            <p className="text-sm font-semibold text-gray-800">{pair.left}</p>
                            <select
                                value={matchingSelections[pair.left] ?? ''}
                                onChange={(event) => {
                                    if (readOnly) return;
                                    setMatchingSelections((prev) => {
                                        const next = { ...prev };
                                        next[pair.left] = event.target.value;
                                        return next;
                                    });
                                }}
                                disabled={readOnly}
                                className={`rounded-lg border px-3 py-2 text-sm text-gray-700 outline-none ${showMissing && !(matchingSelections[pair.left] ?? '').trim()
                                    ? 'border-red-400 bg-red-50'
                                    : 'border-gray-300 bg-white focus:border-[#2aa4e8]'
                                    }`}
                            >
                                <option value="">Chọn đáp án tương ứng</option>
                                {matchingOptions.map((option) => (
                                    <option key={`${option}-${index}`} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
                {showMissing ? (
                    <p className="mt-3 text-sm font-semibold text-red-600">Vui lòng ghép đầy đủ tất cả cặp trước khi tiếp tục.</p>
                ) : null}
            </section>
        );
    }

    if (kind === 'ORDERING') {
        if (!blockNeedsGradableLearnerFlow) {
            return (
                <section className={baseCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nội dung học</p>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">{readText(payload, ['prompt'], 'Sắp xếp thứ tự')}</h3>
                    <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-800">
                        {orderingItems.map((item) => (
                            <li key={item.id}>{item.label}</li>
                        ))}
                    </ol>
                </section>
            );
        }
        return (
            <section className={baseCardClassName}>
                <h3 className="text-lg font-bold text-gray-900">{readText(payload, ['prompt'], 'Sắp xếp thứ tự')}</h3>
                {reviewBadge}
                <p className="mt-2 text-sm text-gray-600">{readOnly ? 'Đây là thứ tự bạn đã nộp.' : 'Kéo-thả để sắp xếp đúng thứ tự.'}</p>
                <div className="mt-4 space-y-2">
                    {orderingItems.map((item, index) => (
                        <div
                            key={item.id}
                            draggable={!readOnly}
                            onDragStart={() => {
                                if (readOnly) return;
                                setDraggingOrderIndex(index);
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => {
                                if (readOnly) return;
                                if (draggingOrderIndex === null || draggingOrderIndex === index) {
                                    setDraggingOrderIndex(null);
                                    return;
                                }
                                setOrderingItems((prev) => reorderItems(prev, draggingOrderIndex, index));
                                setDraggingOrderIndex(null);
                            }}
                            onDragEnd={() => setDraggingOrderIndex(null)}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm text-gray-800 ${draggingOrderIndex === index
                                ? 'border-[#2aa4e8] bg-[#f3fbff]'
                                : 'border-gray-200 bg-white'} ${readOnly ? 'cursor-default' : 'cursor-grab'
                                }`}
                        >
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{index + 1}</span>
                            <span className="flex-1 font-medium">{item.label}</span>
                            <span className="text-gray-400">⠿</span>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (kind === 'INFOGRAPHIC') {
        const title = readText(payload, ['title'], 'Infographic');
        const caption = readText(payload, ['caption', 'content'], '');
        const imageUrl = readText(payload, ['imageUrl'], '');
        const videoUrl = readText(payload, ['videoUrl'], '');
        const mediaType = readText(payload, ['mediaType'], imageUrl ? 'image' : videoUrl ? 'video' : '');

        return (
            <section className="rounded-2xl border border-[#bfe6fb] bg-[#f3fbff] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Infographic</p>
                <h3 className="mt-2 text-lg font-bold text-[#126b98]">{title}</h3>
                {mediaType === 'video' && videoUrl ? (
                    <video controls src={videoUrl} className="mt-4 max-h-[420px] w-full rounded-xl bg-black/90" />
                ) : imageUrl ? (
                    <LazyImage src={imageUrl} alt={title} className="mt-4 h-[320px] w-full rounded-xl border border-white bg-white object-contain" />
                ) : (
                    <p className="mt-4 text-sm text-[#126b98]">Không có media để hiển thị.</p>
                )}
                {caption ? <p className="mt-3 text-sm text-[#126b98]">{caption}</p> : null}
            </section>
        );
    }

    if (kind === 'RICH_TEXT') {
        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Learn</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{readText(payload, ['title'], 'Nội dung học')}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {readText(payload, ['body', 'content', 'description'], 'Nội dung chưa có.')}
                </p>
            </section>
        );
    }

    if (kind === 'FLASHCARD') {
        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Flashcard</p>
                <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Front</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{readText(payload, ['front'], 'Mặt trước')}</p>
                </div>
                <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Back</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{readText(payload, ['back'], 'Mặt sau')}</p>
                </div>
            </section>
        );
    }

    if (kind === 'TIMELINE') {
        const events = Array.isArray(payload.events) ? payload.events : [];
        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Timeline</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{readText(payload, ['title'], 'Dòng thời gian')}</h3>
                <div className="mt-4 space-y-4">
                    {events.length === 0 ? (
                        <p className="text-sm text-gray-600">Chưa có mốc sự kiện.</p>
                    ) : (
                        events.map((event, index) => {
                            const item = (event ?? {}) as GenericPayload;
                            return (
                                <div key={`timeline-${index}`} className="relative border-l-2 border-[#bfe6fb] pl-4">
                                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#2aa4e8]" />
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">
                                        {readText(item, ['time', 'date'], `Mốc ${index + 1}`)}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{readText(item, ['title'], `Sự kiện ${index + 1}`)}</p>
                                    <p className="mt-1 text-sm text-gray-700">{readText(item, ['description'], '')}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className={baseCardClassName}>
            <h3 className="text-base font-bold text-gray-900">{readText(payload, ['title', 'question', 'prompt'], block.kind)}</h3>
            {readText(payload, ['content', 'description', 'body'], '') ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">{readText(payload, ['content', 'description', 'body'], '')}</p>
            ) : (
                <pre className="mt-2 overflow-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-600">{JSON.stringify(payload, null, 2)}</pre>
            )}
        </section>
    );
}

function parsePayload(payload?: string) {
    if (!payload) return {};
    try {
        return JSON.parse(payload) as Record<string, unknown>;
    } catch {
        return {};
    }
}

function normalizeBlockKind(kind?: string) {
    const value = String(kind ?? '').trim().toUpperCase();
    if (value === 'QUIZ' || value === 'MCQ') return 'QUIZ_MCQ';
    if (value === 'FILL_BLANKS' || value === 'FILL_IN_BLANKS') return 'FILL_IN_THE_BLANKS';
    if (value === 'LEARNING' || value === 'LEARN') return 'RICH_TEXT';
    return value;
}

function readText(payload: GenericPayload, keys: string[], fallback: string): string {
    for (const key of keys) {
        const value = payload[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value;
        }
    }
    return fallback;
}

function parseOptions(payload: GenericPayload): string[] {
    const raw = payload.options;
    if (!Array.isArray(raw)) return [];
    return raw.map((option) => {
        if (typeof option === 'string') return option;
        const item = (option ?? {}) as GenericPayload;
        return readText(item, ['label', 'text', 'value', 'content'], JSON.stringify(item));
    });
}

function parseMatchingPairs(payload: GenericPayload): MatchingPair[] {
    const raw = payload.pairs;
    if (!Array.isArray(raw)) return [];
    return raw
        .map((pair) => {
            const item = (pair ?? {}) as GenericPayload;
            return {
                left: readText(item, ['left', 'term'], ''),
                right: readText(item, ['right', 'definition'], ''),
            };
        })
        .filter((pair) => pair.left.length > 0 && pair.right.length > 0);
}

function uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}

function parseOrderingItems(payload: GenericPayload): OrderingItem[] {
    const raw = payload.items;
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item, index) => {
            if (typeof item === 'string') {
                return { id: item.trim() || `item-${index + 1}`, label: item.trim() || `Item ${index + 1}` };
            }
            const data = (item ?? {}) as GenericPayload;
            const label = readText(data, ['text', 'label', 'content'], `Item ${index + 1}`);
            const stableKey = readText(data, ['stableKey', 'key', 'id'], '');
            return { id: stableKey || label, label };
        })
        .filter((item) => item.label.length > 0);
}

function reorderItems(items: OrderingItem[], fromIndex: number, toIndex: number): OrderingItem[] {
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
}

function parseMatchingAnswer(value: string): Record<string, string> {
    try {
        const parsed = JSON.parse(value) as Array<{ left?: string; right?: string }>;
        if (!Array.isArray(parsed)) return {};
        return parsed.reduce<Record<string, string>>((acc, item) => {
            const left = String(item.left ?? '').trim();
            const right = String(item.right ?? '').trim();
            if (left && right) acc[left] = right;
            return acc;
        }, {});
    } catch {
        return {};
    }
}

function parseOrderingAnswer(value: string): string[] {
    try {
        const parsed = JSON.parse(value) as string[];
        if (!Array.isArray(parsed)) return [];
        return parsed.map((item) => String(item).trim()).filter((item) => item.length > 0);
    } catch {
        return [];
    }
}

function reorderByIds(items: OrderingItem[], orderedIds: string[]): OrderingItem[] {
    const map = new Map(items.map((item) => [item.id, item]));
    const picked = orderedIds.map((id) => map.get(id)).filter((item): item is OrderingItem => Boolean(item));
    const pickedIds = new Set(picked.map((item) => item.id));
    const remaining = items.filter((item) => !pickedIds.has(item.id));
    return [...picked, ...remaining];
}

function getReviewTone(answer: AttemptReviewAnswerResponse | null) {
    if (!answer || answer.gradingStatus !== 'FINALIZED' || answer.correct === null) {
        return { className: 'border-amber-200 bg-amber-50 text-amber-700', label: 'Đang chờ chấm điểm' };
    }
    if (answer.correct) {
        return { className: 'border-green-200 bg-green-50 text-green-700', label: 'Đúng' };
    }
    return { className: 'border-red-200 bg-red-50 text-red-700', label: 'Sai' };
}

function normalize(value: string): string {
    return value.trim().toLowerCase();
}
