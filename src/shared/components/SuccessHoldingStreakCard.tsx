'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/shared/store/useUserStore';

export const SuccessHoldingStreakCard: React.FC = () => {
    const { gainedStreakAmount, gainedFromStreak, dismissGainedStreak } = useUserStore();
    const [displayNumber, setDisplayNumber] = useState<number | null>(null);
    const [isFiery, setIsFiery] = useState(false);

    useEffect(() => {
        if (gainedStreakAmount !== null && gainedFromStreak !== null && displayNumber === null) {
            // Start with the old number
            setDisplayNumber(gainedFromStreak);
            
            // Wait a short moment, then increase the number and ignite the fire
            const timeout = setTimeout(() => {
                setDisplayNumber(gainedStreakAmount);
                setIsFiery(true);
            }, 600);
            
            return () => clearTimeout(timeout);
        }
    }, [gainedStreakAmount, gainedFromStreak, displayNumber]);

    if (gainedStreakAmount === null || displayNumber === null) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-500">
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">
                    Lửa học tập bùng cháy!
                </h2>
                
                <div 
                    className={`relative flex items-center justify-center transition-all duration-1000 ease-out ${
                        isFiery 
                            ? 'text-red-500 scale-110 drop-shadow-[0_0_40px_rgba(239,68,68,0.7)]' 
                            : 'text-orange-400 scale-100'
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
                    >
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                    </svg>
                    <span className="absolute text-4xl font-black text-white dark:text-zinc-900">
                        {displayNumber}
                    </span>
                </div>

                <p className="text-zinc-500 dark:text-zinc-400 mt-6 mb-8 text-sm leading-relaxed">
                    Tuyệt vời! Bạn vừa gia tăng chuỗi học tập. Hãy tiếp tục duy trì ngọn lửa này mỗi ngày nhé!
                </p>

                <button 
                    onClick={dismissGainedStreak}
                    className="w-full py-4 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] transition-transform duration-300"
                >
                    Tiếp tục phát huy
                </button>
            </div>
        </div>
    );
};
