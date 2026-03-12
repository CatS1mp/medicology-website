'use client';

import React from 'react';
import type { LearningProgressItem } from '../types';

interface LearningProgressProps {
    items: LearningProgressItem[];
}

export const LearningProgress: React.FC<LearningProgressProps> = ({ items }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Tiến độ học tập</h3>

            <div className="flex flex-col gap-3">
                {items.map((item) => {
                    const pct = Math.round((item.completed / item.total) * 100);
                    return (
                        <div key={item.id} className="flex items-center gap-3">
                            {/* Icon */}
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                                style={{ backgroundColor: `${item.color}18` }}
                            >
                                {item.icon}
                            </div>

                            {/* Label + Bar */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-medium text-gray-800 truncate">{item.subject}</p>
                                    <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                                        {item.completed}/{item.total}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">{pct}% hoàn thành</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* View all link */}
            <div className="mt-3 text-center">
                <button className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                    Xem tất cả &rsaquo;
                </button>
            </div>
        </div>
    );
};
