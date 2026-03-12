'use client';

import React from 'react';
import type { StatCard } from '../types';

interface StatsCardsProps {
    cards: StatCard[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ cards }) => {
    return (
        <div className="grid grid-cols-3 gap-4">
            {cards.map((card) => (
                <div
                    key={card.id}
                    className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                        <p className="text-xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
