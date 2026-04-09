'use client';

import React, { useState } from 'react';
import type { LearningResultPoint } from '../types';

interface LearningResultsChartProps {
    data: LearningResultPoint[];
    currentScore: number;
}

export const LearningResultsChart: React.FC<LearningResultsChartProps> = ({ data, currentScore }) => {
    const [showComparison, setShowComparison] = useState(true);

    const WIDTH = 260;
    const HEIGHT = 130;
    const PADDING = { top: 10, right: 10, bottom: 24, left: 22 };
    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;

    const maxVal = 10;
    const barGroupW = plotW / data.length;
    const barW = showComparison ? barGroupW * 0.3 : barGroupW * 0.5;
    const gap = 2;

    const yScale = (v: number) => PADDING.top + plotH - (v / maxVal) * plotH;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-gray-900">Kết quả học tập</h3>
            </div>

            <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-gray-500">Thực tế</span>
                </div>
                {showComparison && (
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                        <span className="text-[10px] text-gray-500">Mục tiêu</span>
                    </div>
                )}
                <div className="ml-auto text-right">
                    <p className="text-[10px] text-gray-400">Điểm đạt được</p>
                    <p className="text-sm font-bold text-gray-800">{currentScore}</p>
                </div>
            </div>

            <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ display: 'block' }}>
                {[0, 5, 10].map((v) => (
                    <g key={v}>
                        <line x1={PADDING.left} y1={yScale(v)} x2={WIDTH - PADDING.right} y2={yScale(v)} stroke="#F3F4F6" strokeWidth="1" />
                        <text x={PADDING.left - 3} y={yScale(v) + 3} textAnchor="end" fontSize="7" fill="#D1D5DB">{v}</text>
                    </g>
                ))}

                {data.map((d, i) => {
                    const groupX = PADDING.left + i * barGroupW + barGroupW * 0.1;
                    const actualH = (d.actual / maxVal) * plotH;
                    const targetH = (d.target / maxVal) * plotH;

                    return (
                        <g key={i}>
                            <rect
                                x={groupX}
                                y={yScale(d.actual)}
                                width={barW}
                                height={actualH}
                                rx="3"
                                fill="#60A5FA"
                            />
                            {showComparison && (
                                <rect
                                    x={groupX + barW + gap}
                                    y={yScale(d.target)}
                                    width={barW}
                                    height={targetH}
                                    rx="3"
                                    fill="#D1D5DB"
                                />
                            )}
                            <text
                                x={groupX + barW / 2 + (showComparison ? (barW + gap) / 2 : 0)}
                                y={HEIGHT - 8}
                                textAnchor="middle"
                                fontSize="8"
                                fill="#9CA3AF"
                            >
                                {d.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <div className="flex items-center gap-3 mt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-600">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            defaultChecked
                        />
                        <div className="w-7 h-3.5 bg-blue-500 rounded-full flex items-center px-0.5">
                            <div className="w-2.5 h-2.5 bg-white rounded-full translate-x-3.5 transition-transform" />
                        </div>
                    </div>
                    Hiện số điểm
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-600">
                    <div
                        className={`w-7 h-3.5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${showComparison ? 'bg-blue-500' : 'bg-gray-300'}`}
                        onClick={() => setShowComparison(!showComparison)}
                    >
                        <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${showComparison ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </div>
                    So sánh
                </label>
            </div>
        </div>
    );
};