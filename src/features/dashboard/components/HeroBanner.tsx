'use client';

import React from 'react';

interface HeroBannerProps {
    userName: string;
}

const Sparkle = ({ size, style }: { size: number; style: React.CSSProperties }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ position: 'absolute', pointerEvents: 'none', ...style }}
    >
        <path
            d="M50 0 C50 0 53 40 100 50 C53 50 50 100 50 100 C50 100 47 60 0 50 C47 50 50 0 50 0Z"
            fill="rgba(255,255,255,0.90)"
        />
    </svg>
);

export const HeroBanner: React.FC<HeroBannerProps> = ({ userName }) => {
    return (
        <div className="relative mb-6 sm:mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3B8BF5] to-[#62C8FF] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
                <div
                    className="pointer-events-none absolute -right-16 top-[-90px] h-56 w-56 rounded-full bg-white/15 sm:-right-20 sm:h-72 sm:w-72"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -right-8 bottom-[-72px] h-40 w-40 rounded-full bg-white/10 sm:-right-14 sm:h-52 sm:w-52"
                    aria-hidden
                />

                <Sparkle size={36} style={{ top: 14, right: '28%', animation: 'twinkle 2.4s ease-in-out infinite' }} />
                <Sparkle size={24} style={{ bottom: 16, right: '24%', animation: 'twinkle 3.2s ease-in-out infinite 0.6s' }} />
                <Sparkle size={18} style={{ top: 48, right: '21%', animation: 'twinkle 1.8s ease-in-out infinite 0.2s' }} />

                <div className="relative z-[1] max-w-xl pr-0 lg:pr-44 xl:pr-52">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:mb-3 sm:text-[11px]">
                        KIẾN THỨC SỨC KHỎE
                    </p>
                    <h2 className="mb-5 text-lg font-extrabold leading-relaxed text-white sm:text-xl">
                        Xin chào, {userName}! Hãy nâng cao hiểu biết y tế với các khóa học trực tuyến của Medicology
                    </h2>
                    <button
                        className="inline-flex items-center gap-2 rounded-full border-none bg-white px-4 py-2.5 text-xs font-bold text-blue-600 shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-transform transition-shadow hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] sm:px-5 sm:text-sm"
                    >
                        Bắt đầu bài học hôm nay
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 sm:h-[22px] sm:w-[22px]">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </span>
                    </button>
                </div>

                <div
                    className="pointer-events-none absolute bottom-0 right-2 z-[2] h-28 w-28 bg-contain bg-bottom bg-no-repeat drop-shadow-[0_8px_20px_rgba(0,0,0,0.15)] sm:h-36 sm:w-36 md:h-44 md:w-44 lg:right-6 lg:h-52 lg:w-52 xl:h-60 xl:w-60"
                    style={{ backgroundImage: 'url(/images/Mascot/5.svg)' }}
                    aria-hidden
                />
            </div>
        </div>
    );
};
