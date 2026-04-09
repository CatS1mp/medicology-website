'use client';

import React, { useState, useRef } from 'react';
import type { LessonActivityDataset, LessonActivityRange } from '../types';

interface LessonProgressChartProps {
    datasets: LessonActivityDataset[];
    totalLessons: number;
    activeRange: LessonActivityRange;
    onRangeChange: (range: LessonActivityRange) => void;
    isLoading?: boolean;
}

export const LessonProgressChart: React.FC<LessonProgressChartProps> = ({
    datasets,
    totalLessons,
    activeRange,
    onRangeChange,
    isLoading = false,
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const activeDataset = datasets.find((dataset) => dataset.label === activeRange) ?? datasets[0];
    const data = activeDataset?.data ?? [];
    const rangeDelta = activeDataset?.totalCompletedLessons ?? data.reduce((sum, point) => sum + point.value, 0);

    const WIDTH = 560;
    const TOOLTIP_SPACE = 52;
    const HEIGHT = 120 + TOOLTIP_SPACE;
    const PADDING = { top: TOOLTIP_SPACE + 4, right: 20, bottom: 30, left: 30 };

    const maxVal = Math.max(...data.map((d) => d.value), 10);
    const pointCount = data.length;
    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;
    const hasData = pointCount > 0;
    const hasMultiplePoints = pointCount > 1;

    const xScale = (i: number) => {
        if (!hasData) return PADDING.left;
        if (!hasMultiplePoints) return PADDING.left + plotW / 2;
        return PADDING.left + ((i + 0.5) / pointCount) * plotW;
    };
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
    const areaPath = hasMultiplePoints
        ? `${linePath} L ${points[points.length - 1].x} ${HEIGHT - PADDING.bottom} L ${points[0].x} ${HEIGHT - PADDING.bottom} Z`
        : '';

    const tabs: { key: LessonActivityRange; label: string }[] = [
        { key: 'last7', label: '7 ngày gần đây' },
        { key: 'last14', label: '14 ngày gần đây' },
    ];

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        if (!hasData || rect.width <= 0) return;
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
    const handleTabChange = (tab: LessonActivityRange) => {
        if (tab === activeRange || isLoading) return;
        onRangeChange(tab);
        setHoveredIndex(null);
    };

    const hovered = hoveredIndex !== null ? data[hoveredIndex] : null;
    const hoveredPt = hoveredIndex !== null ? points[hoveredIndex] : null;

    const tooltipW = 80;
    const tooltipH = 38;
    const tooltipEdgePadding = 8;
    const tooltipX = hoveredPt
        ? Math.min(
            Math.max(hoveredPt.x - tooltipW / 2, PADDING.left + tooltipEdgePadding),
            WIDTH - PADDING.right - tooltipW - tooltipEdgePadding
        )
        : 0;
    const tooltipY = TOOLTIP_SPACE / 2 - tooltipH / 2;
    const arrowX = hoveredPt
        ? Math.min(Math.max(hoveredPt.x, tooltipX + 10), tooltipX + tooltipW - 10)
        : 0;
    const arrowY = tooltipY + tooltipH;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" style={{ overflow: 'visible' }}>
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
                    <p className="text-xs text-gray-400 mt-0.5">+{rangeDelta} bài trong {activeRange === 'last7' ? '7' : '14'} ngày gần đây</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeRange === tab.key ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'} ${isLoading ? 'opacity-80' : ''}`}
                        >
                            {isLoading && activeRange !== tab.key ? 'Đang tải...' : tab.label}
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

                    {hasMultiplePoints && <path d={areaPath} fill="url(#areaGradient)" />}
                    {hasMultiplePoints && <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                    {!hasMultiplePoints && points[0] && (
                        <circle cx={points[0].x} cy={points[0].y} r="4" fill="#0EA5E9" stroke="white" strokeWidth="2" />
                    )}

                    {hoveredIndex !== null && hoveredPt && (
                        <line x1={hoveredPt.x} y1={PADDING.top} x2={hoveredPt.x} y2={HEIGHT - PADDING.bottom} stroke="white" strokeWidth="1.5" strokeDasharray="4 2" />
                    )}

                    {points.map((pt, i) =>
                        hoveredIndex === i ? (
                            <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#0EA5E9" stroke="white" strokeWidth="2" style={{ pointerEvents: 'none' }} />
                        ) : null
                    )}

                    {data.map((d, i) => {
                        const isFirst = i === 0;
                        const isLast = i === pointCount - 1;
                        const labelX = isFirst ? xScale(i) + 2 : isLast ? xScale(i) - 2 : xScale(i);
                        const textAnchor = isFirst ? 'start' : isLast ? 'end' : 'middle';

                        return (
                        <text key={i} x={labelX} y={HEIGHT - 4} textAnchor={textAnchor} fontSize="9"
                            fill={hoveredIndex === i ? '#0EA5E9' : '#9CA3AF'}
                            fontWeight={hoveredIndex === i ? '600' : '400'}
                            style={{ pointerEvents: 'none' }}>
                            {d.day}
                        </text>
                        );
                    })}

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