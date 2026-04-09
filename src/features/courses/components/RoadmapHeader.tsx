import React, { useState } from 'react';

interface RoadmapHeaderProps {
    title: string;
    progress: { current: number; total: number };
    streak: { days: number; message: string };
}

export const RoadmapHeader: React.FC<RoadmapHeaderProps> = ({ title, progress, streak }) => {
    const [showStreak, setShowStreak] = useState(true);
    const progressPercent = Math.round((progress.current / progress.total) * 100);

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
                    {progress.current} / {progress.total} courses
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
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.5 10c0-3.5-2.5-6.5-6-7.5-.5-1.5-2.5-2.5-4-2.5-3.5 0-6.5 2.5-7.5 6-.803-.267-1.5-.5-2.5-1 0 4 2 7.5 5.5 9.5.5-2 1.5-3.5 3-5 5-5 5.5-6 6-9z" transform="translate(4 2) scale(0.6)"/>
                            <path d="M11.64 5.93h0l-1.41-1.41C9.64 3.93 8.35 3.32 7 3.32s-2.64.61-3.23 1.2l-1.41 1.41h0L1 7.34h0l1.41 1.41h0C3.01 9.34 4.3 9.94 5.61 9.94s2.6-.61 3.2-1.2h0l1.41-1.41h0L11.64 5.93z" fill="white" transform="translate(5 5) scale(0.6)"/>
                        </svg>
                    </div>

                    <div>
                        <h4 className="font-extrabold text-orange-500 text-sm mb-0.5">
                            {streak.days} DAY STREAK
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