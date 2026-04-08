'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { getAttemptResult } from '@/shared/api/assessment';

export default function AttemptResultPage() {
    const params = useParams<{ attemptId: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState<null | {
        score: number;
        maxScore: number;
        correctAnswers: number;
        totalQuestions: number;
        passed: boolean;
        completedAt: string;
    }>(null);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const data = await getAttemptResult(params.attemptId);
                if (!cancelled) setResult(data);
            } catch (nextError) {
                if (!cancelled) setError(nextError instanceof Error ? nextError.message : 'Khong the tai ket qua.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, [params.attemptId]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#f7f8fa] font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={0} />
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white px-6 py-8">
                        {loading ? <div className="py-12 text-center text-gray-500">Dang tai ket qua...</div> : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                        ) : result && (
                            <>
                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2aa4e8]">Assessment result</p>
                                <h1 className="mt-3 text-3xl font-extrabold text-gray-900">{result.passed ? 'Ban da vuot qua bai kiem tra' : 'Ban chua vuot qua bai kiem tra'}</h1>
                                <p className="mt-3 text-sm text-gray-600">Hoan thanh luc {new Date(result.completedAt).toLocaleString('vi-VN')}</p>
                                <div className="mt-6 grid gap-4 md:grid-cols-4">
                                    <Card label="Diem" value={result.score} />
                                    <Card label="Diem toi da" value={result.maxScore} />
                                    <Card label="Dung" value={result.correctAnswers} />
                                    <Card label="Tong cau" value={result.totalQuestions} />
                                </div>
                            </>
                        )}
                        <Link href="/dashboard" className="mt-6 inline-flex text-sm font-semibold text-[#2aa4e8] hover:text-[#1d8bcb]">
                            Quay lai dashboard
                        </Link>
                    </div>
                </div>
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
