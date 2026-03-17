'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useArticle } from '../hooks/useEncyclopedia';

interface ArticleDetailScreenProps {
    slug: string;
}

export const ArticleDetailScreen: React.FC<ArticleDetailScreenProps> = ({ slug }) => {
    const { article, isLoading } = useArticle(slug);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex h-screen bg-white font-sans">
                <AppSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <AppHeader streak={17} />
                    <div className="flex-1 flex items-center justify-center text-gray-400">Đang tải bài viết...</div>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex h-screen bg-white font-sans">
                <AppSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <AppHeader streak={17} />
                    <div className="flex-1 flex items-center justify-center text-gray-400">Không tìm thấy bài viết.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={17} />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                            {/* Meta bar */}
                            <div className="flex items-center gap-4 mb-6">
                                <Link href="/encyclopedia/results" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                                <div className="flex items-center gap-3 text-[13px] text-gray-400">
                                    <span>{article.viewCount.toLocaleString()} lượt xem</span>
                                    {article.lastViewed && (
                                        <>
                                            <span>•</span>
                                            <span>Xem lần cuối: {article.lastViewed}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Tag chips */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {article.tags.map(tag => (
                                    <span key={tag.slug} className="px-3 py-1 rounded-full bg-[#E5F0FF] text-[#1CA1F2] text-[12px] font-bold uppercase tracking-wider">
                                        {tag.label}
                                    </span>
                                ))}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-extrabold text-[#1CA1F2] mb-6 leading-tight">
                                {article.title}
                            </h1>

                            {/* Article sections */}
                            {article.sections.map(section => (
                                <div key={section.id} id={section.id} className="mb-10 scroll-mt-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-[#1CA1F2] rounded-r-md flex-shrink-0" />
                                        {section.heading}
                                    </h2>

                                    {/* Full-width content image — the SVG IS the article content */}
                                    {section.imageUrl && (
                                        <div className="w-full mb-6 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                            <Image
                                                src={section.imageUrl}
                                                alt={section.heading}
                                                width={900}
                                                height={600}
                                                className="w-full h-auto object-contain"
                                            />
                                        </div>
                                    )}

                                    {section.content && (
                                        <div className="text-[15px] text-gray-700 leading-relaxed space-y-3">
                                            {section.content.split('\n\n').map((para, i) => (
                                                <p key={i} dangerouslySetInnerHTML={{
                                                    __html: para
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                        .replace(/_(.*?)_/g, '<em>$1</em>')
                                                }} />
                                            ))}
                                        </div>
                                    )}

                                    <hr className="mt-10 border-gray-100" />
                                </div>
                            ))}
                        </div>

                        {/* Right sidebar */}
                        <div className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-6">
                            {/* Table of contents */}
                            <div className="sticky top-6">
                                <div className="bg-gray-50 rounded-2xl p-5 mb-4">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Mục lục</h4>
                                    <nav className="flex flex-col gap-1.5">
                                        {article.tableOfContents.map(item => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                onClick={() => setActiveSection(item.id)}
                                                className={`text-[13px] leading-snug transition-colors ${item.level === 2 ? 'pl-4' : ''} ${
                                                    activeSection === item.id ? 'text-[#1CA1F2] font-medium' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                {item.label}
                                            </a>
                                        ))}
                                    </nav>
                                </div>

                                {/* Related articles */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Bài viết liên quan</h4>
                                    <div className="flex flex-col gap-2.5">
                                        {article.relatedArticles.map(rel => (
                                            <Link
                                                key={rel.id}
                                                href={`/encyclopedia/${rel.slug}`}
                                                className="bg-gray-50 rounded-xl p-3 hover:bg-[#E5F0FF] transition-colors group"
                                            >
                                                <p className="text-[14px] font-semibold text-gray-800 group-hover:text-[#1CA1F2] transition-colors leading-tight mb-0.5">
                                                    {rel.title}
                                                </p>
                                                <p className="text-[11px] font-bold text-[#4CAF50] uppercase tracking-wider">
                                                    {rel.category}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
