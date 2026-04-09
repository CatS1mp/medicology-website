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
        <div style={{ position: 'relative', marginBottom: '120px' }}>
            <div
                style={{
                    position: 'relative',
                    height: '220px',
                    borderRadius: '16px',
                    background: 'linear-gradient(90deg, #3B8BF5 0%, #62C8FF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 44px',
                    overflow: 'hidden',
                }}
            >
                <div style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', width: 320, height: 320, top: -100, right: 310, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', width: 200, height: 200, bottom: -70, right: 280, pointerEvents: 'none' }} />

                <Sparkle size={56} style={{ top: 16, right: 420, animation: 'twinkle 2.4s ease-in-out infinite' }} />
                <Sparkle size={34} style={{ bottom: 18, right: 390, animation: 'twinkle 3.2s ease-in-out infinite 0.6s' }} />
                <Sparkle size={22} style={{ top: 42, right: 370, animation: 'twinkle 1.8s ease-in-out infinite 0.2s' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
                    <p style={{ color: 'rgba(219,234,254,0.95)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
                        KIẾN THỨC SỨC KHỎE
                    </p>
                    <h2 style={{ color: 'white', fontSize: 21, fontWeight: 800, lineHeight: 1.4, marginBottom: 22 }}>
                        Xin chào, {userName}! Hãy Nâng cao hiểu biết y tế với các khóa học trực tuyến của Medicology
                    </h2>
                    <button
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#2563EB', fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 999, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'transform 0.2s, box-shadow 0.2s' }}
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
                style={{
                    position: 'absolute',
                    right: 380,
                    bottom: '-110px',
                    width: '420px',
                    height: '420px',
                    backgroundImage: 'url(/images/Mascot/5.svg)',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'bottom center',
                    zIndex: 10,
                    filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
};