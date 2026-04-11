'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { getCurrentProfile, getCurrentUser } from '@/features/auth/api';
import { useArticle } from '../hooks/useEncyclopedia';
import {
    approveArticleComment,
    bookmarkArticle,
    createArticleComment,
    getArticleComments,
    replyArticleComment,
    unbookmarkArticle,
    voteComment,
    type DictionaryCommentResponse,
} from '../api';
import type { ArticleComment } from '../types';

interface ArticleDetailScreenProps {
    slug: string;
}

import { BaseUserLayout } from '@/shared/components/BaseUserLayout';

export const ArticleDetailScreen: React.FC<ArticleDetailScreenProps> = ({ slug }) => {
    const { handleLogout } = useLogout();
    const { article, isLoading } = useArticle(slug);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentViewer, setCurrentViewer] = useState<{ id: string; name: string } | null>(null);
    const [comments, setComments] = useState<ArticleComment[]>([]);
    const [discussionText, setDiscussionText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [replyOpenMap, setReplyOpenMap] = useState<Record<string, boolean>>({});
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [replySubmittingId, setReplySubmittingId] = useState<string | null>(null);
    const [voteSubmittingId, setVoteSubmittingId] = useState<string | null>(null);
    const { streakDays } = useLearningStreak();

    React.useEffect(() => {
        setIsBookmarked(article?.isBookmarked ?? false);
    }, [article?.isBookmarked]);

    React.useEffect(() => {
        setComments(article?.comments ?? []);
        setReplyOpenMap({});
        setReplyDrafts({});
    }, [article?.comments]);

    React.useEffect(() => {
        let cancelled = false;

        async function loadCurrentViewer() {
            try {
                const [profile, user] = await Promise.all([
                    getCurrentProfile().catch(() => null),
                    getCurrentUser().catch(() => null),
                ]);

                if (cancelled || !user) {
                    return;
                }

                setCurrentViewer({
                    id: user.id,
                    name: profile?.displayName || user.username || 'Bạn',
                });
            } catch {
                if (!cancelled) {
                    setCurrentViewer(null);
                }
            }
        }

        void loadCurrentViewer();
        return () => {
            cancelled = true;
        };
    }, []);

    function getCommentAuthorName(comment: ArticleComment) {
        if (comment.displayName?.trim()) return comment.displayName;
        if (comment.username?.trim()) return comment.username;
        if (currentViewer && comment.userId === currentViewer.id) return currentViewer.name;
        return 'Người dùng';
    }

    function mapComment(comment: DictionaryCommentResponse): ArticleComment {
        return {
            id: comment.id,
            userId: comment.userId,
            username: comment.username ?? undefined,
            displayName: comment.displayName ?? undefined,
            text: comment.commentText,
            createdAt: comment.createdAt,
            replies: (comment.replies ?? []).map(mapComment),
        };
    }

    async function refreshComments(articleId: string) {
        const latest = await getArticleComments(articleId);
        setComments(latest.map(mapComment));
    }

    function parseCommentTimestamp(input: string): number {
        const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(input);
        if (hasTimezone) {
            return new Date(input).getTime();
        }

        const normalized = input.includes(' ') ? input.replace(' ', 'T') : input;
        const utcTime = new Date(`${normalized}Z`).getTime();
        const vnTime = new Date(`${normalized}+07:00`).getTime();

        if (Number.isNaN(utcTime) && Number.isNaN(vnTime)) {
            return new Date(input).getTime();
        }

        if (Number.isNaN(utcTime)) return vnTime;
        if (Number.isNaN(vnTime)) return utcTime;

        const now = Date.now();
        // Prefer the interpretation closer to "now" to avoid fixed 7-hour skew.
        return Math.abs(now - utcTime) <= Math.abs(now - vnTime) ? utcTime : vnTime;
    }

    function formatRelativeTime(isoDate: string) {
        const then = parseCommentTimestamp(isoDate);
        if (Number.isNaN(then)) return 'bây giờ';

        const now = Date.now();
        const diffMs = Math.abs(now - then);
        if (diffMs < 5 * 60 * 1000) return 'bây giờ';

        const diffSeconds = Math.round((then - now) / 1000);
        const formatter = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

        const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
            ['year', 60 * 60 * 24 * 365],
            ['month', 60 * 60 * 24 * 30],
            ['week', 60 * 60 * 24 * 7],
            ['day', 60 * 60 * 24],
            ['hour', 60 * 60],
            ['minute', 60],
            ['second', 1],
        ];

        for (const [unit, seconds] of units) {
            if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
                return formatter.format(Math.round(diffSeconds / seconds), unit);
            }
        }

        return 'bây giờ';
    }

    function getAvatarColor(id: string) {
        const palette = ['bg-lime-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500'];
        let hash = 0;
        for (let i = 0; i < id.length; i += 1) {
            hash = (hash << 5) - hash + id.charCodeAt(i);
            hash |= 0;
        }
        return palette[Math.abs(hash) % palette.length];
    }

    function getAvatarLabel(name: string) {
        return name.trim().charAt(0).toUpperCase() || 'U';
    }

    async function handleSubmitComment() {
        if (!article || isSubmittingComment) return;
        const content = discussionText.trim();
        if (!content) return;

        setIsSubmittingComment(true);
        try {
            const createdCommentId = await createArticleComment(article.id, content);
            await approveArticleComment(createdCommentId);
            setDiscussionText('');
            await refreshComments(article.id);
        } catch {
        } finally {
            setIsSubmittingComment(false);
        }
    }

    function toggleReply(commentId: string) {
        setReplyOpenMap((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    }

    function setReplyDraft(commentId: string, value: string) {
        setReplyDrafts((prev) => ({ ...prev, [commentId]: value }));
    }

    async function handleSubmitReply(commentId: string) {
        if (!article || replySubmittingId) return;
        const content = (replyDrafts[commentId] ?? '').trim();
        if (!content) return;

        setReplySubmittingId(commentId);
        try {
            const createdReplyId = await replyArticleComment(commentId, content);
            await approveArticleComment(createdReplyId);
            setReplyDraft(commentId, '');
            setReplyOpenMap((prev) => ({ ...prev, [commentId]: false }));
            await refreshComments(article.id);
        } catch {
        } finally {
            setReplySubmittingId(null);
        }
    }

    async function handleVote(commentId: string, type: 'UPVOTE' | 'DOWNVOTE') {
        if (voteSubmittingId) return;

        setVoteSubmittingId(commentId);
        try {
            await voteComment(commentId, type);
        } catch {
        } finally {
            setVoteSubmittingId(null);
        }
    }

    async function handleToggleBookmark() {
        if (!article) return;
        try {
            if (isBookmarked) {
                await unbookmarkArticle(article.id);
                setIsBookmarked(false);
                return;
            }
            await bookmarkArticle(article.id);
            setIsBookmarked(true);
        } catch {
        }
    }

    if (isLoading) {
        return (
            <BaseUserLayout streak={streakDays ?? 0}>
                <div className="flex-1 flex items-center justify-center text-gray-400">Đang tải bài viết...</div>
            </BaseUserLayout>
        );
    }

    if (!article) {
        return (
            <BaseUserLayout streak={streakDays ?? 0}>
                <div className="flex-1 flex items-center justify-center text-gray-400">Không tìm thấy bài viết.</div>
            </BaseUserLayout>
        );
    }

    return (
        <BaseUserLayout streak={streakDays ?? 0}>
            <div className="max-w-6xl mx-auto min-h-full flex gap-8">
                <div className="flex-1 min-w-0">
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
                        <button
                            type="button"
                            onClick={handleToggleBookmark}
                            className={`ml-auto rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${isBookmarked ? 'border-[#1CA1F2] bg-[#E5F0FF] text-[#1CA1F2]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            {isBookmarked ? 'Đã lưu' : 'Lưu bài viết'}
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {article.tags.map(tag => (
                            <span key={tag.slug} className="px-3 py-1 rounded-full bg-[#E5F0FF] text-[#1CA1F2] text-[12px] font-bold uppercase tracking-wider">
                                {tag.label}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl font-extrabold text-[#1CA1F2] mb-6 leading-tight">
                        {article.title}
                    </h1>

                    {article.interactionSummary && (
                        <div className="mb-8 grid gap-3 md:grid-cols-3">
                            <InfoCard label="Lượt xem" value={article.interactionSummary.totalViews} />
                            <InfoCard label="Lượt lưu" value={article.interactionSummary.totalBookmarks} />
                            <InfoCard label="Bình luận" value={article.interactionSummary.totalComments} />
                        </div>
                    )}

                    {article.sections.map(section => (
                        <div key={section.id} id={section.id} className="mb-10 scroll-mt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#1CA1F2] rounded-r-md flex-shrink-0" />
                                {section.heading}
                            </h2>

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

                    <div className="mb-10 overflow-x-hidden rounded-3xl border border-gray-200 bg-[#f5f5f5] p-6 md:p-8">
                        <h2 className="mb-2 text-[34px] font-extrabold leading-none text-[#e78d14]">Thảo luận</h2>
                        <p className="mb-6 text-sm text-gray-400">Chia sẻ suy nghĩ, đặt câu hỏi hoặc thảo luận chủ đề này cùng cộng đồng.</p>

                        <div className="mb-6 flex items-start gap-3">
                            <div className="h-11 w-11 rounded-full bg-lime-500 text-center text-sm font-bold leading-[44px] text-white">Bạn</div>
                            <div className="min-w-0 flex-1">
                                <textarea
                                    value={discussionText}
                                    onChange={(event) => setDiscussionText(event.target.value)}
                                    placeholder="Chia sẻ suy nghĩ hoặc đặt câu hỏi..."
                                    rows={4}
                                    className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#8cc63f]"
                                />
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSubmitComment}
                                        disabled={isSubmittingComment || !discussionText.trim()}
                                        className="rounded-xl bg-[#68d125] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#57b11f] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSubmittingComment ? 'Đang đăng...' : 'Đăng bình luận'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!comments.length && (
                                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-5 text-sm text-gray-500">
                                    Chưa có bình luận được duyệt. Hãy bắt đầu thảo luận.
                                </div>
                            )}

                            {comments.map((comment) => {
                                const authorName = getCommentAuthorName(comment);
                                const isReplyOpen = !!replyOpenMap[comment.id];
                                const isReplyBusy = replySubmittingId === comment.id;

                                return (
                                    <div key={comment.id} className="overflow-hidden rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
                                        <div className="flex gap-3">
                                            <div className={`h-10 w-10 shrink-0 rounded-full text-center text-sm font-bold leading-10 text-white ${getAvatarColor(comment.id)}`}>
                                                {getAvatarLabel(authorName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-base font-semibold text-gray-800">{authorName}</p>
                                                <p className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</p>
                                                <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-600 [overflow-wrap:anywhere]">{comment.text}</p>

                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVote(comment.id, 'UPVOTE')}
                                                        disabled={voteSubmittingId === comment.id}
                                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed"
                                                    >
                                                        👍 Thích
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVote(comment.id, 'DOWNVOTE')}
                                                        disabled={voteSubmittingId === comment.id}
                                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed"
                                                    >
                                                        👎 Không thích
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleReply(comment.id)}
                                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100"
                                                    >
                                                        Trả lời {comment.replies.length > 0 ? `(${comment.replies.length})` : ''}
                                                    </button>
                                                </div>

                                                {isReplyOpen && (
                                                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                                        <textarea
                                                            value={replyDrafts[comment.id] ?? ''}
                                                            onChange={(event) => setReplyDraft(comment.id, event.target.value)}
                                                            placeholder="Viết phản hồi của bạn..."
                                                            rows={3}
                                                            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#8cc63f]"
                                                        />
                                                        <div className="mt-2 flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleReply(comment.id)}
                                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500"
                                                            >
                                                                Hủy
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSubmitReply(comment.id)}
                                                                disabled={isReplyBusy || !(replyDrafts[comment.id] ?? '').trim()}
                                                                className="rounded-lg bg-[#68d125] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isReplyBusy ? 'Đang gửi...' : 'Trả lời'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {!!comment.replies.length && (
                                                    <div className="mt-4 space-y-3 border-l-2 border-sky-300 pl-4">
                                                        {comment.replies.map((reply) => {
                                                            const replyAuthor = getCommentAuthorName(reply);
                                                            return (
                                                                <div key={reply.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`h-8 w-8 shrink-0 rounded-full text-center text-xs font-bold leading-8 text-white ${getAvatarColor(reply.id)}`}>
                                                                            {getAvatarLabel(replyAuthor)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-semibold text-gray-800">{replyAuthor}</p>
                                                                            <p className="text-[11px] text-gray-400">{formatRelativeTime(reply.createdAt)}</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 [overflow-wrap:anywhere]">{reply.text}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-6">
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
        </BaseUserLayout>
    );
};

function InfoCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-[#fbfcff] px-4 py-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
            <div className="mt-1 text-xl font-extrabold text-gray-900">{value.toLocaleString()}</div>
        </div>
    );
}