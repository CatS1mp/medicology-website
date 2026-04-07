'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { TRENDING_TAGS } from '../types';

export const EncyclopediaLanding: React.FC = () => {
    const router = useRouter();
    const { handleLogout } = useLogout();
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
                <AppHeader streak={17} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 relative">
                <div className="relative z-10 w-full max-w-xl text-center flex flex-col items-center">
                        {/* Super label */}
                        <span className="text-[#1CA1F2] text-[13px] font-bold uppercase tracking-[0.18em] mb-3">
                            Bách khoa Y học
                        </span>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
                            Bạn muốn học gì hôm nay?
                        </h1>
                        <p className="text-gray-500 text-[15px] mb-8">
                            Tìm kiếm bài viết, khóa học, chủ đề và chương
                        </p>

                        {/* Search box */}
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
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Tìm kiếm bệnh lý, phương pháp điều trị, khóa học..."
                                    className="flex-1 bg-transparent outline-none text-[16px] text-gray-800 placeholder-gray-400"
                                />
                            </div>
                            {query.trim() && (
                                <p className="text-[13px] text-gray-400 mt-2 text-center">
                                    Nhấn <kbd className="bg-gray-100 border border-gray-300 text-gray-600 text-[11px] font-mono px-1.5 py-0.5 rounded-md">Enter</kbd> để xem đầy đủ kết quả
                                </p>
                            )}
                        </div>

                        {/* Trending tags */}
                        <div className="mt-8 flex flex-col items-center gap-3">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Xu hướng tìm kiếm:</span>
                            <div className="flex flex-wrap justify-center gap-2">
                                {TRENDING_TAGS.map(tag => (
                                    <button
                                        key={tag}
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
            </div>
        </div>
    );
};
