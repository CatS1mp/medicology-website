'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { Skeleton } from '@/shared/components/Skeleton';
import { getAttemptResult } from '@/shared/api/assessment';
import { syncLearningStreakForCompletedAttempt, useLearningStreak } from '@/shared/hooks/useLearningStreak';

export default function AttemptResultPage() {
    const params = useParams<{ attemptId: string }>();
    const { streakDays } = useLearningStreak();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState<null | {
        score: number;
        maxScore: number;
        correctAnswers: number;
        totalQuestions: number;
        passed: boolean;
        completedAt: string;
        resultStatus: 'PROVISIONAL' | 'FINAL';
        pendingManualReviews: number;
    }>(null);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const data = await getAttemptResult(params.attemptId);
                if (!cancelled) setResult(data);
            } catch (nextError) {
                if (!cancelled) setError(nextError instanceof Error ? nextError.message : 'Không thể tải kết quả.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, [params.attemptId]);

    useEffect(() => {
        if (!result?.completedAt) return;
        void syncLearningStreakForCompletedAttempt(params.attemptId).catch(() => undefined);
    }, [params.attemptId, result?.completedAt]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#f7f8fa] font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} />
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-gray-200 bg-white px-6 py-8">
                        {loading ? <AttemptResultSkeleton /> : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                        ) : result && (
                            <>
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2aa4e8]">Kết quả bài kiểm tra</p>
                                        <h1 className="mt-3 break-words text-3xl font-extrabold text-gray-900 [overflow-wrap:anywhere]">
                                            {result.resultStatus === 'PROVISIONAL'
                                                ? 'Bài làm đang chờ duyệt thủ công'
                                                : result.passed
                                                    ? 'Bạn đã vượt qua bài kiểm tra'
                                                    : 'Bạn chưa vượt qua bài kiểm tra'}
                                        </h1>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-center rounded-2xl border border-gray-100 bg-[#f8fbff] px-4 py-3 shadow-sm">
                                        <Image
                                            src="/images/Mascot/26.svg"
                                            alt="Mascot bài học"
                                            width={104}
                                            height={104}
                                            className="h-[104px] w-[104px] object-contain"
                                        />
                                        <span className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-sm">
                                            Bài học
                                        </span>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-gray-600">Hoàn thành lúc {new Date(result.completedAt).toLocaleString('vi-VN')}</p>
                                {result.resultStatus === 'PROVISIONAL' ? (
                                    <p className="mt-2 text-sm font-semibold text-amber-600">
                                        Còn {result.pendingManualReviews} câu cần manual review.
                                    </p>
                                ) : null}
                                <div className="mt-6 grid gap-4 md:grid-cols-4">
                                    <Card label="Điểm" value={result.score} />
                                    <Card label="Điểm tối đa" value={result.maxScore} />
                                    <Card label="Đúng" value={result.correctAnswers} />
                                    <Card label="Tổng câu" value={result.totalQuestions} />
                                </div>
                                <div className="mt-5 flex flex-wrap items-center gap-4">
                                    <Link href={`/attempts/${params.attemptId}/review`} className="inline-flex text-sm font-semibold text-[#2aa4e8] hover:text-[#1d8bcb]">
                                        Xem lại bài làm
                                    </Link>
                                    <Link href="/dashboard" className="inline-flex text-sm font-semibold text-[#2aa4e8] hover:text-[#1d8bcb]">
                                        Quay lại dashboard
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AttemptResultSkeleton() {
    return (
        <div className="space-y-5 py-2">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-10 w-2/3 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="mt-2 h-8 w-12 rounded" />
                    </div>
                ))}
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
            </div>
        </div>
    );
}

function Card({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
        </div>
    );
}
