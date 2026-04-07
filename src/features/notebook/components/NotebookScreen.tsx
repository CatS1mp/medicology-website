'use client';

import React, { useMemo, useState } from 'react';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { useLogout } from '@/shared/hooks/useLogout';
import { mockBookmarks } from '../data/mockBookmarks';
import { BookmarkCategory } from '../types';

const categoryFilters: Array<'All' | BookmarkCategory> = ['All', 'Emergency', 'Mental Health', 'Cardiovascular', 'Nutrition'];

const categoryLabelMap: Record<'All' | BookmarkCategory, string> = {
    All: 'Tất cả',
    Emergency: 'Khẩn cấp',
    'Mental Health': 'Sức khỏe tinh thần',
    Cardiovascular: 'Tim mạch',
    Nutrition: 'Dinh dưỡng',
};

export const NotebookScreen: React.FC = () => {
    const { handleLogout } = useLogout();
    const [activeCategory, setActiveCategory] = useState<'All' | BookmarkCategory>('All');
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const byCategory = activeCategory === 'All'
            ? mockBookmarks
            : mockBookmarks.filter((item) => item.category === activeCategory);

        if (!query.trim()) return byCategory;
        const keyword = query.toLowerCase();
        return byCategory.filter((item) => item.title.toLowerCase().includes(keyword));
    }, [activeCategory, query]);

    return (
        <div className="flex h-screen bg-[#f7f8fa] overflow-hidden font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={0} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto px-7 py-6">
                    <div className="max-w-[1080px] mx-auto">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-[42px] font-extrabold text-[#2f3b4c]">Sổ tay lưu trữ</h1>
                            <span className="w-8 h-8 rounded-full border-2 border-[#2aa4e8] text-[#2aa4e8] flex items-center justify-center text-sm font-bold">{filtered.length}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-5">Các bài viết bạn đã lưu để đọc lại sau.</p>

                        <div className="flex items-center gap-3 mb-4">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Tìm kiếm bài viết đã lưu..."
                                className="h-10 w-[300px] px-3 rounded-xl border border-gray-200 bg-white text-sm"
                            />
                            <select className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600">
                                <option>Mới nhất</option>
                                <option>Cũ nhất</option>
                            </select>
                            <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
                                <span>Mỗi trang</span>
                                <button className="w-7 h-7 rounded-md border border-[#2aa4e8] text-[#2aa4e8] font-bold">6</button>
                                <button className="w-7 h-7 rounded-md border border-gray-200 text-gray-500">12</button>
                                <button className="w-7 h-7 rounded-md border border-gray-200 text-gray-500">24</button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-5">
                            {categoryFilters.map((category) => {
                                const active = category === activeCategory;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category)}
                                        className={`px-4 h-8 rounded-[9px] text-xs border transition-colors ${active ? 'bg-[#2aa4e8] border-[#2aa4e8] text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {categoryLabelMap[category]}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="text-xs text-gray-600 mb-3">Hiển thị 1-6 trong tổng số 7 mục đã lưu</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filtered.map((item) => (
                                <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 min-h-[278px] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                    <p className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-500">{categoryLabelMap[item.category]}</p>
                                    <h3 className="text-[22px] leading-tight font-bold text-gray-800 mt-3 mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-3 min-h-[58px]">{item.description}</p>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {item.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-1 text-[11px] rounded-full bg-gray-100 text-gray-600">{tag}</span>
                                        ))}
                                    </div>

                                    <div className="border-t border-gray-100 pt-3 text-xs text-gray-600 space-y-1">
                                        <p>{item.views} lượt xem  •  {item.publishedAt}</p>
                                        <p>{item.bookmarkedAt}</p>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-7 mb-2 flex items-center justify-center gap-2">
                            <button className="w-8 h-8 rounded-md border border-gray-200 text-gray-400">‹</button>
                            <button className="w-8 h-8 rounded-md bg-[#2aa4e8] text-white font-semibold">1</button>
                            <button className="w-8 h-8 rounded-md border border-gray-200 text-gray-500">2</button>
                            <button className="w-8 h-8 rounded-md border border-gray-200 text-gray-500">›</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
