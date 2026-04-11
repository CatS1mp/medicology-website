import React, { useEffect, useMemo, useState } from 'react';
import { LessonContentBlockResponse, LessonInfographicPayload } from '@/shared/types/learning';

type BlockProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface LessonBlockStepProgress {
    status: BlockProgressStatus;
    score?: number;
    maxScore?: number;
}

interface LessonBlockStepProps {
    block: LessonContentBlockResponse | null;
    legacyContent?: string | null;
    resultRevealRequested?: boolean;
    onStateChange: (state: { canContinue: boolean; progress: LessonBlockStepProgress; actionMode?: 'check' | 'continue' }) => void;
}

interface QuizPayload {
    question?: string;
    prompt?: string;
    options?: string[];
    correctOptionIndex?: number;
    explanation?: string;
}

interface FillInTheBlanksPayload {
    template?: string;
    answers?: string[];
    options?: string[];
}

interface ShortAnswerPayload {
    prompt?: string;
    question?: string;
    sampleAnswer?: string;
}

interface FlashcardPayload {
    front?: string;
    back?: string;
}

interface MatchingPairItem {
    left: string;
    right: string;
}

interface MatchingPayload {
    prompt?: string;
    pairs?: Array<{ left?: string; right?: string; term?: string; definition?: string }>;
}

interface OrderingPayload {
    prompt?: string;
    items?: Array<string | { text?: string; label?: string }>;
    correctOrder?: string[];
}

interface HotspotPayload {
    imageUrl?: string;
    title?: string;
    hotspots?: Array<{ label?: string; description?: string; isCorrect?: boolean }>;
    correctHotspotIndex?: number;
}

interface TimelinePayload {
    title?: string;
    events?: Array<{ title?: string; description?: string; time?: string; date?: string }>;
}

const baseCardClassName = 'rounded-2xl border border-gray-200 bg-white p-5';

export function LessonBlockStep({ block, legacyContent, resultRevealRequested = false, onStateChange }: LessonBlockStepProps) {
    const normalizedKind = normalizeBlockKind(block?.kind);
    const payload = useMemo(() => parsePayload(block?.payload), [block?.payload]);
    const initialAnswerCount = useMemo(() => {
        if (normalizedKind !== 'FILL_IN_THE_BLANKS') {
            return 0;
        }
        const fillPayload = payload as FillInTheBlanksPayload;
        return Array.isArray(fillPayload.answers) ? fillPayload.answers.length : 0;
    }, [normalizedKind, payload]);

    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const [activeBlankIndex, setActiveBlankIndex] = useState(0);
    const [blankValues, setBlankValues] = useState<string[]>(() => new Array(initialAnswerCount).fill(''));
    const [shortAnswerText, setShortAnswerText] = useState('');
    const [flashcardFlipped, setFlashcardFlipped] = useState(false);
    const [selectedHotspotIndex, setSelectedHotspotIndex] = useState<number | null>(null);

    const matchingPairs = useMemo(() => parseMatchingPairs(payload as MatchingPayload), [payload]);
    const [matchingSelections, setMatchingSelections] = useState<string[]>(() => new Array(matchingPairs.length).fill(''));

    const orderingBaseItems = useMemo(() => parseOrderingItems(payload as OrderingPayload), [payload]);
    const [orderingItems, setOrderingItems] = useState<string[]>(orderingBaseItems);

    useEffect(() => {
        if (!block) {
            onStateChange({
                canContinue: true,
                progress: { status: 'IN_PROGRESS' },
            });
            return;
        }

        if (normalizedKind === 'QUIZ_MCQ') {
            const quizPayload = payload as QuizPayload;
            const hasAnswer = selectedOption !== null;
            const correctIndex = Number(quizPayload.correctOptionIndex ?? -1);
            const isCorrect = selectedOption === correctIndex;
            const checked = resultRevealRequested && hasAnswer;
            onStateChange({
                canContinue: true,
                actionMode: checked ? 'continue' : 'check',
                progress: {
                    status: checked ? 'COMPLETED' : 'IN_PROGRESS',
                    score: checked ? (isCorrect ? 1 : 0) : undefined,
                    maxScore: checked ? 1 : undefined,
                },
            });
            return;
        }

        if (normalizedKind === 'FILL_IN_THE_BLANKS') {
            const fillPayload = payload as FillInTheBlanksPayload;
            const answers = Array.isArray(fillPayload.answers) ? fillPayload.answers : [];
            const allFilled = answers.length > 0 && blankValues.length === answers.length && blankValues.every((value) => value.trim() !== '');
            const checked = resultRevealRequested && allFilled;
            let score: number | undefined;
            if (allFilled) {
                score = answers.reduce((total, answer, index) => {
                    return total + (normalizeText(answer) === normalizeText(blankValues[index] ?? '') ? 1 : 0);
                }, 0);
            }
            onStateChange({
                canContinue: true,
                actionMode: checked ? 'continue' : 'check',
                progress: {
                    status: checked ? 'COMPLETED' : 'IN_PROGRESS',
                    score: checked ? score : undefined,
                    maxScore: checked && answers.length > 0 ? answers.length : undefined,
                },
            });
            return;
        }

        if (normalizedKind === 'SHORT_ANSWER') {
            const hasAnswer = shortAnswerText.trim().length > 0;
            const shortAnswerPayload = payload as ShortAnswerPayload;
            const sampleAnswer = String(shortAnswerPayload.sampleAnswer ?? '').trim();
            const isCorrect = sampleAnswer ? normalizeText(shortAnswerText) === normalizeText(sampleAnswer) : undefined;
            const checked = resultRevealRequested && hasAnswer;
            onStateChange({
                canContinue: true,
                actionMode: checked ? 'continue' : 'check',
                progress: {
                    status: checked ? 'COMPLETED' : 'IN_PROGRESS',
                    score: checked && isCorrect !== undefined ? (isCorrect ? 1 : 0) : undefined,
                    maxScore: checked && isCorrect !== undefined ? 1 : undefined,
                },
            });
            return;
        }

        if (normalizedKind === 'MATCHING') {
            const allSelected =
                matchingPairs.length > 0 &&
                matchingSelections.length === matchingPairs.length &&
                matchingSelections.every((value) => value.trim().length > 0);
            const matchingChecked = resultRevealRequested && allSelected;
            const score = matchingPairs.reduce((total, pair, index) => {
                return total + (normalizeText(matchingSelections[index] ?? '') === normalizeText(pair.right) ? 1 : 0);
            }, 0);

            onStateChange({
                canContinue: true,
                actionMode: matchingChecked ? 'continue' : 'check',
                progress: {
                    status: allSelected && matchingChecked ? 'COMPLETED' : 'IN_PROGRESS',
                    score: allSelected && matchingChecked ? score : undefined,
                    maxScore: allSelected && matchingChecked && matchingPairs.length > 0 ? matchingPairs.length : undefined,
                },
            });
            return;
        }

        if (normalizedKind === 'ORDERING') {
            const orderingPayload = payload as OrderingPayload;
            const expectedOrder = parseOrderingExpectedOrder(orderingPayload, orderingBaseItems);
            const hasExpectedOrder = expectedOrder.length === orderingItems.length && expectedOrder.length > 0;
            const isCorrectOrder = hasExpectedOrder && orderingItems.every((item, index) => normalizeText(item) === normalizeText(expectedOrder[index]));
            const orderingChecked = resultRevealRequested;
            onStateChange({
                canContinue: true,
                actionMode: orderingChecked ? 'continue' : 'check',
                progress: {
                    status: orderingChecked ? 'COMPLETED' : 'IN_PROGRESS',
                    score: orderingChecked && hasExpectedOrder ? (isCorrectOrder ? 1 : 0) : undefined,
                    maxScore: orderingChecked && hasExpectedOrder ? 1 : undefined,
                },
            });
            return;
        }

        if (normalizedKind === 'HOTSPOT_IMAGE') {
            const hasPickedHotspot = selectedHotspotIndex !== null;
            const hotspotPayload = payload as HotspotPayload;
            const correctIndex = getHotspotCorrectIndex(hotspotPayload, Array.isArray(hotspotPayload.hotspots) ? hotspotPayload.hotspots.length : 0);
            const isCorrect = correctIndex !== null && selectedHotspotIndex === correctIndex;
            const checked = resultRevealRequested && hasPickedHotspot;
            onStateChange({
                canContinue: true,
                actionMode: checked ? 'continue' : 'check',
                progress: {
                    status: checked ? 'COMPLETED' : 'IN_PROGRESS',
                    score: checked && correctIndex !== null ? (isCorrect ? 1 : 0) : undefined,
                    maxScore: checked && correctIndex !== null ? 1 : undefined,
                },
            });
            return;
        }

        onStateChange({
            canContinue: true,
            progress: { status: 'COMPLETED' },
        });
    }, [
        blankValues,
        block,
        matchingPairs,
        matchingSelections,
        resultRevealRequested,
        normalizedKind,
        onStateChange,
        orderingBaseItems,
        orderingItems,
        payload,
        selectedHotspotIndex,
        selectedOption,
        shortAnswerText,
    ]);

    if (!block) {
        return (
            <section className={baseCardClassName}>
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {legacyContent || 'Nội dung bài học hiện chưa có trong service.'}
                </p>
            </section>
        );
    }

    if (normalizedKind === 'RICH_TEXT') {
        const content = String(payload.body ?? payload.content ?? payload.description ?? '');
        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Learn</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{String(payload.title ?? 'Nội dung học')}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">{content}</p>
            </section>
        );
    }

    if (normalizedKind === 'INFOGRAPHIC') {
        const infographicPayload = payload as LessonInfographicPayload;
        const inferredMediaType =
            infographicPayload.mediaType ??
            (infographicPayload.imageUrl ? 'image' : infographicPayload.videoUrl ? 'video' : 'image');

        return (
            <section className="rounded-2xl border border-[#bfe6fb] bg-[#f3fbff] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Infographic</p>
                <h3 className="mt-2 text-lg font-bold text-[#126b98]">{String(infographicPayload.title ?? 'Infographic')}</h3>
                {inferredMediaType === 'video' && infographicPayload.videoUrl ? (
                    <video
                        controls
                        poster={infographicPayload.posterUrl}
                        src={infographicPayload.videoUrl}
                        className="mt-4 max-h-[420px] w-full rounded-xl bg-black/90"
                    />
                ) : infographicPayload.imageUrl ? (
                    <div
                        role="img"
                        aria-label={infographicPayload.title || 'Infographic image'}
                        className="mt-4 h-[320px] w-full rounded-xl bg-white bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${infographicPayload.imageUrl})` }}
                    />
                ) : null}
                {infographicPayload.caption ? (
                    <p className="mt-3 text-sm text-[#126b98]">{infographicPayload.caption}</p>
                ) : null}
            </section>
        );
    }

    if (normalizedKind === 'QUIZ_MCQ') {
        const quizPayload = payload as QuizPayload;
        const options = Array.isArray(quizPayload.options) ? quizPayload.options : [];
        const correctIndex = Number(quizPayload.correctOptionIndex ?? -1);
        const showMissing = resultRevealRequested && selectedOption === null;
        const showFeedback = resultRevealRequested && selectedOption !== null;

        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Quiz</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{String(quizPayload.question ?? quizPayload.prompt ?? 'Câu hỏi trắc nghiệm')}</h3>
                <div className="mt-4 grid gap-3">
                    {options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        const isCorrectOption = index === correctIndex;
                        const isWrongSelected = showFeedback && isSelected && !isCorrectOption;
                        const isGreen = showFeedback && isCorrectOption;
                        const isBlueSelected = !showFeedback && isSelected;

                        const optionClassName = isGreen
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : isWrongSelected
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : isBlueSelected
                                    ? 'border-[#2aa4e8] bg-[#f3fbff] text-[#126b98]'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300';

                        const bulletClassName = isGreen
                            ? 'border-green-500 bg-green-500 text-white'
                            : isWrongSelected
                                ? 'border-red-500 bg-red-500 text-white'
                                : isBlueSelected
                                    ? 'border-[#2aa4e8] bg-[#2aa4e8] text-white'
                                    : 'border-gray-300 bg-white text-gray-500';

                        return (
                            <button
                                key={`${option}-${index}`}
                                type="button"
                                onClick={() => setSelectedOption(index)}
                                className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${optionClassName}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold ${bulletClassName}`}
                                    >
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="text-sm font-semibold uppercase tracking-[0.08em]">{option}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="mt-4 flex items-center gap-3">
                    {showFeedback ? (
                        <p className={`text-sm font-semibold ${selectedOption === correctIndex ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedOption === correctIndex ? 'Chính xác' : 'Chưa đúng'}
                        </p>
                    ) : null}
                    {showMissing ? <p className="text-sm font-semibold text-red-600">Vui lòng chọn một đáp án.</p> : null}
                </div>
                {showFeedback && quizPayload.explanation ? (
                    <p className="mt-3 text-sm text-gray-600">{quizPayload.explanation}</p>
                ) : null}
            </section>
        );
    }

    if (normalizedKind === 'FILL_IN_THE_BLANKS') {
        const fillPayload = payload as FillInTheBlanksPayload;
        const template = String(fillPayload.template ?? payload.questionTemplate ?? '');
        const answers = Array.isArray(fillPayload.answers) ? fillPayload.answers : [];
        const options = (Array.isArray(fillPayload.options) && fillPayload.options.length > 0
            ? fillPayload.options
            : answers
        ).map((item) => String(item));
        const segments = template.split('___');
        const allFilled = answers.length > 0 && blankValues.length === answers.length && blankValues.every((value) => value.trim() !== '');
        const showScore = resultRevealRequested && allFilled && answers.length > 0;
        const showMissing = resultRevealRequested && !allFilled;
        const score = answers.reduce((total, answer, index) => {
            return total + (normalizeText(answer) === normalizeText(blankValues[index] ?? '') ? 1 : 0);
        }, 0);

        const valueClassName = (value: string, answer: string, missing: boolean) => {
            if (!resultRevealRequested) {
                return 'border-gray-200 bg-gray-50 text-gray-700';
            }
            if (missing) {
                return 'border-red-500 bg-red-50 text-red-700';
            }
            return normalizeText(value) === normalizeText(answer)
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-red-500 bg-red-50 text-red-700';
        };

        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Fill in the blanks</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                    {segments.map((segment, segmentIndex) => (
                        <React.Fragment key={`segment-${segmentIndex}`}>
                            {segment}
                            {segmentIndex < segments.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setActiveBlankIndex(segmentIndex)}
                                    className={`min-w-[120px] rounded-lg border px-3 py-1.5 text-left ${
                                        resultRevealRequested
                                            ? valueClassName(
                                                blankValues[segmentIndex] ?? '',
                                                answers[segmentIndex] ?? '',
                                                !(blankValues[segmentIndex] ?? '').trim()
                                            )
                                            : activeBlankIndex === segmentIndex
                                                ? 'border-[#2aa4e8] bg-[#f3fbff] text-[#126b98]'
                                                : 'border-gray-200 bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    {blankValues[segmentIndex] || `Chỗ trống ${segmentIndex + 1}`}
                                </button>
                            ) : null}
                        </React.Fragment>
                    ))}
                </div>
                {options.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {options.map((option, index) => (
                            <button
                                key={`${option}-${index}`}
                                type="button"
                                onClick={() => {
                                    setBlankValues((previous) => {
                                        const next = [...previous];
                                        next[activeBlankIndex] = option;
                                        return next;
                                    });
                                }}
                                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                ) : null}
                <div className="mt-4 flex items-center gap-3">
                    {showScore ? (
                        <p className={`text-sm font-semibold ${score === answers.length ? 'text-green-600' : 'text-red-600'}`}>
                            {score}/{answers.length} đúng
                        </p>
                    ) : null}
                    {showMissing ? <p className="text-sm font-semibold text-red-600">Vui lòng điền tất cả ô trống.</p> : null}
                </div>
            </section>
        );
    }

    if (normalizedKind === 'SHORT_ANSWER') {
        const shortAnswerPayload = payload as ShortAnswerPayload;
        const prompt = String(shortAnswerPayload.prompt ?? shortAnswerPayload.question ?? 'Nhập câu trả lời ngắn');
        const sampleAnswer = String(shortAnswerPayload.sampleAnswer ?? '').trim();
        const hasAnswer = shortAnswerText.trim().length > 0;
        const showMissing = resultRevealRequested && !hasAnswer;
        const isCorrect = sampleAnswer ? normalizeText(shortAnswerText) === normalizeText(sampleAnswer) : null;

        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Short answer</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{prompt}</h3>
                <textarea
                    value={shortAnswerText}
                    onChange={(event) => setShortAnswerText(event.target.value)}
                    className={`mt-4 min-h-[120px] w-full rounded-xl border px-4 py-3 text-sm text-gray-700 outline-none ${
                        showMissing ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#2aa4e8]'
                    }`}
                    placeholder="Nhập câu trả lời của bạn..."
                />
                <div className="mt-3 flex items-center gap-3">
                    {resultRevealRequested && hasAnswer && isCorrect !== null ? (
                        <p className={`text-sm font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? 'Chính xác' : 'Chưa đúng'}
                        </p>
                    ) : null}
                    {showMissing ? <p className="text-sm font-semibold text-red-600">Vui lòng nhập câu trả lời.</p> : null}
                </div>
                {shortAnswerPayload.sampleAnswer ? (
                    <p className={`mt-3 text-xs ${resultRevealRequested ? 'text-gray-700' : 'text-gray-500'}`}>Đáp án tham chiếu: {shortAnswerPayload.sampleAnswer}</p>
                ) : null}
            </section>
        );
    }

    if (normalizedKind === 'FLASHCARD') {
        const flashcardPayload = payload as FlashcardPayload;
        const front = String(flashcardPayload.front ?? 'Mặt trước');
        const back = String(flashcardPayload.back ?? 'Mặt sau');

        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Flashcard</p>
                <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{flashcardFlipped ? 'Back' : 'Front'}</p>
                    <p className="mt-3 whitespace-pre-wrap text-lg font-semibold text-gray-900">{flashcardFlipped ? back : front}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setFlashcardFlipped((previous) => !previous)}
                    className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                >
                    {flashcardFlipped ? 'Xem mặt trước' : 'Lật thẻ'}
                </button>
            </section>
        );
    }

    if (normalizedKind === 'MATCHING') {
        const matchingPayload = payload as MatchingPayload;
        const rightOptions = uniqueStrings(matchingPairs.map((item) => item.right));
        const allSelected =
            matchingPairs.length > 0 &&
            matchingSelections.length === matchingPairs.length &&
            matchingSelections.every((value) => value.trim().length > 0);
        const matchingChecked = resultRevealRequested && allSelected;
        const showMissing = resultRevealRequested && !allSelected;

        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Matching</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{String(matchingPayload.prompt ?? 'Ghép cặp nội dung tương ứng')}</h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Kéo hoặc chạm để thả vào ô trống</p>
                <div className="mt-4 grid gap-3">
                    {matchingPairs.map((pair, index) => (
                        <div key={`${pair.left}-${index}`} className="grid gap-2 rounded-xl border border-gray-200 p-3 md:grid-cols-[1fr_1fr] md:items-center">
                            <p className="text-sm font-semibold text-gray-800">{pair.left}</p>
                            <div
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    const dropped = event.dataTransfer.getData('text/plain');
                                    if (!dropped) return;
                                    setMatchingSelections((previous) => {
                                        const next = [...previous];
                                        next[index] = dropped;
                                        return next;
                                    });
                                }}
                                className={`min-h-[40px] rounded-lg border px-3 py-2 text-sm ${
                                    matchingChecked
                                        ? normalizeText(matchingSelections[index] ?? '') === normalizeText(pair.right)
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-red-500 bg-red-50 text-red-700'
                                        : showMissing && (matchingSelections[index] ?? '').trim() === ''
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-dashed border-gray-300 bg-gray-50 text-gray-700'
                                }`}
                            >
                                {matchingSelections[index] || 'Thả đáp án vào đây'}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {rightOptions.map((option) => (
                        <button
                            key={option}
                            type="button"
                            draggable
                            onDragStart={(event) => {
                                event.dataTransfer.setData('text/plain', option);
                            }}
                            onClick={() => {
                                const firstEmptyIndex = matchingSelections.findIndex((value) => value.trim() === '');
                                if (firstEmptyIndex === -1) return;
                                setMatchingSelections((previous) => {
                                    const next = [...previous];
                                    next[firstEmptyIndex] = option;
                                    return next;
                                });
                            }}
                            className="cursor-grab rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 active:cursor-grabbing"
                        >
                            {option}
                        </button>
                    ))}
                </div>
                {showMissing ? <p className="mt-3 text-sm font-semibold text-red-600">Vui lòng ghép đủ tất cả cặp.</p> : null}
                {matchingChecked ? (
                    <p className="mt-3 text-sm font-semibold text-gray-700">
                        {matchingPairs.every((pair, index) => normalizeText(matchingSelections[index] ?? '') === normalizeText(pair.right))
                            ? <span className="text-green-600">Kết quả: Chính xác</span>
                            : <span className="text-red-600">Kết quả: Chưa đúng</span>}
                    </p>
                ) : null}
            </section>
        );
    }

    if (normalizedKind === 'ORDERING') {
        const orderingPayload = payload as OrderingPayload;
        const expectedOrder = parseOrderingExpectedOrder(orderingPayload, orderingBaseItems);
        const hasExpectedOrder = expectedOrder.length === orderingItems.length && expectedOrder.length > 0;
        const isCorrectOrder = hasExpectedOrder && orderingItems.every((item, index) => normalizeText(item) === normalizeText(expectedOrder[index]));
        const orderingChecked = resultRevealRequested;

        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Ordering</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{String(orderingPayload.prompt ?? 'Sắp xếp theo đúng thứ tự')}</h3>
                <div className="mt-4 grid gap-2">
                    {orderingItems.map((item, index) => (
                        <div
                            key={`${item}-${index}`}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                                orderingChecked
                                    ? hasExpectedOrder && normalizeText(item) === normalizeText(expectedOrder[index] ?? '')
                                        ? 'border-green-500 bg-green-50'
                                        : hasExpectedOrder
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-200'
                                    : 'border-gray-200'
                            }`}
                        >
                            <p className="text-sm font-semibold text-gray-800">
                                {index + 1}. {item}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => setOrderingItems((previous) => moveItem(previous, index, index - 1))}
                                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 disabled:opacity-50"
                                >
                                    Lên
                                </button>
                                <button
                                    type="button"
                                    disabled={index === orderingItems.length - 1}
                                    onClick={() => setOrderingItems((previous) => moveItem(previous, index, index + 1))}
                                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 disabled:opacity-50"
                                >
                                    Xuống
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                    {orderingChecked && hasExpectedOrder ? (
                        <p className={`text-sm font-semibold ${isCorrectOrder ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrectOrder ? 'Thứ tự chính xác' : 'Thứ tự chưa đúng'}
                        </p>
                    ) : null}
                    {orderingChecked && !hasExpectedOrder ? (
                        <p className="text-sm font-semibold text-red-600">Chưa có đáp án chuẩn để đối chiếu thứ tự.</p>
                    ) : null}
                </div>
            </section>
        );
    }

    if (normalizedKind === 'HOTSPOT_IMAGE') {
        const hotspotPayload = payload as HotspotPayload;
        const hotspots = Array.isArray(hotspotPayload.hotspots) ? hotspotPayload.hotspots : [];
        const selectedHotspot = selectedHotspotIndex !== null ? hotspots[selectedHotspotIndex] : null;
        const correctIndex = getHotspotCorrectIndex(hotspotPayload, hotspots.length);
        const showMissing = resultRevealRequested && selectedHotspotIndex === null;
        const hotspotChecked = resultRevealRequested && selectedHotspotIndex !== null;
        const isCorrectSelection = correctIndex !== null && selectedHotspotIndex === correctIndex;

        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Hotspot image</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{String(hotspotPayload.title ?? 'Chọn điểm mô tả phù hợp')}</h3>
                {hotspotPayload.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={hotspotPayload.imageUrl}
                        alt={hotspotPayload.title || 'Hotspot image'}
                        className="mt-4 h-[320px] w-full rounded-xl border border-gray-100 bg-gray-50 object-contain"
                    />
                ) : (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        Thiếu `imageUrl` trong payload HOTSPOT_IMAGE.
                    </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                    {hotspots.map((hotspot, index) => (
                        <button
                            key={`${hotspot.label ?? 'hotspot'}-${index}`}
                            type="button"
                            onClick={() => setSelectedHotspotIndex(index)}
                            className={`rounded-full border px-3 py-1.5 text-sm ${
                                hotspotChecked && correctIndex !== null
                                    ? index === correctIndex
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : selectedHotspotIndex === index
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-gray-200 bg-white text-gray-700'
                                    : selectedHotspotIndex === index
                                        ? 'border-[#2aa4e8] bg-[#f3fbff] text-[#126b98]'
                                        : 'border-gray-200 bg-white text-gray-700'
                            }`}
                        >
                            {hotspot.label || `Điểm ${index + 1}`}
                        </button>
                    ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                    {hotspotChecked && correctIndex !== null ? (
                        <p className={`text-sm font-semibold ${isCorrectSelection ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrectSelection ? 'Chính xác' : 'Chưa đúng'}
                        </p>
                    ) : null}
                    {hotspotChecked && correctIndex === null ? (
                        <p className="text-sm font-semibold text-red-600">Chưa có đáp án chuẩn cho hotspot này.</p>
                    ) : null}
                    {showMissing ? <p className="text-sm font-semibold text-red-600">Vui lòng chọn một hotspot.</p> : null}
                </div>
                {selectedHotspot?.description ? (
                    <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">{selectedHotspot.description}</p>
                ) : null}
            </section>
        );
    }

    if (normalizedKind === 'TIMELINE') {
        const timelinePayload = payload as TimelinePayload;
        const events = Array.isArray(timelinePayload.events) ? timelinePayload.events : [];

        return (
            <section className={baseCardClassName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">Timeline</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{String(timelinePayload.title ?? 'Dòng thời gian')}</h3>
                <div className="mt-4 space-y-4">
                    {events.map((event, index) => (
                        <div key={`${event.title ?? 'event'}-${index}`} className="relative border-l-2 border-[#bfe6fb] pl-4">
                            <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#2aa4e8]" />
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">{event.time ?? event.date ?? `Mốc ${index + 1}`}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{event.title || `Sự kiện ${index + 1}`}</p>
                            {event.description ? <p className="mt-1 text-sm text-gray-700">{event.description}</p> : null}
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    const genericTitle = String(payload.title ?? payload.question ?? payload.prompt ?? block.kind);
    const genericBody = String(payload.body ?? payload.content ?? payload.description ?? '');

    return (
        <section className={baseCardClassName}>
            <h3 className="text-base font-bold text-gray-900">{genericTitle}</h3>
            {genericBody ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">{genericBody}</p>
            ) : (
                <pre className="mt-2 overflow-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-600">{JSON.stringify(payload, null, 2)}</pre>
            )}
        </section>
    );
}

function parsePayload(payload?: string) {
    if (!payload) {
        return {};
    }
    try {
        return JSON.parse(payload) as Record<string, unknown>;
    } catch {
        return {};
    }
}

function normalizeText(value: string) {
    return value.trim().toLowerCase();
}

function normalizeBlockKind(kind?: string) {
    const value = String(kind ?? '').trim().toUpperCase();
    if (value === 'RICH_TEXT' || value === 'LEARN' || value === 'LEARNING') {
        return 'RICH_TEXT';
    }
    if (value === 'INFOGRAPHIC' || value === 'INFO') {
        return 'INFOGRAPHIC';
    }
    if (value === 'QUIZ_MCQ' || value === 'QUIZ' || value === 'MCQ') {
        return 'QUIZ_MCQ';
    }
    if (value === 'FILL_IN_THE_BLANKS' || value === 'FILL_BLANKS' || value === 'FILL_IN_BLANKS') {
        return 'FILL_IN_THE_BLANKS';
    }
    return value;
}

function parseMatchingPairs(payload: MatchingPayload): MatchingPairItem[] {
    if (!Array.isArray(payload.pairs)) {
        return [];
    }
    return payload.pairs
        .map((pair) => {
            const left = String(pair.left ?? pair.term ?? '').trim();
            const right = String(pair.right ?? pair.definition ?? '').trim();
            return { left, right };
        })
        .filter((pair) => pair.left.length > 0 && pair.right.length > 0);
}

function parseOrderingItems(payload: OrderingPayload): string[] {
    if (!Array.isArray(payload.items)) {
        return [];
    }
    return payload.items
        .map((item) => {
            if (typeof item === 'string') {
                return item.trim();
            }
            return String(item.text ?? item.label ?? '').trim();
        })
        .filter((item) => item.length > 0);
}

function parseOrderingExpectedOrder(payload: OrderingPayload, fallbackOrder: string[]) {
    if (Array.isArray(payload.correctOrder) && payload.correctOrder.length > 0) {
        return payload.correctOrder.map((item) => String(item));
    }
    return [...fallbackOrder];
}

function moveItem(items: string[], fromIndex: number, toIndex: number) {
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
}

function uniqueStrings(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}

function getHotspotCorrectIndex(payload: HotspotPayload, hotspotCount: number): number | null {
    if (typeof payload.correctHotspotIndex === 'number' && Number.isInteger(payload.correctHotspotIndex)) {
        return payload.correctHotspotIndex;
    }
    if (!Array.isArray(payload.hotspots)) {
        return hotspotCount === 1 ? 0 : null;
    }
    const index = payload.hotspots.findIndex((item) => item?.isCorrect === true);
    if (index >= 0) {
        return index;
    }
    return payload.hotspots.length === 1 ? 0 : null;
}
