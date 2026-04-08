'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { listBookmarkedArticles } from '@/features/encyclopedia/api';
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
    const { streakDays } = useLearningStreak();
    const [activeCategory, setActiveCategory] = useState<'All' | BookmarkCategory>('All');
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<Array<{
        id: string;
        slug: string;
        category: BookmarkCategory;
        title: string;
        description: string;
        tags: string[];
        views: string;
        publishedAt: string;
        bookmarkedAt: string;
    }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        async function run() {
            setIsLoading(true);
            setError('');
            try {
                const data = await listBookmarkedArticles();
                if (cancelled) return;
                setItems(data.map((item) => ({
                    id: item.id,
                    slug: item.slug,
                    category: mapCategory(item.tags?.map((tag) => tag.name) ?? []),
                    title: item.name,
                    description: stripMarkdown(item.contentMarkdown).slice(0, 160),
                    tags: (item.tags ?? []).map((tag) => tag.name),
                    views: '-',
                    publishedAt: item.publishedAt ? `Xuất bản ${new Date(item.publishedAt).toLocaleDateString('vi-VN')}` : 'Chưa xuất bản',
                    bookmarkedAt: item.bookmarkedAt ? `Đã lưu ${new Date(item.bookmarkedAt).toLocaleDateString('vi-VN')}` : 'Đã lưu gần đây',
                })));
            } catch (nextError) {
                if (!cancelled) {
                    setItems([]);
                    setError(nextError instanceof Error ? nextError.message : 'Không thể tải sổ tay lưu trữ.');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        const byCategory = activeCategory === 'All'
            ? items
            : items.filter((item) => item.category === activeCategory);

        if (!query.trim()) return byCategory;
        const keyword = query.toLowerCase();
        return byCategory.filter((item) => item.title.toLowerCase().includes(keyword));
    }, [activeCategory, items, query]);

    return (
        <div className="flex h-screen bg-[#f7f8fa] overflow-hidden font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />

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

                        <p className="text-xs text-gray-600 mb-3">Đang hiển thị {filtered.length} mục đã lưu</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {isLoading && <div className="col-span-full py-12 text-center text-gray-500">Đang tải dữ liệu lưu trữ...</div>}
                            {!isLoading && !!error && <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
                            {!isLoading && !error && filtered.length === 0 && <div className="col-span-full py-12 text-center text-gray-500">Chưa có bài viết nào trong sổ tay.</div>}
                            {!isLoading && !error && filtered.map((item) => (
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
                                    <Link href={`/encyclopedia/${item.slug}`} className="mt-4 inline-flex text-sm font-semibold text-[#2aa4e8] hover:text-[#1d8bcb]">
                                        Mở bài viết
                                    </Link>
                                </article>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

function stripMarkdown(markdown: string) {
    return markdown
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[#>*_~\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function mapCategory(tags: string[]): BookmarkCategory {
    const haystack = tags.join(' ').toLowerCase();
    if (haystack.includes('tim') || haystack.includes('mach')) return 'Cardiovascular';
    if (haystack.includes('tam') || haystack.includes('than') || haystack.includes('lo au')) return 'Mental Health';
    if (haystack.includes('dinh duong') || haystack.includes('nutrition')) return 'Nutrition';
    return 'Emergency';
}
