'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { Skeleton } from '@/shared/components/Skeleton';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { getCourses, getRecommendationContext, notifyLearningProgressChanged } from '@/shared/api/learning';
import { getAttemptResult, getAttemptResultFresh } from '@/shared/api/assessment';
import { AttemptResultResponse } from '@/shared/types/assessment';
import { clearEnrolledCoursesCache } from '@/features/courses/hooks/useEnrolledCourses';
import { clearRoadmapCache } from '@/features/courses/hooks/useRoadmap';
import { invalidateCachedValue, invalidateCachedValueByPrefix } from '@/shared/api/client-cache';
import { cacheKeys } from '@/shared/api/cache-policy';
import {
    DictionaryArticleRecommendationItem,
    recommendArticlesFromAttempts,
} from '@/features/encyclopedia/api';
import {
    readReadingRecoFromSession,
    readingRecoSessionKey,
    writeReadingRecoToSession,
} from '@/features/encyclopedia/readingRecoSessionCache';
import { mapDisplayOutcomeToUi, resolveMascotSrc, type LessonCompleteOutcome } from '@/shared/utils/attempt-display';

interface LessonMeta {
    contentId: string;
    courseName: string;
    sectionName: string;
    name: string;
}

type Outcome = LessonCompleteOutcome;

function formatScore(value: number): string {
    if (!Number.isFinite(value)) return '—';
    if (Number.isInteger(value)) return String(value);
    const rounded = Math.round(value * 100) / 100;
    return String(rounded);
}

function getResultScorePercent(result: AttemptResultResponse | null): number | null {
    if (result?.scorePercent != null) {
        return result.scorePercent;
    }
    if (!result || !Number.isFinite(result.score) || !Number.isFinite(result.maxScore) || result.maxScore <= 0) {
        return null;
    }
    return Math.max(0, Math.min(100, Math.round((result.score / result.maxScore) * 100)));
}

export function LessonCompleteScreen({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attemptId');
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [resultFetchError, setResultFetchError] = useState('');
    const [lesson, setLesson] = useState<LessonMeta | null>(null);
    const [result, setResult] = useState<AttemptResultResponse | null>(null);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState('');
    const [recommendationStrategy, setRecommendationStrategy] = useState<'ai' | 'fallback_popular_unread' | null>(null);
    const [recommendations, setRecommendations] = useState<DictionaryArticleRecommendationItem[]>([]);
    const progressSyncedRef = React.useRef(false);

    useEffect(() => {
        progressSyncedRef.current = false;
    }, [attemptId]);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            setLoading(true);
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
                const courses = await getCourses();
                if (cancelled) return;

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

                if (!attemptId) {
                    setResult(null);
                } else {
                    try {
                        const attemptResult = await getAttemptResult(attemptId);
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

                try {
                    if (cachedRecoAtStart) {
                        if (!cancelled) {
                            setRecommendationStrategy(cachedRecoAtStart.strategy);
                            setRecommendations(cachedRecoAtStart.items ?? []);
                        }
                    } else {
                        setRecommendationLoading(true);
                        const recentAttempts = await getRecommendationContext(8);
                        if (cancelled) return;

                        const reco = await recommendArticlesFromAttempts({
                            recentAttempts: recentAttempts.map((item) => ({
                                contentId: item.contentId,
                                contentName: item.contentName,
                                tags: [item.courseName, item.sectionName].filter(Boolean) as string[],
                                submittedAt: item.submittedAt,
                                passed: item.passed,
                            })),
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
                    }
                } catch (nextError) {
                    if (!cancelled) {
                        setRecommendationError(
                            nextError instanceof Error ? nextError.message : 'Không tải được đề xuất bài viết liên quan.'
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
                if (!cancelled) setLoading(false);
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
            cacheKeys.learning.progress()
        );
        invalidateCachedValueByPrefix(cacheKeys.learning.contentActivityPrefix());
        clearEnrolledCoursesCache();
        clearRoadmapCache(courseSlug);
        notifyLearningProgressChanged();
    }, [courseSlug, result]);

    const outcome: Outcome = useMemo(() => {
        if (loading) return 'loading';
        if (pageError) return 'page-error';
        if (attemptId && resultFetchError) return 'result-error';
        if (!attemptId || !result) return 'neutral';
        if (result.displayOutcome) {
            return mapDisplayOutcomeToUi(result.displayOutcome);
        }
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
    const resultMascotSrc = resolveMascotSrc(result?.mascotKey, resultScorePercent);
    const passThreshold =
        result?.passThresholdScore != null ? result.passThresholdScore : result ? result.maxScore * 0.5 : 0;

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

                        {outcome === 'loading' ? (
                            <LessonCompleteSkeleton />
                        ) : pageError ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{pageError}</div>
                        ) : (
                            <div className={`rounded-3xl border px-8 py-10 shadow-sm ${panelClass}`}>
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white ${iconWrapClass}`}>
                                                {iconGlyph}
                                            </span>
                                            <p className={`text-xs font-bold uppercase tracking-[0.24em] ${badgeTone}`}>{badgeLabel}</p>
                                        </div>
                                        <h1 className="mt-5 text-3xl font-extrabold text-gray-900">{headline}</h1>
                                        {subline ? <p className="mt-2 text-sm text-gray-700">{subline}</p> : null}
                                    </div>

                                    {resultMascotSrc ? (
                                        <div className="flex shrink-0 flex-col items-center rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm">
                                            <Image
                                                src={resultMascotSrc}
                                                alt="Mascot kết quả bài tập"
                                                width={112}
                                                height={112}
                                                className="h-28 w-28 object-contain"
                                            />
                                            <span className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-sm">
                                                {resultScorePercent}% điểm
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                                {outcome === 'result-error' && resultFetchError ? (
                                    <p className="mt-2 text-xs text-gray-600">{resultFetchError}</p>
                                ) : null}

                                {lesson && (
                                    <p className="mt-3 text-sm text-gray-600">
                                        <span className="font-semibold text-gray-800">{lesson.name}</span>
                                        {' · '}
                                        {lesson.courseName} • {lesson.sectionName}
                                    </p>
                                )}

                                {result && outcome !== 'result-error' ? (
                                    <>
                                        {outcome === 'grading' && result.pendingManualReviews > 0 ? (
                                            <p className="mt-3 text-sm font-semibold text-amber-800">
                                                Còn {result.pendingManualReviews} câu đang chờ chấm thủ công.
                                            </p>
                                        ) : null}
                                        {result.maxScore > 0 ? (
                                            <p className="mt-3 text-sm text-gray-700">
                                                <span className="font-semibold text-gray-900">Điều kiện đạt:</span>
                                                {' '}
                                                tổng điểm ≥ {formatScore(passThreshold)} / {formatScore(result.maxScore)}
                                                {' '}(ngưỡng đạt do hệ thống chấm).
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

                                <div className="mt-6 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                        Bài viết nên đọc tiếp
                                    </p>
                                    {recommendationLoading ? (
                                        <p className="mt-2 text-sm text-gray-600">Đang phân tích các lần làm bài gần nhất để đề xuất bài viết...</p>
                                    ) : null}
                                    {!recommendationLoading && recommendationError ? (
                                        <p className="mt-2 text-sm text-rose-600">{recommendationError}</p>
                                    ) : null}
                                    {!recommendationLoading && !recommendationError && recommendations.length === 0 ? (
                                        <p className="mt-2 text-sm text-gray-600">Chưa có đề xuất phù hợp lúc này.</p>
                                    ) : null}
                                    {!recommendationLoading && !recommendationError && recommendations.length > 0 ? (
                                        <div className="mt-3 grid gap-3">
                                            {recommendations.map((item) => (
                                                <Link
                                                    key={item.articleId}
                                                    href={`/encyclopedia/${encodeURIComponent(item.slug)}`}
                                                    className="block rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-[#2aa4e8]"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                                            <p className="mt-1 text-xs text-gray-600">{item.reason}</p>
                                                        </div>
                                                        <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">
                                                            {item.source === 'ai' ? `AI ${Math.round((item.matchScore ?? 0) * 100)}%` : 'Dự phòng'}
                                                        </span>
                                                    </div>
                                                    {item.tags?.length ? (
                                                        <p className="mt-2 text-[11px] text-gray-500">
                                                            Thẻ: {item.tags.slice(0, 4).join(', ')}
                                                        </p>
                                                    ) : null}
                                                </Link>
                                            ))}
                                            <p className="text-[11px] text-gray-500">
                                                Nguồn đề xuất: {recommendationStrategy === 'ai' ? 'AI khớp nội dung học' : 'Bài xem nhiều, chưa đọc'}
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

function LessonCompleteSkeleton() {
    return (
        <div className="rounded-3xl border border-gray-200 bg-white px-8 py-10">
            <Skeleton className="h-3 w-40 rounded" />
            <Skeleton className="mt-5 h-10 w-2/3 rounded" />
            <Skeleton className="mt-3 h-4 w-1/2 rounded" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="mt-2 h-8 w-12 rounded" />
                    </div>
                ))}
            </div>
            <div className="mt-7 flex gap-3">
                <Skeleton className="h-10 w-40 rounded-full" />
                <Skeleton className="h-10 w-40 rounded-full" />
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white bg-white/70 px-4 py-4 shadow-sm backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
        </div>
    );
}
