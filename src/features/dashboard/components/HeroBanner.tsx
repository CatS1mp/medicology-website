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
        <div className="relative mb-4 md:mb-14">
            <div
                className="relative flex min-h-[190px] items-center overflow-hidden rounded-2xl px-4 py-5 sm:min-h-[220px] sm:px-7 md:px-10"
                style={{ background: 'linear-gradient(90deg, #3B8BF5 0%, #62C8FF 100%)' }}
            >
                <div className="pointer-events-none absolute -top-20 right-[10%] h-64 w-64 rounded-full bg-white/15 sm:h-80 sm:w-80" />
                <div className="pointer-events-none absolute -bottom-16 right-[6%] h-40 w-40 rounded-full bg-white/10 sm:h-52 sm:w-52" />

                <Sparkle size={40} style={{ top: 14, right: '30%', animation: 'twinkle 2.4s ease-in-out infinite' }} />
                <Sparkle size={28} style={{ bottom: 20, right: '26%', animation: 'twinkle 3.2s ease-in-out infinite 0.6s' }} />
                <Sparkle size={18} style={{ top: 44, right: '23%', animation: 'twinkle 1.8s ease-in-out infinite 0.2s' }} />

                <div className="relative z-[1] max-w-[600px] pr-2 sm:max-w-[440px]">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 sm:mb-2.5 sm:text-[11px]">
                        KIẾN THỨC SỨC KHỎE
                    </p>
                    <h2 className="mb-4 text-lg font-extrabold leading-[1.35] text-white sm:mb-5 sm:text-[21px]">
                        Xin chào, {userName}! Hãy Nâng cao hiểu biết y tế với các khóa học trực tuyến của Medicology
                    </h2>
                    <button
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#2563EB', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'; }}
                    >
                        Bắt đầu bài học hôm nay
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                        </span>
                    </button>
                </div>
            </div>

            <div
                className="pointer-events-none absolute bottom-[-64px] right-[2%] hidden h-[250px] w-[250px] bg-contain bg-bottom bg-no-repeat drop-shadow-[0_8px_20px_rgba(0,0,0,0.15)] sm:block md:bottom-[-92px] md:h-[340px] md:w-[340px]"
                style={{ backgroundImage: 'url(/images/Mascot/5.svg)' }}
            />
        </div>
    );
};