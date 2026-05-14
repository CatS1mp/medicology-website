'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import type { DictionaryArticleRecommendationItem } from '@/features/encyclopedia/api';
import {
    encyclopediaLandingRecoCacheKey,
    readReadingRecoFromSession,
    writeReadingRecoToSession,
} from '@/features/encyclopedia/readingRecoSessionCache';
import { fetchLearnerReadingRecommendations } from '@/features/encyclopedia/readingRecommendationsLearner';

const MASCOT_SRC =
    "https://gagxbaxkhopxpwoxniqd.supabase.co/storage/v1/object/public/Medicology's%20email%20request/mascot-reading.svg";

const UI_COLLAPSED_KEY = 'medicology:encyclopedia-reading-bubble-collapsed';

function readCollapsedPreference(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(UI_COLLAPSED_KEY) === '1';
}

function writeCollapsedPreference(collapsed: boolean) {
    try {
        sessionStorage.setItem(UI_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
        // ignore
    }
}

function MinusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/**
 * Bong bong goi y doc (theme #1CA1F2) — fixed goc duoi phai, luon thay khong can cuon toi khu hero.
 */
export function EncyclopediaReadingBubble() {
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [strategy, setStrategy] = useState<'ai' | 'fallback_popular_unread' | null>(null);
    const [items, setItems] = useState<DictionaryArticleRecommendationItem[]>([]);

    useLayoutEffect(() => {
        setCollapsed(readCollapsedPreference());
    }, []);

    useEffect(() => {
        let cancelled = false;
        const cacheKey = encyclopediaLandingRecoCacheKey();
        const cached = readReadingRecoFromSession(cacheKey);
        if (cached) {
            setStrategy(cached.strategy);
            setItems(cached.items ?? []);
            return;
        }

        async function run() {
            setLoading(true);
            setError('');
            try {
                const reco = await fetchLearnerReadingRecommendations();
                if (cancelled) return;
                setStrategy(reco.strategy);
                setItems(reco.items ?? []);
                writeReadingRecoToSession(cacheKey, {
                    strategy: reco.strategy,
                    items: reco.items ?? [],
                });
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Khong tai duoc goi y.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void run();
        return () => {
            cancelled = true;
        };
    }, []);

    const setCollapsedPersist = (next: boolean) => {
        setCollapsed(next);
        writeCollapsedPreference(next);
    };

    const shellClass =
        'pointer-events-none fixed z-40 flex justify-end px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0 left-0 right-0 bottom-0 sm:px-6';

    if (collapsed) {
        return (
            <div className={shellClass}>
                <button
                    type="button"
                    onClick={() => setCollapsedPersist(false)}
                    className={[
                        'pointer-events-auto flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center overflow-visible',
                        'rounded-2xl border-2 border-[#1CA1F2] bg-white',
                        'shadow-[0_8px_30px_rgba(28,161,242,0.18),0_0_0_4px_rgba(28,161,242,0.08)]',
                        'transition-transform hover:scale-[1.03] active:scale-[0.98]',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA1F2]',
                    ].join(' ')}
                    aria-expanded={false}
                    aria-label="Mở gợi ý đọc"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element -- external mascot asset */}
                    <img
                        src={MASCOT_SRC}
                        alt=""
                        className="h-full w-full origin-center object-contain scale-[1.5]"
                        width={52}
                        height={52}
                    />
                </button>
            </div>
        );
    }

    return (
        <div className={shellClass} aria-live="polite">
            <div
                className={[
                    'pointer-events-auto relative w-full max-w-[min(20rem,calc(100vw-2rem))]',
                    'rounded-2xl border-2 border-[#1CA1F2] bg-white',
                    'shadow-[0_8px_30px_rgba(28,161,242,0.18),0_0_0_4px_rgba(28,161,242,0.08)]',
                    'flex flex-col overflow-hidden',
                ].join(' ')}
            >
                <button
                    type="button"
                    onClick={() => setCollapsedPersist(true)}
                    className={[
                        'absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-xl',
                        'border border-[#1CA1F2]/50 bg-white text-[#1CA1F2] shadow-sm',
                        'hover:bg-[#e8f6fd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA1F2]',
                    ].join(' ')}
                    aria-expanded={true}
                    aria-label="Thu gọn gợi ý đọc"
                >
                    <MinusIcon className="block" />
                </button>

                <div className="flex items-center gap-2 border-b border-[#1CA1F2]/25 bg-gradient-to-r from-[#e8f6fd] to-white px-3 py-2.5 pr-12">
                    <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1CA1F2] text-[13px] font-bold text-white"
                        aria-hidden
                    >
                        BK
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1CA1F2]">Gợi ý đọc</p>
                        <p className="truncate text-[13px] font-semibold text-gray-900">Theo bài bạn vừa học</p>
                    </div>
                </div>

                <div className="max-h-[min(40vh,14rem)] overflow-y-auto px-3 py-2.5">
                    {loading && (
                        <div className="space-y-2 py-1">
                            <div className="h-3 w-[75%] rounded bg-gray-100 animate-pulse" />
                            <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
                            <div className="h-3 w-[83%] rounded bg-gray-100 animate-pulse" />
                        </div>
                    )}
                    {!loading && error ? <p className="text-[13px] text-rose-600">{error}</p> : null}
                    {!loading && !error && items.length === 0 ? (
                        <p className="text-[13px] text-gray-500">Chưa có gợi ý phù hợp.</p>
                    ) : null}
                    {!loading && !error && items.length > 0 ? (
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                            {items.map((item) => (
                                <li key={item.articleId}>
                                    <Link
                                        href={`/encyclopedia/${encodeURIComponent(item.slug)}`}
                                        className="block rounded-xl border border-gray-100 bg-gray-50/80 px-2.5 py-2 transition-colors hover:border-[#8ed0f8] hover:bg-white"
                                    >
                                        <span className="line-clamp-2 text-[13px] font-semibold text-gray-900">{item.title}</span>
                                        <span className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">{item.reason}</span>
                                        <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-[#1478b8]">
                                            {item.source === 'ai' ? `AI · ${Math.round((item.matchScore ?? 0) * 100)}%` : 'Phổ biến'}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                {strategy && !loading && !error && items.length > 0 ? (
                    <p className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400">
                        {strategy === 'ai' ? 'Gợi ý theo nội dung học gần đây' : 'Gợi ý theo lượt xem (bạn chưa đọc)'}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
