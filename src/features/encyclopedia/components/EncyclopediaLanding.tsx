'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { TRENDING_TAGS } from '../types';
import { useEncyclopediaLandingArticles } from '../hooks/useEncyclopedia';

export const EncyclopediaLanding: React.FC = () => {
    const router = useRouter();
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const { articles, isLoading: articlesLoading } = useEncyclopediaLandingArticles();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        router.push(`/encyclopedia/results?q=${encodeURIComponent(trimmed)}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch(query);
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto">
                    {/* Chiếm ít nhất một khung nhìn: danh sách bài nằm bên dưới, chỉ thấy khi cuộn */}
                    <div className="min-h-[calc(100dvh-5.5rem)] flex flex-col items-center justify-center px-6 py-14 box-border">
                        <div className="relative z-10 w-full max-w-xl text-center flex flex-col items-center">
                            <span className="text-[#1CA1F2] text-[13px] font-bold uppercase tracking-[0.18em] mb-3">
                                Bách khoa Y học
                            </span>

                            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
                                Bạn muốn học gì hôm nay?
                            </h1>
                            <p className="text-gray-500 text-[15px] mb-8">
                                Tìm kiếm bài viết, khóa học, chủ đề và chương
                            </p>

                            <div className="w-full relative">
                                <div
                                    className="w-full flex items-center gap-3 border-2 border-[#1CA1F2] rounded-2xl px-5 py-4 bg-white shadow-[0_0_0_4px_rgba(28,161,242,0.1)] cursor-text transition-shadow"
                                    onClick={() => inputRef.current?.focus()}
                                >
                                    <svg className="w-5 h-5 text-[#1CA1F2] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Tìm kiếm bệnh lý, phương pháp điều trị, khóa học..."
                                        className="flex-1 bg-transparent outline-none text-[16px] text-gray-800 placeholder-gray-400"
                                    />
                                </div>
                                {query.trim() && (
                                    <p className="text-[13px] text-gray-400 mt-2 text-center">
                                        Nhấn <kbd className="bg-gray-100 border border-gray-300 text-gray-600 text-[11px] font-mono px-1.5 py-0.5 rounded-md">Enter</kbd>{' '}
                                        để xem đầy đủ kết quả
                                    </p>
                                )}
                            </div>

                            <div className="mt-8 flex flex-col items-center gap-3">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Xu hướng tìm kiếm:</span>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {TRENDING_TAGS.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleSearch(tag)}
                                            className="px-4 py-1.5 rounded-full border border-gray-200 text-[14px] text-gray-600 hover:border-[#1CA1F2] hover:text-[#1CA1F2] transition-colors bg-white"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <section className="w-full border-t border-gray-100 bg-[#fafbfc]" aria-labelledby="encyclopedia-article-feed-title">
                        <div className="max-w-none w-full px-6 lg:px-10 xl:px-12 py-10 pb-20">
                            <div className="flex items-end justify-between gap-4 mb-6">
                                <h2 id="encyclopedia-article-feed-title" className="text-lg sm:text-xl font-bold text-gray-900">
                                    Bài viết gợi ý
                                </h2>
                                <span className="text-[13px] text-gray-400 hidden sm:inline">Cuộn xuống để xem</span>
                            </div>

                            {articlesLoading && (
                                <div className="flex flex-col gap-4 animate-pulse">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        // eslint-disable-next-line react/no-array-index-key -- static skeleton placeholders
                                        <div key={i} className="w-full rounded-2xl border border-gray-100 bg-white p-5 h-[108px]" />
                                    ))}
                                </div>
                            )}

                            {!articlesLoading && articles.length === 0 && (
                                <p className="text-gray-500 text-[15px] py-8">Chưa có bài viết được xuất bản.</p>
                            )}

                            {!articlesLoading && articles.length > 0 && (
                                <ul className="flex flex-col gap-4 list-none m-0 p-0">
                                    {articles.map((a) => (
                                        <li key={a.id} className="w-full">
                                            <Link
                                                href={`/encyclopedia/${encodeURIComponent(a.slug)}`}
                                                className="group block w-full rounded-2xl border border-gray-200 bg-white px-5 py-5 sm:px-6 shadow-sm transition-all hover:border-[#8ed0f8] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA1F2]"
                                            >
                                                <h3 className="text-[17px] sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-[#1478b8] transition-colors leading-snug">
                                                    {a.title}
                                                </h3>
                                                <p className="text-[14px] sm:text-[15px] text-gray-600 leading-relaxed line-clamp-3 m-0">
                                                    {a.excerpt.trim()
                                                        ? a.excerpt
                                                        : 'Mở bài để đọc toàn văn trên Medicology.'}
                                                </p>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};