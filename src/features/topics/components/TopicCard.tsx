import React from 'react';
import Image from 'next/image';
import { Topic } from '../types';
import { Button } from '@/shared/components/Button';

interface TopicCardProps {
    topic: Topic;
    onStartLearning?: (topicSlug: string) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, onStartLearning }) => {
    const hasRating = typeof topic.rating === 'number';
    const hasCourseCount = typeof topic.courseCount === 'number';

    return (
        <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 flex flex-col h-full shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
            {/* Image Container */}
            <div className="relative h-48 w-full bg-[#E5F0FF] flex items-center justify-center p-6 mix-blend-multiply">
                {/* Level Badge */}
                <div className="absolute top-4 right-4 z-10 bg-[#E5F0FF]/80 backdrop-blur-md text-[#4147D5] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {topic.level}
                </div>
                
                <Image 
                    src={topic.imageUrl} 
                    alt={topic.title} 
                    width={180} 
                    height={180} 
                    className="object-contain w-full h-full mix-blend-darken filter drop-shadow-md"
                />
            </div>

            {/* Content Container */}
            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start gap-3 mb-2">
                    {/* Tiny icon box */}
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-100">
                        <div className="w-3 h-3 rounded-full border-2 border-green-400"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                            {topic.title}
                        </h3>
                    </div>
                </div>
                
                <p className="text-[13px] text-gray-500 line-clamp-2 mt-1 mb-4 min-h-[40px] leading-relaxed">
                    {topic.description}
                </p>

                {(hasRating || hasCourseCount) && (
                    <div className="mt-auto flex items-center justify-between text-xs text-gray-500 font-medium mb-4">
                        {hasRating ? (
                            <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-md text-yellow-700">
                                <span className="flex text-yellow-500 text-[10px]">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </span>
                                <span>{topic.rating!.toFixed(1)}</span>
                            </div>
                        ) : (
                            <div />
                        )}

                        {hasCourseCount && (
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>{topic.courseCount} Khóa học chuyên đề</span>
                            </div>
                        )}
                    </div>
                )}

                <Button 
                    fullWidth 
                    className="py-2.5 text-[13px] font-bold tracking-wide uppercase shadow-[0_4px_0_0_#3b82f6] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#3b82f6] active:translate-y-[4px] active:shadow-none transition-all"
                    onClick={() => onStartLearning?.(topic.slug)}
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Bắt đầu học
                    </div>
                </Button>
            </div>
        </div>
    );
};
