import React, { useMemo } from 'react';
import { AttemptReviewAnswerResponse } from '@/shared/types/assessment';

interface LessonBlockReviewProps {
    answer: AttemptReviewAnswerResponse;
}

export function LessonBlockReview({ answer }: LessonBlockReviewProps) {
    const payload = useMemo(() => parsePayload(answer.payload), [answer.payload]);
    const prompt = String(payload.prompt ?? payload.question ?? payload.title ?? answer.questionContent ?? 'Question');

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2aa4e8]">{answer.questionType}</p>
            <h3 className="mt-2 text-lg font-bold text-gray-900">{prompt}</h3>
            <p className="mt-1 text-xs text-gray-500">Điểm tối đa: {answer.points}</p>

            {payload.options && Array.isArray(payload.options) ? (
                <div className="mt-4 grid gap-2">
                    {payload.options.map((option: unknown, index: number) => {
                        const label = typeof option === 'string'
                            ? option
                            : String((option as Record<string, unknown>)?.label ?? (option as Record<string, unknown>)?.text ?? option);
                        const selected = answer.userAnswer ? normalize(answer.userAnswer) === normalize(label) : false;
                        return (
                            <div
                                key={`${label}-${index}`}
                                className={`rounded-xl border px-3 py-2 text-sm ${selected
                                    ? 'border-[#2aa4e8] bg-[#f3fbff] text-[#126b98]'
                                    : 'border-gray-200 bg-white text-gray-700'
                                    }`}
                            >
                                {label}
                            </div>
                        );
                    })}
                </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Câu trả lời của bạn</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{answer.userAnswer ?? 'Chưa trả lời'}</p>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
                <p className="font-semibold text-gray-700">
                    Trạng thái chấm:
                    <span className={`ml-2 ${answer.gradingStatus === 'FINALIZED'
                        ? 'text-green-600'
                        : answer.gradingStatus === 'MANUAL_REVIEW'
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}>
                        {answer.gradingStatus}
                    </span>
                </p>
                <p className="text-gray-700">Nguồn chấm: {answer.gradingSource ?? 'N/A'}</p>
                <p className="text-gray-700">Điểm đạt: {answer.awardedPoints ?? 0}</p>
                {answer.aiModel ? <p className="text-gray-700">Model: {answer.aiModel}</p> : null}
                {answer.correct !== null ? (
                    <p className={`font-semibold ${answer.correct ? 'text-green-600' : 'text-red-600'}`}>
                        {answer.correct ? 'Kết quả: Đúng' : 'Kết quả: Chưa đúng'}
                    </p>
                ) : null}
                {answer.explanation ? (
                    <div className="rounded-xl border border-[#bfe6fb] bg-[#f3fbff] px-3 py-2 text-[#126b98]">
                        <p className="text-xs font-semibold uppercase tracking-wide">Giải thích</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{answer.explanation}</p>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

function parsePayload(payload: string) {
    try {
        return JSON.parse(payload) as Record<string, unknown>;
    } catch {
        return {};
    }
}

function normalize(value: string) {
    return value.trim().toLowerCase();
}
