'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { getCourses } from '@/shared/api/learning';
import {
    getAttemptAnswer,
    getAttemptReview,
    getMyAttempts,
    saveAttemptAnswer,
    startAttempt,
    submitAttempt,
    tickAttempt,
} from '@/shared/api/assessment';
import { AttemptReviewAnswerResponse } from '@/shared/types/assessment';
import { ContentBlockResponse } from '@/shared/types/learning';
import { LessonBlockStep, LessonBlockStepProgress } from '@/features/courses/components/lesson/LessonBlockStep';
import { LessonStepBreadcrumb } from '@/features/courses/components/lesson/LessonStepBreadcrumb';
import { LessonStepFooter } from '@/features/courses/components/lesson/LessonStepFooter';
import { LessonStepProgress } from '@/features/courses/components/lesson/LessonStepProgress';
import { LessonCompletionLoadingScreen as SharedLessonCompletionLoadingScreen } from '@/features/courses/components/LessonCompletionLoadingScreen';
import { Skeleton } from '@/shared/components/Skeleton';

function isAttemptTimeExpiredError(error: unknown): boolean {
    if (!(error instanceof Error) || !error.message) return false;
    const m = error.message.toLowerCase();
    return m.includes('time limit for this attempt has expired') || m.includes('time has expired');
}

function isBlockGradable(block: ContentBlockResponse | null | undefined): boolean {
    return Boolean(block?.isGradable);
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function LessonScreen({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const isReviewMode = searchParams.get('mode') === 'review';
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completionLoading, setCompletionLoading] = useState(false);
    const [completionProgress, setCompletionProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [stepIndex, setStepIndex] = useState(0);
    const [canContinue, setCanContinue] = useState(true);
    const [blockProgress, setBlockProgress] = useState<LessonBlockStepProgress>({ status: 'IN_PROGRESS' });
    const [attemptId, setAttemptId] = useState<string | null>(null);
    /** Luôn khớp attemptId mới nhất — tránh stale closure khi vừa startAttempt/setAttemptId rồi submit ngay. */
    const attemptIdRef = useRef<string | null>(null);

    useEffect(() => {
        attemptIdRef.current = attemptId;
    }, [attemptId]);

    useEffect(() => {
        if (!completionLoading) return;

        const start = window.performance.now();
        const duration = 2000;
        const target = 63;

        const interval = window.setInterval(() => {
            const elapsed = window.performance.now() - start;
            const next = Math.min(target, Math.round((elapsed / duration) * target));
            setCompletionProgress((previous) => Math.max(previous, next));
        }, 50);

        return () => window.clearInterval(interval);
    }, [completionLoading]);

    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [prefillUserAnswer, setPrefillUserAnswer] = useState<string | null>(null);
    const [reviewByBlockId, setReviewByBlockId] = useState<Record<string, AttemptReviewAnswerResponse>>({});
    const [lesson, setLesson] = useState<null | {
        id: string;
        courseName: string;
        sectionName: string;
        name: string;
        description: string | null;
        difficulty: string | null;
        estimatedDurationMinutes: number | null;
        content: string | null;
        blocks: ContentBlockResponse[] | null;
    }>(null);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const courses = await getCourses();
                const course = courses.find((item) => item.slug === courseSlug);
                const match = course?.sections?.flatMap((section) =>
                    (section.contents ?? []).map((lessonItem) => ({
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
                    setReviewByBlockId({});
                    return;
                }

                const submittedAttempts = (await getMyAttempts()).filter(
                    (item) => item.contentId === match.id && item.submittedAt
                );
                const latestSubmitted = [...submittedAttempts].sort(
                    (left, right) => new Date(right.submittedAt ?? '').getTime() - new Date(left.submittedAt ?? '').getTime()
                )[0];

                const selectedAttemptId = latestSubmitted?.attemptId ?? null;

                if (!selectedAttemptId) {
                    setMessage('Bài học này chưa có kết quả để xem lại.');
                    setReviewByBlockId({});
                    return;
                }

                attemptIdRef.current = selectedAttemptId;
                setAttemptId(selectedAttemptId);
                const review = await getAttemptReview(selectedAttemptId);
                setReviewByBlockId(
                    review.answers.reduce<Record<string, AttemptReviewAnswerResponse>>((acc, answer) => {
                        acc[answer.contentBlockId] = answer;
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

    useEffect(() => {
        let cancelled = false;
        const contentId = lesson?.id;
        const estimatedDurationMinutes = lesson?.estimatedDurationMinutes ?? null;
        async function ensureAttempt() {
            if (!contentId || isReviewMode) return;
            try {
                const started = await startAttempt(contentId, { estimatedDurationMinutes });
                if (cancelled) return;
                attemptIdRef.current = started.attemptId;
                setAttemptId(started.attemptId);
                setRemainingSeconds(started.remainingSeconds);
            } catch {
                if (!cancelled) setMessage('Không thể bắt đầu phiên làm bài.');
            }
        }
        void ensureAttempt();
        return () => { cancelled = true; };
    }, [lesson?.id, lesson?.estimatedDurationMinutes, isReviewMode]);

    useEffect(() => {
        if (!attemptId || isReviewMode) return;
        const id = window.setInterval(() => {
            void (async () => {
                try {
                    const t = await tickAttempt(attemptId);
                    setRemainingSeconds(t.remainingSeconds);
                    if (t.remainingSeconds <= 0) {
                        await submitAttempt(attemptId);
                        router.push(`/courses/${courseSlug}/lessons/${lessonSlug}/complete?attemptId=${attemptId}`);
                    }
                } catch {
                    /* ignore transient tick errors */
                }
            })();
        }, 60_000);
        return () => clearInterval(id);
    }, [attemptId, courseSlug, isReviewMode, lessonSlug, router]);

    const lessonBlocks = lesson?.blocks;
    const sortedBlocks = useMemo(() => {
        if (!lessonBlocks || lessonBlocks.length === 0) {
            return [];
        }
        return [...lessonBlocks].sort((left, right) => left.orderIndex - right.orderIndex);
    }, [lessonBlocks]);

    const totalSteps = sortedBlocks.length > 0 ? sortedBlocks.length : 1;
    const currentBlock = sortedBlocks[stepIndex] ?? null;
    const currentReviewAnswer = currentBlock ? reviewByBlockId[currentBlock.id] : undefined;
    const isLastStep = stepIndex === totalSteps - 1;
    const canGoBack = stepIndex > 0;

    useEffect(() => {
        const timeout = window.setTimeout(() => setStepIndex(0), 0);
        return () => window.clearTimeout(timeout);
    }, [lesson?.id]);

    useEffect(() => {
        if (stepIndex > totalSteps - 1) {
            const timeout = window.setTimeout(() => setStepIndex(totalSteps - 1), 0);
            return () => window.clearTimeout(timeout);
        }
        return undefined;
    }, [stepIndex, totalSteps]);

    useEffect(() => {
        let cancelled = false;
        async function loadPrefill() {
            if (!isBlockGradable(currentBlock) || !attemptId || isReviewMode) {
                setPrefillUserAnswer(null);
                return;
            }
            try {
                const res = await getAttemptAnswer(attemptId, currentBlock.id);
                if (!cancelled) setPrefillUserAnswer(res.userAnswer);
            } catch {
                if (!cancelled) setPrefillUserAnswer(null);
            }
        }
        void loadPrefill();
        return () => { cancelled = true; };
    }, [attemptId, currentBlock, isReviewMode]);

    const handleBlockStateChange = useCallback((state: { canContinue: boolean; progress: LessonBlockStepProgress }) => {
        if (isReviewMode) {
            setCanContinue(true);
            setBlockProgress({ status: 'COMPLETED', userAnswer: currentReviewAnswer?.userAnswer ?? '' });
            return;
        }
        setCanContinue(state.canContinue);
        setBlockProgress(state.progress);
    }, [currentReviewAnswer?.userAnswer, isReviewMode]);

    const saveCurrentBlockProgress = useCallback(async (): Promise<string | null> => {
        if (!lesson || !currentBlock) {
            return attemptIdRef.current;
        }
        let currentAttemptId = attemptIdRef.current;
        if (isBlockGradable(currentBlock) && blockProgress.userAnswer) {
            const saveAnswer = async (attempt: string) =>
                saveAttemptAnswer(attempt, {
                    contentBlockId: currentBlock.id,
                    contentId: lesson.id,
                    userAnswer: blockProgress.userAnswer!,
                    kind: currentBlock.kind,
                    payload: currentBlock.payload,
                    maxScore: currentBlock.maxScore,
                    orderIndex: currentBlock.orderIndex,
                    isGradable: currentBlock.isGradable,
                });
            const startBody = { estimatedDurationMinutes: lesson.estimatedDurationMinutes ?? null };

            if (!currentAttemptId) {
                const started = await startAttempt(lesson.id, startBody);
                currentAttemptId = started.attemptId;
                attemptIdRef.current = currentAttemptId;
                setAttemptId(currentAttemptId);
                setRemainingSeconds(started.remainingSeconds);
            }
            try {
                await saveAnswer(currentAttemptId);
            } catch (error) {
                if (!isAttemptTimeExpiredError(error)) throw error;
                const restarted = await startAttempt(lesson.id, startBody);
                currentAttemptId = restarted.attemptId;
                attemptIdRef.current = currentAttemptId;
                setAttemptId(currentAttemptId);
                setRemainingSeconds(restarted.remainingSeconds);
                await saveAnswer(currentAttemptId);
            }
        }
        return currentAttemptId;
    }, [blockProgress.userAnswer, currentBlock, lesson]);

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
            const attemptAfterSave = await saveCurrentBlockProgress();
            if (!isLastStep) {
                setStepIndex((previous) => previous + 1);
                return;
            }
            const toSubmit = attemptAfterSave ?? attemptIdRef.current;
            if (toSubmit) {
                await submitAttempt(toSubmit);
            }
            setMessage('');
            const completedAttemptId = toSubmit ?? attemptId;
            const query = completedAttemptId ? `?attemptId=${encodeURIComponent(completedAttemptId)}` : '';
            router.push(`/courses/${courseSlug}/lessons/${lessonSlug}/complete${query}`);
        } catch (error) {
            setCompletionLoading(false);
            setCompletionProgress(0);
            if (isAttemptTimeExpiredError(error)) {
                setMessage('Đã hết thời gian làm bài. Hệ thống sẽ chuyển bạn tới trang kết quả.');
                if (attemptId) {
                    router.push(`/attempts/${attemptId}/result`);
                    return;
                }
            }
            setMessage(error instanceof Error ? error.message : 'Không thể tiếp tục bài học.');
        } finally {
            setSubmitting(false);
        }
    }, [attemptId, courseSlug, isLastStep, isReviewMode, lesson, lessonSlug, router, saveCurrentBlockProgress]);

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
                        <div className="mx-auto max-w-4xl space-y-5 py-8">
                            <Skeleton className="h-8 w-40 rounded-full" />
                            <Skeleton className="h-32 w-full rounded-3xl" />
                            <Skeleton className="h-72 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (completionLoading) {
        return (
            <SharedLessonCompletionLoadingScreen
                streakDays={streakDays ?? 0}
                progress={completionProgress}
                onLogout={handleLogout}
            />
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
                                <div className="max-w-full overflow-hidden rounded-3xl border border-gray-200 bg-[#f8fbff] px-6 py-6">
                                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2aa4e8]">{lesson.courseName} • {lesson.sectionName}</p>
                                    <h1 className="mt-3 break-words text-3xl font-extrabold text-gray-900 [overflow-wrap:anywhere]">{lesson.name}</h1>
                                    <p className="mt-3 max-w-3xl text-sm text-gray-600">{lesson.description || 'Bài học này đang sử dụng nội dung từ learning service.'}</p>
                                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                                        {lesson.difficulty && <span className="rounded-full bg-white px-3 py-1">{lesson.difficulty}</span>}
                                        {lesson.estimatedDurationMinutes && <span className="rounded-full bg-white px-3 py-1">{lesson.estimatedDurationMinutes} phút</span>}
                                        {!isReviewMode && attemptId && remainingSeconds != null && (
                                            <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#126b98]">
                                                Còn lại: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!!message && (
                                    <div className="rounded-2xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm text-[#126b98]">{message}</div>
                                )}

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
                                        prefillUserAnswer={prefillUserAnswer}
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

function LessonCompletionLoadingScreen({
    streakDays,
    progress,
    onLogout,
}: {
    streakDays: number;
    progress: number;
    onLogout: () => void;
}) {
    const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

    return (
        <div className="flex h-screen overflow-hidden bg-white font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays} onLogout={onLogout} />
                <div className="flex-1 overflow-hidden px-6 py-8">
                    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
                        <div className="relative mb-6 flex h-[clamp(18rem,18vw,34rem)] w-[clamp(18rem,18vw,34rem)] items-center justify-center rounded-full bg-[#EAF7EF]">
                            <Image
                                src="/images/Mascot/24.svg"
                                alt="Medicology mascot"
                                width={768}
                                height={768}
                                className="h-[clamp(32rem,34vw,64rem)] w-[clamp(32rem,34vw,64rem)] max-w-none object-contain"
                            />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
                            Đang hoàn tất bài tập
                        </p>
                        <h1 className="mt-3 text-2xl font-extrabold text-gray-900">
                            Hệ thống đang ghi nhận kết quả của bạn
                        </h1>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                            Giữ nguyên màn hình trong giây lát để cập nhật tiến độ khóa học.
                        </p>

                        <div className="mt-8 w-full max-w-md">
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500">
                                <span>Tiến trình</span>
                                <span className="text-emerald-600">{safeProgress}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${safeProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
