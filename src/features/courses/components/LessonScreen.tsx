'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { completeLesson, getCourses, getLessonBlockProgress, updateLessonBlockProgress } from '@/shared/api/learning';
import { getAttemptReview, getMyAttempts, saveAttemptAnswer, startAttempt, submitAttempt } from '@/shared/api/assessment';
import { AttemptReviewAnswerResponse } from '@/shared/types/assessment';
import { LessonContentBlockResponse } from '@/shared/types/learning';
import { LessonBlockStep, LessonBlockStepProgress } from '@/features/courses/components/lesson/LessonBlockStep';
import { LessonStepBreadcrumb } from '@/features/courses/components/lesson/LessonStepBreadcrumb';
import { LessonStepFooter } from '@/features/courses/components/lesson/LessonStepFooter';
import { LessonStepProgress } from '@/features/courses/components/lesson/LessonStepProgress';

export function LessonScreen({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const isReviewMode = searchParams.get('mode') === 'review';
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [stepIndex, setStepIndex] = useState(0);
    const [canContinue, setCanContinue] = useState(true);
    const [blockProgress, setBlockProgress] = useState<LessonBlockStepProgress>({ status: 'IN_PROGRESS' });
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [reviewByQuestionId, setReviewByQuestionId] = useState<Record<string, AttemptReviewAnswerResponse>>({});
    const [lesson, setLesson] = useState<null | {
        id: string;
        courseName: string;
        sectionName: string;
        name: string;
        description: string | null;
        difficulty: string | null;
        estimatedDurationMinutes: number | null;
        content: string | null;
        blocks: LessonContentBlockResponse[] | null;
    }>(null);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const courses = await getCourses();
                const course = courses.find((item) => item.slug === courseSlug);
                const match = course?.sections?.flatMap((section) =>
                    (section.lessons ?? []).map((lessonItem) => ({
                        id: lessonItem.id,
                        courseName: course.name,
                        sectionName: section.name,
                        name: lessonItem.name,
                        description: lessonItem.description,
                        difficulty: lessonItem.difficultyLevel,
                        estimatedDurationMinutes: lessonItem.estimatedDurationMinutes,
                        content: lessonItem.content,
                        blocks: lessonItem.blocks,
                        slug: lessonItem.slug,
                    }))
                ).find((item) => item.slug === lessonSlug);
                if (cancelled) return;
                setLesson(match ?? null);

                if (!match || !isReviewMode) {
                    setReviewByQuestionId({});
                    return;
                }

                const lessonAssessmentIds = Array.from(
                    new Set(
                        (match.blocks ?? [])
                            .map((item) => item.assessmentId)
                            .filter((value): value is string => Boolean(value))
                    )
                );
                const submittedAttempts = lessonAssessmentIds.length > 0
                    ? (await getMyAttempts()).filter((item) =>
                        lessonAssessmentIds.includes(item.assessmentId) && item.submittedAt
                    )
                    : [];
                const latestSubmitted = [...submittedAttempts].sort(
                    (left, right) => new Date(right.submittedAt ?? '').getTime() - new Date(left.submittedAt ?? '').getTime()
                )[0];

                const blockProgressItems = await getLessonBlockProgress(match.id).catch(() => []);
                const latestAttempt = [...blockProgressItems]
                    .filter((item) => item.attemptId)
                    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];

                const selectedAttemptId = latestSubmitted?.attemptId ?? latestAttempt?.attemptId ?? null;

                if (!selectedAttemptId) {
                    setMessage('Bài học này chưa có kết quả để xem lại.');
                    setReviewByQuestionId({});
                    return;
                }

                setAttemptId(selectedAttemptId);
                const review = await getAttemptReview(selectedAttemptId);
                setReviewByQuestionId(
                    review.answers.reduce<Record<string, AttemptReviewAnswerResponse>>((acc, answer) => {
                        acc[answer.questionId] = answer;
                        return acc;
                    }, {})
                );
            } catch (error) {
                if (!cancelled) setMessage(error instanceof Error ? error.message : 'Không thể tải bài học.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, [courseSlug, isReviewMode, lessonSlug]);

    const sortedBlocks = useMemo(() => {
        if (!lesson?.blocks || lesson.blocks.length === 0) {
            return [];
        }
        return [...lesson.blocks].sort((left, right) => left.orderIndex - right.orderIndex);
    }, [lesson?.blocks]);

    const totalSteps = sortedBlocks.length > 0 ? sortedBlocks.length : 1;
    const currentBlock = sortedBlocks[stepIndex] ?? null;
    const currentReviewAnswer = currentBlock?.questionId ? reviewByQuestionId[currentBlock.questionId] : undefined;
    const isLastStep = stepIndex === totalSteps - 1;
    const canGoBack = stepIndex > 0;

    useEffect(() => {
        setStepIndex(0);
    }, [lesson?.id]);

    useEffect(() => {
        if (stepIndex > totalSteps - 1) {
            setStepIndex(totalSteps - 1);
        }
    }, [stepIndex, totalSteps]);

    const handleBlockStateChange = useCallback((state: { canContinue: boolean; progress: LessonBlockStepProgress }) => {
        if (isReviewMode) {
            setCanContinue(true);
            setBlockProgress({ status: 'COMPLETED', userAnswer: currentReviewAnswer?.userAnswer ?? '' });
            return;
        }
        setCanContinue(state.canContinue);
        setBlockProgress(state.progress);
    }, [currentReviewAnswer?.userAnswer, isReviewMode]);

    const saveCurrentBlockProgress = useCallback(async () => {
        if (!lesson || !currentBlock) {
            return;
        }
        try {
            let currentAttemptId = attemptId;
            if (currentBlock.questionId && currentBlock.assessmentId && blockProgress.userAnswer) {
                if (!currentAttemptId) {
                    const started = await startAttempt(currentBlock.assessmentId);
                    currentAttemptId = started.attemptId;
                    setAttemptId(currentAttemptId);
                }
                await saveAttemptAnswer(currentAttemptId, {
                    questionId: currentBlock.questionId,
                    userAnswer: blockProgress.userAnswer,
                });
            }
            await updateLessonBlockProgress(lesson.id, currentBlock.id, {
                status: blockProgress.status,
                attemptId: currentAttemptId ?? undefined,
            });
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể cập nhật tiến độ block.');
        }
    }, [attemptId, blockProgress.status, blockProgress.userAnswer, currentBlock, lesson]);

    const handleContinue = useCallback(async () => {
        if (!lesson) {
            return;
        }
        if (isReviewMode) {
            if (!isLastStep) {
                setStepIndex((previous) => previous + 1);
                return;
            }
            router.push(`/courses/${courseSlug}`);
            return;
        }
        setMessage('');
        setSubmitting(true);
        try {
            await saveCurrentBlockProgress();
            if (!isLastStep) {
                setStepIndex((previous) => previous + 1);
                return;
            }
            if (attemptId) {
                await submitAttempt(attemptId);
            }
            await completeLesson(lesson.id);
            setMessage('Đã hoàn thành bài học.');
            if (attemptId) {
                router.push(`/attempts/${attemptId}/result`);
            } else {
                router.push(`/courses/${courseSlug}`);
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể tiếp tục bài học.');
        } finally {
            setSubmitting(false);
        }
    }, [attemptId, courseSlug, isLastStep, isReviewMode, lesson, router, saveCurrentBlockProgress]);

    const handleBack = useCallback(() => {
        if (!canGoBack || submitting) {
            return;
        }
        setMessage('');
        setStepIndex((previous) => Math.max(previous - 1, 0));
    }, [canGoBack, submitting]);

    const continueLabel = isReviewMode ? (isLastStep ? 'Quay lại lộ trình' : 'Tiếp theo') : isLastStep ? 'Hoàn thành' : 'Tiếp tục';

    if (loading) {
        return (
            <div className="flex h-screen overflow-hidden bg-white font-sans">
                <AppSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />
                    <div className="flex-1 overflow-y-auto px-6 py-8">
                        <div className="mx-auto max-w-4xl py-20 text-center text-gray-500">Đang tải bài học...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="mx-auto max-w-4xl">
                        <Link href={`/courses/${courseSlug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200">‹</span>
                            Quay lại lộ trình
                        </Link>

                        {!lesson ? (
                            <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-500">Không tìm thấy bài học.</div>
                        ) : (
                            <div className="space-y-6">
                                <div className="rounded-3xl border border-gray-200 bg-[#f8fbff] px-6 py-6">
                                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2aa4e8]">{lesson.courseName} • {lesson.sectionName}</p>
                                    <h1 className="mt-3 text-3xl font-extrabold text-gray-900">{lesson.name}</h1>
                                    <p className="mt-3 max-w-3xl text-sm text-gray-600">{lesson.description || 'Bài học này đang sử dụng nội dung từ learning service.'}</p>
                                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                                        {lesson.difficulty && <span className="rounded-full bg-white px-3 py-1">{lesson.difficulty}</span>}
                                        {lesson.estimatedDurationMinutes && <span className="rounded-full bg-white px-3 py-1">{lesson.estimatedDurationMinutes} phút</span>}
                                    </div>
                                </div>

                                {!!message && <div className="rounded-2xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm text-[#126b98]">{message}</div>}

                                <article className="rounded-3xl border border-gray-200 px-6 py-6">
                                    {isReviewMode ? (
                                        <div className="mb-4 rounded-xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm text-[#126b98]">
                                            Chế độ xem kết quả: các lựa chọn đã được khóa. Màu trạng thái: xanh = đúng, đỏ = sai, vàng = đang chờ chấm.
                                        </div>
                                    ) : null}
                                    <LessonStepBreadcrumb
                                        courseName={lesson.courseName}
                                        sectionName={lesson.sectionName}
                                        lessonName={lesson.name}
                                    />
                                    <LessonStepProgress currentStep={stepIndex + 1} totalSteps={totalSteps} />
                                    <LessonBlockStep
                                        key={`lesson-step-${currentBlock?.id ?? 'legacy'}`}
                                        block={currentBlock}
                                        legacyContent={lesson.content}
                                        readOnly={isReviewMode}
                                        reviewAnswer={currentReviewAnswer}
                                        onStateChange={handleBlockStateChange}
                                    />
                                    <LessonStepFooter
                                        canGoBack={canGoBack}
                                        canContinue={canContinue}
                                        continueLabel={continueLabel}
                                        submitting={submitting}
                                        onBack={handleBack}
                                        onContinue={handleContinue}
                                    />
                                </article>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
