'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { useEncyclopediaSearch } from '../hooks/useEncyclopedia';
import { TRENDING_TAGS, ArticleCategory } from '../types';

const CATEGORIES: Array<'Tất cả' | ArticleCategory> = ['Tất cả', 'Cấp cứu', 'Sức khỏe Tâm thần', 'Tim mạch', 'Dinh dưỡng'];
const PER_PAGE_OPTIONS = [3, 5, 10] as const;

export const SearchResultsScreen: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') ?? '';

    const { handleLogout } = useLogout();

    const { results, filters, setFilters, search, isLoading } = useEncyclopediaSearch(initialQuery);
    const [inputValue, setInputValue] = useState(initialQuery);

    // Sync input with URL query param changes
    useEffect(() => {
        setInputValue(initialQuery);
        search(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialQuery]);

    const handleSearch = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        router.push(`/encyclopedia/results?q=${encodeURIComponent(trimmed)}`);
    };

    // Highlight query term inside text
    const highlight = (text: string, q: string) => {
        if (!q) return text;
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <span key={i} className="text-[#1CA1F2] font-semibold">{part}</span> : part
        );
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={17} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-6 py-8">
                        {/* Back button */}
                        <Link href="/encyclopedia" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-[14px]">
                            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </div>
                        </Link>

                        {/* Search bar */}
                        <div className="w-full flex items-center gap-3 border border-gray-200 rounded-2xl px-5 py-4 bg-white shadow-sm mb-6 focus-within:border-[#1CA1F2] focus-within:shadow-[0_0_0_3px_rgba(28,161,242,0.1)] transition-all">
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                className="flex-1 bg-transparent outline-none text-[16px] text-gray-800 placeholder-gray-400"
                                placeholder="Tìm kiếm..."
                                autoFocus
                            />
                            {inputValue && (
                                <button onClick={() => { setInputValue(''); router.push('/encyclopedia/results?q='); }} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Filters row */}
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            {/* Sort */}
                            <select
                                value={filters.sortBy}
                                onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as typeof filters.sortBy }))}
                                className="border border-gray-200 rounded-xl px-4 py-2 text-[14px] font-medium text-gray-700 bg-white outline-none cursor-pointer"
                            >
                                <option>Phù hợp nhất</option>
                                <option>Mới nhất</option>
                                <option>Nhiều lượt xem</option>
                            </select>

                            {/* Per page */}
                            <div className="flex items-center gap-1.5 text-[14px] text-gray-500">
                                <span>Mỗi trang</span>
                                {PER_PAGE_OPTIONS.map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setFilters(f => ({ ...f, perPage: n }))}
                                        className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-colors ${filters.perPage === n ? 'bg-[#1CA1F2] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category chip filters */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilters(f => ({ ...f, category: cat }))}
                                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${filters.category === cat ? 'bg-[#1CA1F2] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Results count */}
                        {filters.query && !isLoading && (
                            <p className="text-[13px] text-gray-400 mb-4 uppercase tracking-wide font-medium">
                                {results.length} KẾT QUẢ CHO &ldquo;{filters.query.toUpperCase()}&rdquo;
                            </p>
                        )}

                        {/* Results list */}
                        {isLoading ? (
                            <div className="py-16 text-center text-gray-400">Đang tìm kiếm...</div>
                        ) : results.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {results.map(article => (
                                    <Link
                                        key={article.id}
                                        href={`/encyclopedia/${article.slug}`}
                                        className="block border border-gray-200 rounded-2xl p-6 hover:border-[#1CA1F2] hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 pr-4">
                                                <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2 block">{article.subtitle}</span>
                                                <h2 className="text-[18px] font-bold text-gray-900 mb-2 group-hover:text-[#1CA1F2] transition-colors">
                                                    {highlight(article.title, filters.query)}
                                                </h2>
                                                <p className="text-[14px] text-gray-500 line-clamp-2 mb-4">{article.excerpt}</p>
                                                <div className="flex items-center gap-4 text-[12px] text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        {article.viewCount.toLocaleString()} lượt xem
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        {new Date(article.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
                                                        {article.readTimeMin} phút đọc
                                                    </span>
                                                    {article.tags.map(t => (
                                                        <span key={t.slug} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t.label}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-[#1CA1F2] group-hover:text-[#1CA1F2] transition-colors mt-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : filters.query ? (
                            <div className="py-16 text-center text-gray-400">Không tìm thấy kết quả nào cho &ldquo;{filters.query}&rdquo;</div>
                        ) : (
                            <div className="py-8">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Xu hướng tìm kiếm:</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {TRENDING_TAGS.map(tag => (
                                        <button key={tag} onClick={() => { setInputValue(tag); router.push(`/encyclopedia/results?q=${encodeURIComponent(tag)}`); }}
                                            className="px-4 py-1.5 rounded-full border border-gray-200 text-[14px] text-gray-600 hover:border-[#1CA1F2] hover:text-[#1CA1F2] transition-colors">
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
