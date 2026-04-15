'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { getAttemptReview } from '@/shared/api/assessment';
import { AttemptReviewAnswerResponse } from '@/shared/types/assessment';
import { LessonStepProgress } from '@/features/courses/components/lesson/LessonStepProgress';
import { LessonStepFooter } from '@/features/courses/components/lesson/LessonStepFooter';
import { LessonBlockReview } from '@/features/courses/components/lesson/LessonBlockReview';

export default function AttemptReviewPage() {
    const params = useParams<{ attemptId: string }>();
    const router = useRouter();
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [review, setReview] = useState<null | {
        assessmentTitle: string;
        resultStatus: 'PROVISIONAL' | 'FINAL';
        passed: boolean;
        answers: AttemptReviewAnswerResponse[];
    }>(null);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const data = await getAttemptReview(params.attemptId);
                if (!cancelled) {
                    setReview(data);
                }
            } catch (nextError) {
                if (!cancelled) {
                    setError(nextError instanceof Error ? nextError.message : 'Không thể tải bài xem lại.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        run();
        return () => {
            cancelled = true;
        };
    }, [params.attemptId]);

    const answers = review?.answers ?? [];
    const totalSteps = Math.max(answers.length, 1);
    const currentAnswer = answers[stepIndex] ?? null;
    const canGoBack = stepIndex > 0;
    const isLastStep = stepIndex === totalSteps - 1;

    const continueLabel = useMemo(() => {
        if (isLastStep) {
            return 'Quay lại kết quả';
        }
        return 'Tiếp tục';
    }, [isLastStep]);

    const handleContinue = async () => {
        if (submitting) {
            return;
        }
        setSubmitting(true);
        try {
            if (isLastStep) {
                router.push(`/attempts/${params.attemptId}/result`);
                return;
            }
            setStepIndex((previous) => previous + 1);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        if (!canGoBack || submitting) {
            return;
        }
        setStepIndex((previous) => Math.max(0, previous - 1));
    };

    return (
        <div className="flex h-screen overflow-hidden bg-white font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="mx-auto max-w-4xl">
                        <Link href={`/attempts/${params.attemptId}/result`} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200">‹</span>
                            Quay lại kết quả
                        </Link>

                        {loading ? (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">Đang tải dữ liệu xem lại...</div>
                        ) : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                        ) : !review || !currentAnswer ? (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500">Không có dữ liệu câu trả lời để xem lại.</div>
                        ) : (
                            <article className="rounded-3xl border border-gray-200 px-6 py-6">
                                <div className="mb-5 flex items-center gap-2 text-sm text-gray-400">
                                    <span>Bài kiểm tra</span>
                                    <span>›</span>
                                    <span className="font-semibold text-gray-700">{review.assessmentTitle}</span>
                                </div>
                                <LessonStepProgress currentStep={stepIndex + 1} totalSteps={totalSteps} />
                                <div className="mb-4 rounded-xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm text-[#126b98]">
                                    {review.resultStatus === 'PROVISIONAL'
                                        ? 'Kết quả vẫn có câu chờ manual review.'
                                        : review.passed
                                            ? 'Bạn đã vượt qua bài kiểm tra.'
                                            : 'Bạn chưa vượt qua bài kiểm tra.'}
                                </div>
                                <LessonBlockReview answer={currentAnswer} />
                                <LessonStepFooter
                                    canGoBack={canGoBack}
                                    canContinue={true}
                                    continueLabel={continueLabel}
                                    submitting={submitting}
                                    onBack={handleBack}
                                    onContinue={handleContinue}
                                />
                            </article>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
