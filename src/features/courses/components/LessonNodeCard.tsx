import React from 'react';
import Link from 'next/link';
import { LessonNode, LessonStatus } from '../types';
import { sanitizeAppHref } from '@/shared/utils/navigation';

interface LessonNodeCardProps {
    node: LessonNode;
    isLastInSection: boolean;
    onSelect?: (node: LessonNode) => void;
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}

export const LessonNodeCard: React.FC<LessonNodeCardProps> = ({ node, isLastInSection, onSelect }) => {
    const safeHref = node.href ? sanitizeAppHref(node.href) : null;
    const isInProgress = Boolean(node.inProgressAttemptId) && node.status !== 'completed' && node.status !== 'failed';

    const statusStyles: Record<LessonStatus, {
        border: string;
        bg: string;
        textInfo: string;
        title: string;
        iconBg: string;
        iconText: string;
    }> = {
        completed: {
            border: 'border-[#4CAF50]',
            bg: 'bg-white',
            textInfo: 'text-[#4CAF50] font-medium',
            title: 'text-gray-900',
            iconBg: 'bg-[#E8F5E9]',
            iconText: 'text-[#4CAF50]'
        },
        failed: {
            border: 'border-red-400',
            bg: 'bg-white',
            textInfo: 'text-red-600 font-medium',
            title: 'text-gray-900',
            iconBg: 'bg-red-100',
            iconText: 'text-red-700'
        },
        active: {
            border: 'border-[#1CA1F2]',
            bg: 'bg-white',
            textInfo: 'text-[#1CA1F2] font-semibold text-xs',
            title: 'text-gray-900 font-bold',
            iconBg: 'bg-[#E1F3FE]',
            iconText: 'text-[#1CA1F2]'
        },
        locked: {
            border: 'border-gray-200',
            bg: 'bg-[#F9FAFB]',
            textInfo: 'text-gray-400',
            title: 'text-gray-400',
            iconBg: 'bg-gray-100',
            iconText: 'text-gray-400'
        },
        next: {
            border: 'border-[#9C27B0]',
            bg: 'bg-white',
            textInfo: 'text-[#9C27B0] font-medium',
            title: 'text-gray-900',
            iconBg: 'bg-[#F3E5F5]',
            iconText: 'text-[#9C27B0]'
        }
    };

    const style = statusStyles[node.status];
    const isTest = node.type === 'test';

    const isDone = node.status === 'completed' && !isInProgress;
    const isFailed = node.status === 'failed' && !isInProgress;
    const cardSurfaceClass = isInProgress
        ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100/80 shadow-[0_1px_0_rgba(251,191,36,0.35)]'
        : isDone
            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50/90 shadow-[0_1px_0_rgba(16,185,129,0.2)]'
            : isFailed
                ? 'border-red-500 bg-gradient-to-br from-red-50 to-rose-50/90 shadow-[0_1px_0_rgba(239,68,68,0.2)]'
                : `${style.border} ${style.bg}`;
    const iconSurfaceClass = isInProgress
        ? 'bg-amber-200 text-amber-900'
        : isDone
            ? 'bg-emerald-100 text-emerald-700'
            : isFailed
                ? 'bg-red-100 text-red-700'
                : `${style.iconBg} ${style.iconText}`;

    const renderIcon = () => {
        if (isInProgress) {
            return <ClockIcon className="mx-auto h-6 w-6" />;
        }
        if (isTest) {
            return (
                <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        }
        
        const num = String(node.orderIndex ?? 1);
        return <span className="font-bold text-lg">{num}</span>;
    };

    const renderRightAction = () => {
        if (isInProgress) {
            return <ClockIcon className="h-7 w-7 text-amber-600" />;
        }
        if (node.status === 'completed') {
            return (
                <svg className="w-6 h-6 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        }
        if (node.status === 'failed') {
            return (
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-7.73 13.4A1 1 0 003.42 19h15.16a1 1 0 00.86-1.74l-7.73-13.4a1 1 0 00-1.72 0z" />
                </svg>
            );
        }
        if (node.status === 'locked') {
            return (
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
            );
        }
        if (node.status === 'active' || node.status === 'next') {
            return (
                <svg className={`w-5 h-5 ${style.textInfo}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
            );
        }
        return null;
    };

    const content = (
        <div className="relative pl-12 sm:pl-16 w-full max-w-2xl mb-4">
            {!isLastInSection && (
                <div className="absolute left-[29px] sm:left-[45px] top-[60px] bottom-[-16px] w-[2px] bg-gray-100" />
            )}

            <div
                className={`flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl border-2 p-4 shadow-sm transition-transform hover:-translate-y-0.5 ${safeHref ? 'cursor-pointer' : ''} ${cardSurfaceClass}`}
            >
                
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${iconSurfaceClass}`}>
                        {renderIcon()}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className={`mb-0.5 flex min-w-0 flex-wrap items-center gap-2 text-[15px] font-bold ${isInProgress ? 'text-gray-900' : isDone ? 'text-emerald-950' : isFailed ? 'text-red-900' : style.title}`}>
                            <span className="min-w-0 break-words line-clamp-2 [overflow-wrap:anywhere]">{node.title}</span>
                            {isInProgress ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-900">
                                    <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                                    Đang làm dở
                                </span>
                            ) : isDone ? (
                                <span className="rounded-full border border-emerald-400/60 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-900">
                                    Đã hoàn thành
                                </span>
                            ) : isFailed ? (
                                <span className="rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-red-900">
                                    Chưa đạt
                                </span>
                            ) : null}
                        </h3>
                        
                        <div className="mt-1 min-w-0">
                            {isInProgress ? (
                                <span className="block break-words text-[12px] font-medium leading-snug text-amber-900/85 [overflow-wrap:anywhere]">
                                    Phiên làm bài chưa nộp — nhấn để tiếp tục
                                </span>
                            ) : isDone ? (
                                <span className="text-[12px] font-medium text-emerald-800/90">Nhấn để vào học lại hoặc xem kết quả</span>
                            ) : isFailed ? (
                                <span className="text-[12px] font-medium text-red-700">Điểm chưa đạt yêu cầu — nhấn để làm lại</span>
                            ) : node.status === 'active' ? (
                                <span className={`block break-words [overflow-wrap:anywhere] ${style.textInfo}`}>Bắt đầu ngay</span>
                            ) : node.type === 'test' ? (
                                <span className={`block break-words text-[12px] opacity-80 [overflow-wrap:anywhere] ${style.textInfo}`}>{node.description}</span>
                            ) : node.score ? (
                                <span className={`block break-words text-[12px] [overflow-wrap:anywhere] ${style.textInfo}`}>
                                    {node.score.current} / {node.score.max} câu đúng
                                </span>
                            ) : node.description ? (
                                <span className={`block break-words text-[12px] [overflow-wrap:anywhere] ${style.textInfo}`}>{node.description}</span>
                            ) : (
                                <span className={`text-[12px] ${style.textInfo}`}>
                                    0 / 10
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 pr-2">
                    {renderRightAction()}
                </div>

            </div>
        </div>
    );

    if (safeHref && node.status !== 'locked' && onSelect) {
        return (
            <button type="button" onClick={() => onSelect({ ...node, href: safeHref })} className="w-full text-left">
                {content}
            </button>
        );
    }

    if (safeHref && node.status !== 'locked') {
        return <Link href={safeHref}>{content}</Link>;
    }

    return content;
};
