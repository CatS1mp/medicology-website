import React from 'react';
import { LessonNode, LessonStatus } from '../types';

interface LessonNodeCardProps {
    node: LessonNode;
    isLastInSection: boolean;
    displayOrder?: number;
    onClick?: (lessonId: string) => void;
}

export const LessonNodeCard: React.FC<LessonNodeCardProps> = ({ node, isLastInSection, displayOrder, onClick }) => {
    
    // Status colors mapping
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

    // The icon inside the circle (number or star)
    const renderIcon = () => {
        if (isTest) {
            return (
                <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        }
        
        const num = displayOrder ?? 1;
        return <span className="font-bold text-lg">{num}</span>;
    };

    // Right side actions or info (check, lock, chevron)
    const renderRightAction = () => {
        if (node.status === 'completed') {
            return (
                <svg className="w-6 h-6 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

    const handleClick = () => {
        if (node.status === 'locked') return;
        onClick?.(node.id);
    };

    return (
        <div className="relative pl-12 sm:pl-16 w-full max-w-2xl mx-auto mb-4">
            {/* The vertical connecting line to the NEXT item */}
            {!isLastInSection && (
                <div className="absolute left-[29px] sm:left-[45px] top-[60px] bottom-[-16px] w-[2px] bg-gray-200" />
            )}

            {/* The Card */}
            <div
                onClick={handleClick}
                className={`w-full rounded-xl border-2 p-4 flex items-center justify-between shadow-sm cursor-pointer transition-transform hover:-translate-y-0.5 ${style.border} ${style.bg}`}
            >
                
                <div className="flex items-center gap-4">
                    {/* Index / Icon Box */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.iconBg} ${style.iconText}`}>
                        {renderIcon()}
                    </div>

                    {/* Content */}
                    <div>
                        <h3 className={`text-[15px] font-bold mb-0.5 ${style.title}`}>
                            {node.title}
                        </h3>
                        
                        <div className="mt-1">
                            {node.status === 'active' ? (
                                <span className={style.textInfo}>Start now</span>
                            ) : node.type === 'test' ? (
                                <span className={`text-[12px] opacity-80 ${style.textInfo}`}>{node.description}</span>
                            ) : node.score ? (
                                <span className={`text-[12px] ${style.textInfo}`}>
                                    {node.score.current} / {node.score.max} correct
                                </span>
                            ) : (
                                <span className={`text-[12px] ${style.textInfo}`}>
                                    0 / 10
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Action */}
                <div className="pr-2">
                    {renderRightAction()}
                </div>

            </div>
        </div>
    );
};
