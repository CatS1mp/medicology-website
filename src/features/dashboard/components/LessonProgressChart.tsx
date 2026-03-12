'use client';

import React, { useState, useRef } from 'react';
import type { ChartDataPoint } from '../types';

interface LessonProgressChartProps {
    data: ChartDataPoint[];
    totalLessons: number;
    weeklyDelta: number;
}

type TabType = 'monthly' | 'weekly' | 'daily';

export const LessonProgressChart: React.FC<LessonProgressChartProps> = ({
    data,
    totalLessons,
    weeklyDelta,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('weekly');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const WIDTH = 560;
    // Extra top space so the tooltip never gets clipped
    const TOOLTIP_SPACE = 52;
    const HEIGHT = 120 + TOOLTIP_SPACE;
    const PADDING = { top: TOOLTIP_SPACE + 4, right: 20, bottom: 30, left: 30 };

    const maxVal = Math.max(...data.map((d) => d.value), 10);
    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;

    const xScale = (i: number) => PADDING.left + (i / (data.length - 1)) * plotW;
    const yScale = (v: number) => PADDING.top + plotH - (v / maxVal) * plotH;

    const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.value) }));

    const buildSmoothPath = (pts: { x: number; y: number }[]) => {
        if (pts.length < 2) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const cp1x = (pts[i - 1].x + pts[i].x) / 2;
            const cp1y = pts[i - 1].y;
            const cp2x = (pts[i - 1].x + pts[i].x) / 2;
            const cp2y = pts[i].y;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i].x} ${pts[i].y}`;
        }
        return d;
    };

    const linePath = buildSmoothPath(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${HEIGHT - PADDING.bottom} L ${points[0].x} ${HEIGHT - PADDING.bottom} Z`;

    const tabs: { key: TabType; label: string }[] = [
        { key: 'monthly', label: 'Hằng tháng' },
        { key: 'weekly', label: 'Hằng tuần' },
        { key: 'daily', label: 'Hằng ngày' },
    ];

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scaleX = WIDTH / rect.width;
        const svgX = (e.clientX - rect.left) * scaleX;
        let nearest = 0;
        let minDist = Infinity;
        points.forEach((pt, i) => {
            const dist = Math.abs(pt.x - svgX);
            if (dist < minDist) { minDist = dist; nearest = i; }
        });
        setHoveredIndex(nearest);
    };

    const handleMouseLeave = () => setHoveredIndex(null);

    const hovered = hoveredIndex !== null ? data[hoveredIndex] : null;
    const hoveredPt = hoveredIndex !== null ? points[hoveredIndex] : null;

    const tooltipW = 80;
    const tooltipH = 38;
    const tooltipX = hoveredPt
        ? Math.min(Math.max(hoveredPt.x - tooltipW / 2, PADDING.left), WIDTH - PADDING.right - tooltipW)
        : 0;
    // Always pin tooltip to top of the extra reserved space
    const tooltipY = TOOLTIP_SPACE / 2 - tooltipH / 2;
    const arrowX = hoveredPt ? hoveredPt.x : 0;
    const arrowY = tooltipY + tooltipH;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" style={{ overflow: 'visible' }}>
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-extrabold text-gray-900">{totalLessons} Bài học</span>
                        <span className="flex items-center gap-1 text-blue-500 text-sm font-semibold">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 14l5-5 5 5H7z" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">+{weeklyDelta} bài trong tuần này</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative" style={{ cursor: 'crosshair' }}>
                <svg
                    ref={svgRef}
                    width="100%"
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    preserveAspectRatio="none"
                    style={{ display: 'block', overflow: 'visible' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#29B6F6" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#29B6F6" stopOpacity="0.65" />
                        </linearGradient>
                    </defs>

                    {[0, 2, 4, 6, 8, 10].map((v) => (
                        <g key={v}>
                            <line x1={PADDING.left} y1={yScale(v)} x2={WIDTH - PADDING.right} y2={yScale(v)} stroke="#F3F4F6" strokeWidth="1" />
                            <text x={PADDING.left - 4} y={yScale(v) + 4} textAnchor="end" fontSize="9" fill="#9CA3AF">{v}</text>
                        </g>
                    ))}

                    <path d={areaPath} fill="url(#areaGradient)" />
                    <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {hoveredIndex !== null && hoveredPt && (
                        <line x1={hoveredPt.x} y1={PADDING.top} x2={hoveredPt.x} y2={HEIGHT - PADDING.bottom} stroke="white" strokeWidth="1.5" strokeDasharray="4 2" />
                    )}

                    {points.map((pt, i) =>
                        hoveredIndex === i ? (
                            <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#0EA5E9" stroke="white" strokeWidth="2" style={{ pointerEvents: 'none' }} />
                        ) : null
                    )}

                    {data.map((d, i) => (
                        <text key={i} x={xScale(i)} y={HEIGHT - 4} textAnchor="middle" fontSize="9"
                            fill={hoveredIndex === i ? '#0EA5E9' : '#9CA3AF'}
                            fontWeight={hoveredIndex === i ? '600' : '400'}
                            style={{ pointerEvents: 'none' }}>
                            {d.day}
                        </text>
                    ))}

                    {/* SVG Tooltip — always in the reserved top zone */}
                    {hoveredIndex !== null && hoveredPt && hovered && (
                        <g style={{ pointerEvents: 'none' }}>
                            <rect x={tooltipX + 2} y={tooltipY + 2} width={tooltipW} height={tooltipH} rx="7" fill="rgba(0,0,0,0.10)" />
                            <rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} rx="7" fill="#1E3A5F" />
                            <polygon points={`${arrowX - 5},${arrowY} ${arrowX + 5},${arrowY} ${arrowX},${arrowY + 6}`} fill="#1E3A5F" />
                            <text x={tooltipX + tooltipW / 2} y={tooltipY + 15} textAnchor="middle" fontSize="11" fill="white" fontWeight="700">
                                {hovered.value} bài học
                            </text>
                            <text x={tooltipX + tooltipW / 2} y={tooltipY + 29} textAnchor="middle" fontSize="8" fill="#93C5FD">
                                {hovered.date}
                            </text>
                        </g>
                    )}

                    <rect x={PADDING.left} y={PADDING.top} width={plotW} height={plotH} fill="transparent" style={{ cursor: 'crosshair' }} />
                </svg>
            </div>
        </div>
    );
};
