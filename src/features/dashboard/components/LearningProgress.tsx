'use client';

import React from 'react';
import type { LearningProgressItem } from '../types';

interface LearningProgressProps {
    items: LearningProgressItem[];
}

function normalizeColor(color: string | undefined) {
    if (!color) return '#3B82F6';

    const trimmed = color.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
        return trimmed;
    }

    if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
        return `#${trimmed}`;
    }

    return '#3B82F6';
}

export const LearningProgress: React.FC<LearningProgressProps> = ({ items }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Tiến độ học tập</h3>

            <div className="flex flex-col gap-3">
                {items.map((item) => {
                    const pct = Math.max(0, Math.min(100, Math.round(item.completionPercent)));
                    const accentColor = normalizeColor(item.color);
                    return (
                        <div key={item.id} className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                                style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                            >
                                {item.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-medium text-gray-800 truncate">{item.subject}</p>
                                    <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                                        {pct}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                                        style={{
                                            width: pct === 0 ? '0%' : `${pct}%`,
                                            minWidth: pct > 0 ? '10px' : undefined,
                                            background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">{pct}% hoàn thành</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 text-center">
                <button className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                    Xem tất cả &rsaquo;
                </button>
            </div>
        </div>
    );
};