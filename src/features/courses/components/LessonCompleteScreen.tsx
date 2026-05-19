'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { LessonCompletionLoadingScreen } from '@/features/courses/components/LessonCompletionLoadingScreen';
import { useLogout } from '@/shared/hooks/useLogout';
import { syncLearningStreakForCompletedAttempt, useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { getCourses, notifyLearningProgressChanged } from '@/shared/api/learning';
import type { LearningProgressChangedDetail } from '@/shared/api/learning';
import { getAttemptResult, getAttemptResultFresh, getMyAttempts } from '@/shared/api/assessment';
import { AttemptResultResponse } from '@/shared/types/assessment';
import { patchEnrolledCoursesCache } from '@/features/courses/hooks/useEnrolledCourses';
import { patchRoadmapCaches } from '@/features/courses/hooks/useRoadmap';
import { invalidateCachedValue, invalidateCachedValueByPrefix } from '@/shared/api/client-cache';
import { cacheKeys } from '@/shared/api/cache-policy';
import {
    DictionaryArticleRecommendationItem,
    recommendArticlesFromAttempts,
} from '@/features/encyclopedia/api';
import { LESSON_PASS_SCORE_RATIO } from '@/features/courses/components/lessonCompleteConstants';
import {
    readReadingRecoFromSession,
    readingRecoSessionKey,
    writeReadingRecoToSession,
} from '@/features/encyclopedia/readingRecoSessionCache';
import { mapAttemptsToRecommendationPayload } from '@/features/encyclopedia/readingRecommendationsLearner';
import { useUserStore } from '@/shared/store/useUserStore';

interface LessonMeta {
    contentId: string;
    courseName: string;
    sectionName: string;
    name: string;
}

type Outcome =
    | 'loading'
    | 'page-error'
    | 'result-error'
    | 'grading'
    | 'passed'
    | 'failed'
    | 'neutral';

function formatScore(value: number): string {
    if (!Number.isFinite(value)) return '—';
    if (Number.isInteger(value)) return String(value);
    const rounded = Math.round(value * 100) / 100;
    return String(rounded);
}

function passThresholdPoints(maxScore: number): number {
    return Math.round(maxScore * LESSON_PASS_SCORE_RATIO * 100) / 100;
}

function getResultScorePercent(result: AttemptResultResponse | null): number | null {
    if (!result || !Number.isFinite(result.score) || !Number.isFinite(result.maxScore) || result.maxScore <= 0) {
        return null;
    }

    return Math.max(0, Math.min(100, Math.round((result.score / result.maxScore) * 100)));
}

function getMascotByScorePercent(percent: number): string {
    if (percent >= 100) return '/images/Mascot/15.svg';
    if (percent >= 75) return '/images/Mascot/22.svg';
    if (percent >= 25) return '/images/Mascot/23.svg';
    return '/images/Mascot/21.svg';
}

function preloadImageAsset(src: string): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();

    return new Promise((resolve) => {
        const image = new window.Image();
        image.onload = () => resolve();
        image.onerror = () => resolve();
        image.src = src;
    });
}

export function LessonCompleteScreen({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attemptId');
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const setStreakCardsBlocked = useUserStore((state) => state.setStreakCardsBlocked);

    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [pageError, setPageError] = useState('');
    const [resultFetchError, setResultFetchError] = useState('');
    const [lesson, setLesson] = useState<LessonMeta | null>(null);
    const [result, setResult] = useState<AttemptResultResponse | null>(null);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState('');
    const [recommendationStrategy, setRecommendationStrategy] = useState<'ai' | 'fallback_popular_unread' | null>(null);
    const [recommendations, setRecommendations] = useState<DictionaryArticleRecommendationItem[]>([]);
    const streakSyncedRef = React.useRef(false);
    const progressSyncedRef = React.useRef(false);

    useEffect(() => {
        streakSyncedRef.current = false;
        progressSyncedRef.current = false;
    }, [attemptId]);

    React.useLayoutEffect(() => {
        setStreakCardsBlocked(loading);
        return () => setStreakCardsBlocked(false);
    }, [loading, setStreakCardsBlocked]);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            setLoading(true);
            setLoadingProgress(8);
            setPageError('');
            setResultFetchError('');
            setRecommendationError('');
            const recoCacheKey = readingRecoSessionKey(courseSlug, lessonSlug, attemptId);
            const cachedRecoAtStart = readReadingRecoFromSession(recoCacheKey);
            if (!cachedRecoAtStart) {
                setRecommendationStrategy(null);
                setRecommendations([]);
            }
            try {
                setLoadingProgress(18);
                const courses = await getCourses();
                if (cancelled) return;
                setLoadingProgress(32);

                const course = courses.find((item) => item.slug === courseSlug);
                let lessonFromCourses: LessonMeta | null = null;
                if (course) {
                    for (const section of course.sections ?? []) {
                        const content = (section.contents ?? []).find((c) => c.slug === lessonSlug);
                        if (content) {
                            lessonFromCourses = {
                                contentId: content.id,
                                courseName: course.name,
                                sectionName: section.name,
                                name: content.name,
                            };
                            break;
                        }
                    }
                }
                setLesson(lessonFromCourses);

                let fetchedResult: AttemptResultResponse | null = null;
                if (!attemptId) {
                    setResult(null);
                } else {
                    try {
                        setLoadingProgress(48);
                        const attemptResult = await getAttemptResult(attemptId);
                        fetchedResult = attemptResult;
                        if (!cancelled) setResult(attemptResult);
                    } catch (nextError) {
                        if (!cancelled) {
                            setResult(null);
                            setResultFetchError(
                                nextError instanceof Error ? nextError.message : 'Không thể tải kết quả bài làm.'
                            );
                        }
                    }
                }
                if (cancelled) return;

                const scorePercent = getResultScorePercent(fetchedResult);
                const mascotSrc = scorePercent === null ? null : getMascotByScorePercent(scorePercent);
                if (mascotSrc) {
                    setLoadingProgress(66);
                    await preloadImageAsset(mascotSrc);
                    if (cancelled) return;
                }
                setLoadingProgress(74);

                try {
                    if (cachedRecoAtStart) {
                        if (!cancelled) {
                            setRecommendationStrategy(cachedRecoAtStart.strategy);
                            setRecommendations(cachedRecoAtStart.items ?? []);
                        }
                    } else {
                        setRecommendationLoading(true);
                        setLoadingProgress(82);
                        const attempts = await getMyAttempts();
                        if (cancelled) return;
                        const recentAttempts = mapAttemptsToRecommendationPayload(attempts, courses);

                        const reco = await recommendArticlesFromAttempts({
                            recentAttempts,
                            limit: 3,
                        });
                        if (!cancelled) {
                            setRecommendationStrategy(reco.strategy);
                            setRecommendations(reco.items ?? []);
                            writeReadingRecoToSession(recoCacheKey, {
                                strategy: reco.strategy,
                                items: reco.items ?? [],
                            });
                        }
                        if (!cancelled) setLoadingProgress(94);
                    }
                } catch (nextError) {
                    if (!cancelled) {
                        setRecommendationError(
                            nextError instanceof Error ? nextError.message : 'Khong tai duoc de xuat bai viet lien quan.'
                        );
                    }
                } finally {
                    if (!cancelled) setRecommendationLoading(false);
                }
            } catch (nextError) {
                if (!cancelled) {
                    setPageError(nextError instanceof Error ? nextError.message : 'Không thể tải trang hoàn thành.');
                }
            } finally {
                if (!cancelled) {
                    setLoadingProgress(100);
                    setLoading(false);
                }
            }
        }
        void run();
        return () => { cancelled = true; };
    }, [attemptId, courseSlug, lessonSlug]);

    useEffect(() => {
        if (!attemptId || result?.resultStatus !== 'PROVISIONAL') {
            return;
        }
        const id = attemptId;
        const tick = async () => {
            try {
                const next = await getAttemptResultFresh(id);
                setResult(next);
            } catch {
                // Giữ PROVISIONAL; lần tải sau thử lại.
            }
        };
        const interval = window.setInterval(() => { void tick(); }, 4000);
        return () => window.clearInterval(interval);
    }, [attemptId, result?.resultStatus]);

    useEffect(() => {
        if (!attemptId || !result || streakSyncedRef.current) {
            return;
        }

        const completedStatuses = new Set(['SUBMITTED', 'PENDING_REVIEW', 'FINALIZED']);
        if (!completedStatuses.has(result.attemptStatus)) {
            return;
        }

        void syncLearningStreakForCompletedAttempt(attemptId)
            .then(() => {
                streakSyncedRef.current = true;
            })
            .catch(() => {
                streakSyncedRef.current = false;
            });
    }, [attemptId, result]);

    useEffect(() => {
        if (!result || progressSyncedRef.current) {
            return;
        }

        if (result.attemptStatus !== 'FINALIZED' && result.resultStatus !== 'FINAL') {
            return;
        }

        progressSyncedRef.current = true;
        invalidateCachedValue(
            cacheKeys.assessment.myAttempts(),
            cacheKeys.assessment.inProgressAttempts(),
        );
        invalidateCachedValueByPrefix(cacheKeys.learning.contentActivityPrefix());
        const progressDetail: LearningProgressChangedDetail = {
            attemptId: attemptId ?? undefined,
            courseSlug,
            contentId: result.contentId,
            completedAt: result.completedAt,
            attemptStatus: result.attemptStatus,
            resultStatus: result.resultStatus,
            passed: result.passed,
            score: result.score,
            maxScore: result.maxScore,
        };
        patchEnrolledCoursesCache(progressDetail);
        patchRoadmapCaches(progressDetail);
        useUserStore.getState().recordLearningProgressChange(progressDetail);
        notifyLearningProgressChanged(progressDetail);
    }, [attemptId, courseSlug, result]);

    const outcome: Outcome = useMemo(() => {
        if (loading) return 'loading';
        if (pageError) return 'page-error';
        if (attemptId && resultFetchError) return 'result-error';
        if (!attemptId || !result) return 'neutral';
        if (result.resultStatus === 'PROVISIONAL' || result.attemptStatus === 'PENDING_REVIEW') return 'grading';
        if (result.resultStatus === 'FINAL' && result.passed) return 'passed';
        if (result.resultStatus === 'FINAL' && !result.passed) return 'failed';
        return 'neutral';
    }, [attemptId, loading, pageError, result, resultFetchError]);

    const headline = useMemo(() => {
        switch (outcome) {
            case 'page-error':
                return 'Không tải được trang';
            case 'result-error':
                return 'Bài học thất bại';
            case 'grading':
                return 'Đang chấm điểm';
            case 'passed':
                return 'Hoàn thành bài học';
            case 'failed':
                return 'Bạn đã trượt bài học';
            case 'neutral':
                return 'Bạn đã hoàn thành bài học';
            default:
                return '';
        }
    }, [outcome]);

    const subline = useMemo(() => {
        switch (outcome) {
            case 'grading':
                return 'Một số câu cần chấm thủ công (quản trị). Điểm hiển thị có thể là tạm thời cho đến khi chấm xong.';
            case 'passed':
                return 'Kết quả đã chốt: bạn đạt ngưỡng điểm yêu cầu.';
            case 'failed':
                return 'Kết quả đã chốt: điểm chưa đạt ngưỡng yêu cầu.';
            case 'result-error':
                return 'Không lấy được kết quả từ hệ thống sau khi nộp bài. Vui lòng thử lại sau hoặc xem lại bài làm.';
            default:
                return '';
        }
    }, [outcome]);

    const panelClass = useMemo(() => {
        switch (outcome) {
            case 'passed':
                return 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50';
            case 'failed':
            case 'result-error':
                return 'border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50';
            case 'grading':
                return 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50';
            default:
                return 'border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50';
        }
    }, [outcome]);

    const iconWrapClass = useMemo(() => {
        switch (outcome) {
            case 'passed':
                return 'bg-green-500';
            case 'failed':
            case 'result-error':
                return 'bg-rose-500';
            case 'grading':
                return 'bg-amber-500';
            default:
                return 'bg-sky-500';
        }
    }, [outcome]);

    const iconGlyph = useMemo(() => {
        switch (outcome) {
            case 'passed':
                return '✓';
            case 'failed':
            case 'result-error':
                return '!';
            case 'grading':
                return '…';
            default:
                return '✓';
        }
    }, [outcome]);

    const badgeLabel = useMemo(() => {
        switch (outcome) {
            case 'passed':
                return 'Đạt';
            case 'failed':
                return 'Chưa đạt';
            case 'result-error':
                return 'Lỗi kết quả';
            case 'grading':
                return 'Chờ chấm';
            default:
                return 'Hoàn thành nội dung học';
        }
    }, [outcome]);

    const badgeTone = useMemo(() => {
        switch (outcome) {
            case 'passed':
                return 'text-green-700';
            case 'failed':
            case 'result-error':
                return 'text-rose-700';
            case 'grading':
                return 'text-amber-800';
            default:
                return 'text-sky-800';
        }
    }, [outcome]);

    const resultScorePercent = useMemo(() => getResultScorePercent(result), [result]);
    const resultMascotSrc = result
        ? resultScorePercent === null
            ? '/images/Mascot/26.svg'
            : getMascotByScorePercent(resultScorePercent)
        : null;
    const resultMascotLabel = resultScorePercent === null ? 'Bài học' : `${resultScorePercent}% điểm`;

    if (outcome === 'loading') {
        return (
            <LessonCompletionLoadingScreen
                streakDays={streakDays ?? 0}
                progress={loadingProgress}
                onLogout={handleLogout}
            />
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#f7f8fa] font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="mx-auto max-w-3xl">
                        <Link
                            href={`/courses/${courseSlug}`}
                            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200">‹</span>
                            Quay lại lộ trình
                        </Link>

                        {pageError ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{pageError}</div>
                        ) : (
                            <div className={`max-w-full overflow-hidden rounded-3xl border px-8 py-10 shadow-sm ${panelClass}`}>
                                <div className="relative flex flex-col gap-6 lg:block lg:min-h-[clamp(14rem,20vw,24rem)]">
                                    <div className="min-w-0 lg:max-w-[clamp(18rem,34vw,34rem)]">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white ${iconWrapClass}`}>
                                                {iconGlyph}
                                            </span>
                                            <p className={`min-w-0 break-words text-xs font-bold uppercase tracking-[0.24em] [overflow-wrap:anywhere] ${badgeTone}`}>{badgeLabel}</p>
                                        </div>
                                        <h1 className="mt-5 break-words text-3xl font-extrabold text-gray-900 [overflow-wrap:anywhere]">{headline}</h1>
                                        {subline ? <p className="mt-2 break-words text-sm text-gray-700 [overflow-wrap:anywhere]">{subline}</p> : null}
                                    </div>

                                    {resultMascotSrc ? (
                                        <div className="relative flex w-full shrink-0 flex-col items-center overflow-visible rounded-2xl px-4 py-0 lg:absolute lg:right-[-8rem] lg:top-[-9rem] lg:w-[clamp(15rem,22vw,28rem)]">
                                            <Image
                                                src={resultMascotSrc}
                                                alt="Mascot kết quả bài tập"
                                                width={768}
                                                height={768}
                                                priority
                                                loading="eager"
                                                className="h-[clamp(15rem,27vw,32rem)] w-[clamp(15rem,27vw,32rem)] max-w-none object-contain"
                                            />
                                            <span className={`translate-x-[-1rem] mt-[clamp(-8rem,-9vw,-5.75rem)] rounded-full bg-white/85 px-4 py-1.5 text-sm font-bold text-gray-700 shadow-sm backdrop-blur-sm ${resultScorePercent === null ? 'hidden' : ''}`}>
                                                {resultScorePercent}% điểm
                                            </span>
                                            {resultScorePercent === null ? (
                                                <span className="translate-x-[-1rem] mt-[clamp(-8rem,-9vw,-5.75rem)] rounded-full bg-white/85 px-4 py-1.5 text-sm font-bold text-gray-700 shadow-sm backdrop-blur-sm">
                                                    {resultMascotLabel}
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                                {outcome === 'result-error' && resultFetchError ? (
                                    <p className="mt-2 text-xs text-gray-600">{resultFetchError}</p>
                                ) : null}

                                {lesson && (
                                    <p className="mt-3 max-w-full break-words text-sm text-gray-600 [overflow-wrap:anywhere]">
                                        <span className="font-semibold text-gray-800">{lesson.name}</span>
                                        {' · '}
                                        {lesson.courseName} • {lesson.sectionName}
                                    </p>
                                )}

                                {result && outcome !== 'result-error' ? (
                                    <>
                                        {outcome === 'grading' && result.pendingManualReviews > 0 ? (
                                            <p className="mt-3 break-words text-sm font-semibold text-amber-800 [overflow-wrap:anywhere]">
                                                Còn {result.pendingManualReviews} câu đang chờ chấm thủ công.
                                            </p>
                                        ) : null}
                                        {result.maxScore > 0 ? (
                                            <p className="mt-3 break-words text-sm text-gray-700 [overflow-wrap:anywhere]">
                                                <span className="font-semibold text-gray-900">Điều kiện đạt:</span>
                                                {' '}
                                                tổng điểm ≥ {formatScore(passThresholdPoints(result.maxScore))} / {formatScore(result.maxScore)}
                                                {' '}(≥ {LESSON_PASS_SCORE_RATIO * 100}% điểm tối đa; cùng quy tắc với hệ thống chấm).
                                            </p>
                                        ) : null}
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                                            <StatCard label="Điểm" value={formatScore(result.score)} />
                                            <StatCard label="Điểm tối đa" value={formatScore(result.maxScore)} />
                                            <StatCard label="Đúng" value={String(result.correctAnswers)} />
                                            <StatCard label="Tổng câu" value={String(result.totalQuestions)} />
                                        </div>
                                        <p className="mt-4 text-xs text-gray-500">
                                            Cập nhật lúc {new Date(result.completedAt).toLocaleString('vi-VN')}
                                        </p>
                                    </>
                                ) : null}

                                <div className="mt-6 max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm">
                                    <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 [overflow-wrap:anywhere]">
                                        Bài viết nên đọc tiếp
                                    </p>
                                    {recommendationLoading ? (
                                        <p className="mt-2 break-words text-sm text-gray-600 [overflow-wrap:anywhere]">Dang phan tich attempts gan nhat de de xuat bai viet...</p>
                                    ) : null}
                                    {!recommendationLoading && recommendationError ? (
                                        <p className="mt-2 break-words text-sm text-rose-600 [overflow-wrap:anywhere]">{recommendationError}</p>
                                    ) : null}
                                    {!recommendationLoading && !recommendationError && recommendations.length === 0 ? (
                                        <p className="mt-2 break-words text-sm text-gray-600 [overflow-wrap:anywhere]">Chua co de xuat phu hop luc nay.</p>
                                    ) : null}
                                    {!recommendationLoading && !recommendationError && recommendations.length > 0 ? (
                                        <div className="mt-3 grid gap-3">
                                            {recommendations.map((item) => (
                                                <Link
                                                    key={item.articleId}
                                                    href={`/encyclopedia/${encodeURIComponent(item.slug)}`}
                                                    className="block rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-[#2aa4e8]"
                                                >
                                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="break-words text-sm font-semibold text-gray-900 [overflow-wrap:anywhere]">{item.title}</p>
                                                            <p className="mt-1 break-words text-xs text-gray-600 [overflow-wrap:anywhere]">{item.reason}</p>
                                                        </div>
                                                        <span className="shrink-0 rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">
                                                            {item.source === 'ai' ? `AI ${Math.round((item.matchScore ?? 0) * 100)}%` : 'Fallback'}
                                                        </span>
                                                    </div>
                                                    {item.tags?.length ? (
                                                        <p className="mt-2 break-words text-[11px] text-gray-500 [overflow-wrap:anywhere]">
                                                            Tags: {item.tags.slice(0, 4).join(', ')}
                                                        </p>
                                                    ) : null}
                                                </Link>
                                            ))}
                                            <p className="break-words text-[11px] text-gray-500 [overflow-wrap:anywhere]">
                                                Nguon de xuat: {recommendationStrategy === 'ai' ? 'AI relevance matching' : 'Top viewed unread fallback'}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="mt-7 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/courses/${courseSlug}`)}
                                        className="inline-flex items-center justify-center rounded-full bg-[#2aa4e8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d8bcb]"
                                    >
                                        Quay lại lộ trình
                                    </button>
                                    {attemptId && outcome !== 'result-error' ? (
                                        <Link
                                            href={`/attempts/${attemptId}/review`}
                                            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300"
                                        >
                                            Xem lại bài làm
                                        </Link>
                                    ) : null}
                                    {attemptId && outcome !== 'result-error' ? (
                                        <Link
                                            href={`/attempts/${attemptId}/result`}
                                            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300"
                                        >
                                            Xem kết quả chi tiết
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/*
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
                Äang hoÃ n táº¥t bÃ i táº­p
            </p>
            <h1 className="mt-3 text-2xl font-extrabold text-gray-900">
                Há»‡ thá»‘ng Ä‘ang ghi nháº­n káº¿t quáº£ cá»§a báº¡n
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                Giá»¯ nguyÃªn mÃ n hÃ¬nh trong giÃ¢y lÃ¡t Ä‘á»ƒ cáº­p nháº­t tiáº¿n Ä‘á»™ khÃ³a há»c.
            </p>

            <div className="mt-8 w-full max-w-md">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>Tiáº¿n trÃ¬nh</span>
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
    );
}

*/
function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white bg-white/70 px-4 py-4 shadow-sm backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
        </div>
    );
}
