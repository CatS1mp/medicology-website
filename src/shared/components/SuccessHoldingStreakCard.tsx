'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/shared/store/useUserStore';

export const SuccessHoldingStreakCard: React.FC = () => {
    const { gainedStreakAmount, gainedFromStreak, streakCardsBlocked, dismissGainedStreak } = useUserStore();

    if (streakCardsBlocked || gainedStreakAmount === null || gainedFromStreak === null) {
        return null;
    }

    return (
        <SuccessStreakDialog
            key={`${gainedFromStreak}-${gainedStreakAmount}`}
            gainedStreakAmount={gainedStreakAmount}
            gainedFromStreak={gainedFromStreak}
            onDismiss={dismissGainedStreak}
        />
    );
};

function SuccessStreakDialog({
    gainedStreakAmount,
    gainedFromStreak,
    onDismiss,
}: {
    gainedStreakAmount: number;
    gainedFromStreak: number;
    onDismiss: () => void;
}) {
    const [displayNumber, setDisplayNumber] = useState(gainedFromStreak);
    const [isFiery, setIsFiery] = useState(false);
    const [showIncrement, setShowIncrement] = useState(false);

    useEffect(() => {
        const igniteTimeout = setTimeout(() => {
            setDisplayNumber(gainedStreakAmount);
            setIsFiery(true);
            setShowIncrement(true);
        }, 600);

        const incrementTimeout = setTimeout(() => {
            setShowIncrement(false);
        }, 1900);

        return () => {
            clearTimeout(igniteTimeout);
            clearTimeout(incrementTimeout);
        };
    }, [gainedStreakAmount]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative mx-4 flex w-full max-w-sm flex-col items-center overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-500 dark:bg-zinc-900">
                <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                    Lửa học tập bùng cháy!
                </h2>

                <div
                    className={`relative flex items-center justify-center transition-all duration-1000 ease-out ${
                        isFiery
                            ? 'scale-110 text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.7)]'
                            : 'scale-100 text-orange-400'
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
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                    </svg>
                    <span className="absolute text-4xl font-black text-white dark:text-zinc-900">
                        {displayNumber}
                    </span>
                    {showIncrement ? (
                        <span className="animate-streak-plus absolute -right-8 top-2 rounded-full bg-[#e6f3ff] px-3 py-1 text-base font-black text-[#2aa4e8] shadow-lg shadow-sky-200/70">
                            +1
                        </span>
                    ) : null}
                </div>

                <p className="mb-8 mt-6 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Thật tuyệt vời! Bạn vừa gia tăng chuỗi học tập. Hãy tiếp tục duy trì ngọn lửa này mỗi ngày nhé!
                </p>

                <button
                    onClick={onDismiss}
                    className="w-full rounded-xl bg-[#2aa4e8] py-4 font-bold text-white shadow-sm transition hover:bg-[#1d8bcb] focus:outline-none focus:ring-4 focus:ring-[#2aa4e8]/20 active:scale-[0.98]"
                >
                    Tiếp tục phát huy
                </button>
            </div>
        </div>
    );
}
