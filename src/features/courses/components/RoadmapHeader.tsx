import React, { useState } from 'react';

interface RoadmapHeaderProps {
    title: string;
    progress: { current: number; total: number };
    streak: { days: number; message: string };
}

export const RoadmapHeader: React.FC<RoadmapHeaderProps> = ({ title, progress, streak }) => {
    const [showStreak, setShowStreak] = useState(true);
    const safeCurrent = Math.max(0, progress.current);
    const safeTotal = Math.max(0, progress.total);
    const progressPercent =
        safeTotal > 0 ? Math.min(100, Math.round((safeCurrent / safeTotal) * 100)) : 0;

    return (
        <div className="w-full max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl font-extrabold text-[#1CA1F2] text-center mb-6">
                {title}
            </h1>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-gray-100 h-2.5 rounded-full relative overflow-hidden">
                    <div 
                        className="absolute left-0 top-0 bottom-0 bg-[#1CA1F2] rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-orange-400 rounded-full border-2 border-white shadow-sm"
                        style={{ left: `calc(${progressPercent}% - 6px)` }}
                    />
                </div>
                <div className="text-xs font-bold text-gray-400 w-24 text-right">
                    {safeCurrent} / {safeTotal} bài học
                </div>
            </div>

            {showStreak && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-4 shadow-sm relative">
                    <button 
                        onClick={() => setShowStreak(false)}
                        className="absolute top-3 right-3 text-orange-300 hover:text-orange-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5 border-4 border-orange-100 shadow-sm">
                        {/* Flame — streak / continuity */}
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12.963 2.286a.75.75 0 00-1.071-.136 9.625 9.625 0 00-3.445 4.379l-.12.309c-.08.208-.27.343-.486.343a.75.75 0 01-.65-.472l-.098-.309C6.46 4.491 5.04 2.784 3.128 1.726a.75.75 0 00-.867 1.156 11.245 11.245 0 011.648 2.826c.346.995.547 2.073.547 3.188 0 4.773-3.309 8.806-7.755 9.856a.75.75 0 01-.719-.988 15.405 15.405 0 014.384-7.498 15.405 15.405 0 00-4.384-7.498.75.75 0 01.719-.988z"
                            />
                        </svg>
                    </div>

                    <div>
                        <h4 className="font-extrabold text-orange-500 text-sm mb-0.5">
                            {streak.days} NGÀY LIÊN TIẾP
                        </h4>
                        <p className="text-orange-900/60 text-xs font-medium pr-6">
                            {streak.message}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
