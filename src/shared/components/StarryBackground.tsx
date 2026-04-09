"use client";

import React, { useEffect, useRef } from 'react';

interface StarryBackgroundProps {
    className?: string;
    starCount?: number;
}

export const StarryBackground: React.FC<StarryBackgroundProps> = ({
    className = '',
    starCount = 150
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: { x: number; y: number; radius: number; vx: number; vy: number; alpha: number; dAlpha: number }[] = [];

        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        const initStars = () => {
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5 + 0.5,
                    vx: (Math.random() - 0.5) * 0.1,
                    vy: (Math.random() - 0.5) * 0.1,
                    alpha: Math.random(),
                    dAlpha: (Math.random() * 0.02) - 0.01
                });
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fill();

                star.x += star.vx;
                star.y += star.vy;

                star.alpha += star.dAlpha;
                if (star.alpha <= 0.1 || star.alpha >= 1) {
                    star.dAlpha = -star.dAlpha;
                }

                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;
            });

            animationFrameId = requestAnimationFrame(render);
        };

        resize();
        initStars();
        render();

        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resize();
                initStars();
            }, 200);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [starCount]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 pointer-events-none block ${className}`}
            style={{ display: 'block' }} 
        />
    );
};