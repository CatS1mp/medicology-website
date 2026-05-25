'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/shared/store/useUserStore';

export const BrokenStreakCard: React.FC = () => {
    const { lostStreakAmount, streakCardsBlocked, dismissBrokenStreak } = useUserStore();

    if (streakCardsBlocked || lostStreakAmount === null) {
        return null;
    }

    return (
        <BrokenStreakDialog
            key={lostStreakAmount}
            lostStreakAmount={lostStreakAmount}
            onDismiss={dismissBrokenStreak}
        />
    );
};

function BrokenStreakDialog({
    lostStreakAmount,
    onDismiss,
}: {
    lostStreakAmount: number;
    onDismiss: () => void;
}) {
    const [displayNumber, setDisplayNumber] = useState(lostStreakAmount);
    const [isDimmed, setIsDimmed] = useState(false);

    useEffect(() => {
        const dimTimeout = window.setTimeout(() => {
            setIsDimmed(true);
        }, 450);

        const totalDuration = 1800;
        const stepTime = Math.max(50, totalDuration / Math.max(1, lostStreakAmount));
        let current = lostStreakAmount;
        const interval = window.setInterval(() => {
            current = Math.max(0, current - 1);
            setDisplayNumber(current);
            if (current === 0) {
                window.clearInterval(interval);
            }
        }, stepTime);

        return () => {
            window.clearTimeout(dimTimeout);
            window.clearInterval(interval);
        };
    }, [lostStreakAmount]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative mx-4 flex w-full max-w-sm flex-col items-center overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-500 dark:bg-zinc-900">
                <h2 className="mb-6 break-words text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                    Chuỗi học đã bị đứt
                </h2>

                <div
                    className={`relative flex items-center justify-center transition-all duration-1000 ease-out ${
                        isDimmed
                            ? 'scale-95 text-zinc-300 drop-shadow-none dark:text-zinc-600'
                            : 'scale-105 text-zinc-500 drop-shadow-[0_0_28px_rgba(113,113,122,0.45)]'
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
                </div>

                <p className="mb-8 mt-6 break-words text-sm leading-relaxed text-zinc-500 [overflow-wrap:anywhere] dark:text-zinc-400">
                    Bạn đã bỏ lỡ một ngày học nên chuỗi hiện tại trở về 0. Bắt đầu lại hôm nay để xây chuỗi mới.
                </p>

                <button
                    onClick={onDismiss}
                    className="w-full rounded-xl bg-[#2aa4e8] py-4 font-bold text-white shadow-sm transition hover:bg-[#1d8bcb] focus:outline-none focus:ring-4 focus:ring-[#2aa4e8]/20 active:scale-[0.98]"
                >
                    Tiếp tục học
                </button>
            </div>
        </div>
    );
}
