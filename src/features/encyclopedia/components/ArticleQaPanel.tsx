'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    askArticleQuestion,
    getArticleSuggestedQuestions,
    type DictionaryArticleQaCitation,
    type DictionaryArticleQaResponse,
} from '@/features/encyclopedia/api';

export interface ArticleQaTocItem {
    id: string;
    label: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    outOfScope?: boolean;
    citations?: DictionaryArticleQaCitation[];
}

interface ArticleQaPanelProps {
    articleId: string;
    tableOfContents: ArticleQaTocItem[];
    isLoggedIn: boolean;
    variant?: 'sidebar' | 'inline';
}

function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
    return (
        <div
            className={`rounded-lg px-2.5 py-2 text-xs leading-relaxed ${
                message.role === 'user' ? 'ml-4 bg-[#e8f6ff] text-gray-800' : 'mr-2 bg-white text-gray-700 shadow-sm'
            }`}
        >
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.role === 'assistant' && message.outOfScope && (
                <p className="mt-1 text-[10px] font-medium text-amber-600">Câu hỏi nằm ngoài phạm vi bài viết.</p>
            )}
            {message.role === 'assistant' && !!message.citations?.length && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {message.citations.map((citation) => (
                        <button
                            key={`${message.id}-${citation.sectionId}`}
                            type="button"
                            onClick={() => scrollToSection(citation.sectionId)}
                            className="rounded-md border border-[#8ed0f8] bg-[#f0f9ff] px-2 py-0.5 text-[10px] font-semibold text-[#1CA1F2] hover:bg-[#e0f4ff]"
                        >
                            {citation.heading || 'Xem mục'}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function QaPanelContent({ articleId, tableOfContents, isLoggedIn }: Omit<ArticleQaPanelProps, 'variant'>) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggested, setSuggested] = useState<string[]>([]);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoggedIn) {
            setSuggested([]);
            return;
        }
        let cancelled = false;
        async function loadSuggested() {
            try {
                const response = await getArticleSuggestedQuestions(articleId);
                if (!cancelled) {
                    setSuggested(response.questions ?? []);
                }
            } catch {
                if (!cancelled) {
                    const fromToc = [
                        'Tóm tắt nội dung chính của bài viết',
                        ...tableOfContents.slice(0, 3).map((item) => `Giải thích mục: ${item.label}`),
                    ];
                    setSuggested(fromToc.slice(0, 4));
                }
            }
        }
        void loadSuggested();
        return () => {
            cancelled = true;
        };
    }, [articleId, isLoggedIn, tableOfContents]);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    const submitQuestion = useCallback(
        async (rawQuestion: string) => {
            const question = rawQuestion.trim();
            if (!question || loading || !isLoggedIn) return;

            setError('');
            setLoading(true);
            const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: question,
            };
            setMessages((prev) => [...prev, userMessage]);
            setInput('');

            const conversation = [...messages, userMessage]
                .slice(-4)
                .map((message) => ({ role: message.role, content: message.content }));

            try {
                const response: DictionaryArticleQaResponse = await askArticleQuestion(articleId, {
                    question,
                    conversation,
                });
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: response.answer,
                        outOfScope: response.outOfScope,
                        citations: response.citations ?? [],
                    },
                ]);
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Không gửi được câu hỏi.';
                setError(message);
                setMessages((prev) => prev.slice(0, -1));
            } finally {
                setLoading(false);
            }
        },
        [articleId, isLoggedIn, loading, messages]
    );

    return (
        <>
            <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#2b9de5]">Hỏi về bài này</h4>
                <span className="rounded-full bg-[#ecf8ff] px-2 py-0.5 text-[10px] font-semibold text-[#1CA1F2]">AI</span>
            </div>

            <p className="mb-3 text-[11px] leading-relaxed text-gray-500">
                Trả lời dựa trên nội dung bài viết. Không thay thế tư vấn y khoa chuyên môn.
            </p>

            {!isLoggedIn ? (
                <div className="rounded-xl border border-dashed border-[#8ed0f8] bg-[#f8fcff] px-3 py-4 text-center text-sm text-gray-600">
                    <p className="mb-3">Đăng nhập để hỏi AI về bài viết này.</p>
                    <Link
                        href="/login"
                        className="inline-flex rounded-xl bg-[#1CA1F2] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#1590d9]"
                    >
                        Đăng nhập
                    </Link>
                </div>
            ) : (
                <>
                    {suggested.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                            {suggested.map((chip) => (
                                <button
                                    key={chip}
                                    type="button"
                                    disabled={loading}
                                    onClick={() => void submitQuestion(chip)}
                                    className="rounded-full border border-[#8ed0f8] bg-white px-2.5 py-1 text-[10px] font-medium text-[#1CA1F2] transition hover:bg-[#ecf8ff] disabled:opacity-50"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    <div
                        ref={listRef}
                        className="mb-3 max-h-52 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-[#fbfcff] p-2.5"
                    >
                        {!messages.length && (
                            <p className="text-xs text-gray-400">Đặt câu hỏi về nội dung bài viết.</p>
                        )}
                        {messages.map((message) => (
                            <ChatMessageBubble key={message.id} message={message} />
                        ))}
                        {loading && <p className="text-xs text-gray-400">Đang trả lời...</p>}
                    </div>

                    {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void submitQuestion(input);
                        }}
                        className="flex gap-2"
                    >
                        <input
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Hỏi về bài viết..."
                            disabled={loading}
                            maxLength={500}
                            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#1CA1F2]"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="shrink-0 rounded-xl bg-[#1CA1F2] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Gửi
                        </button>
                    </form>
                </>
            )}
        </>
    );
}

export function ArticleQaPanel({ articleId, tableOfContents, isLoggedIn, variant = 'sidebar' }: ArticleQaPanelProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    if (variant === 'inline') {
        return (
            <div className="mb-8 rounded-2xl border border-[#8ed0f8] bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] lg:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen((open) => !open)}
                    className="mb-3 flex w-full items-center justify-between text-left"
                >
                    <span className="text-sm font-bold text-[#1CA1F2]">Hỏi AI về bài viết</span>
                    <span className="text-xs text-gray-400">{mobileOpen ? 'Thu gọn' : 'Mở rộng'}</span>
                </button>
                {mobileOpen && (
                    <QaPanelContent articleId={articleId} tableOfContents={tableOfContents} isLoggedIn={isLoggedIn} />
                )}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[#8ed0f8] bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
            <QaPanelContent articleId={articleId} tableOfContents={tableOfContents} isLoggedIn={isLoggedIn} />
        </div>
    );
}

