'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/shared/store/useUserStore';

export const BrokenStreakCard: React.FC = () => {
    const { lostStreakAmount, dismissBrokenStreak } = useUserStore();
    const [displayNumber, setDisplayNumber] = useState<number | null>(null);
    const [isGrey, setIsGrey] = useState(false);

    useEffect(() => {
        if (lostStreakAmount !== null && displayNumber === null) {
            setDisplayNumber(lostStreakAmount);
            
            // start color transition shortly after mounting
            const timeout = setTimeout(() => {
                setIsGrey(true);
            }, 300);
            
            // Count down logic
            const totalDuration = 2500; // 2.5 seconds to count down to zero
            const stepTime = Math.max(30, totalDuration / lostStreakAmount);
            let current = lostStreakAmount;
            
            const interval = setInterval(() => {
                current--;
                if (current <= 0) {
                    current = 0;
                    clearInterval(interval);
                }
                setDisplayNumber(current);
            }, stepTime);

            return () => {
                clearTimeout(timeout);
                clearInterval(interval);
            };
        }
    }, [lostStreakAmount, displayNumber]);

    if (lostStreakAmount === null || displayNumber === null) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-500">
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">
                    Ôi không! Chuỗi học bị đứt 
                </h2>
                
                <div 
                    className={`relative flex items-center justify-center transition-colors duration-[2500ms] ${
                        isGrey ? 'text-zinc-300 dark:text-zinc-600' : 'text-orange-500'
                    }`}
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="140" 
                        height="140" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        stroke="currentColor" 
                        strokeWidth="1" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="drop-shadow-lg"
                    >
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                    </svg>
                    <span className="absolute text-4xl font-black text-white dark:text-zinc-900">
                        {displayNumber}
                    </span>
                </div>

                <p className="text-zinc-500 dark:text-zinc-400 mt-6 mb-8 text-sm">
                    Bạn đã bỏ lỡ một ngày học. Đừng bỏ cuộc, hãy bắt đầu lại một chuỗi mới ngay hôm nay nhé!
                </p>

                <button 
                    onClick={dismissBrokenStreak}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                        isGrey 
                            ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700' 
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                >
                    Tiếp tục học
                </button>
            </div>
        </div>
    );
};
