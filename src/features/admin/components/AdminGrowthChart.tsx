'use client';

import React from 'react';
import styles from '../admin.module.css';

const data = [
    98, 118, 136, 142,
    154, 168, 238, 204,
    196, 254, 212, 156,
    214, 182, 258, 210,
    430, 176, 220, 262,
    244, 228, 206, 272,
    216, 232, 286, 302,
    122, 158, 162, 141,
    238, 244, 232, 222,
    360, 292, 330, 298,
    266, 262, 258, 286,
    214, 282, 252, 286,
    256, 282,
];

const monthLabels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export const AdminGrowthChart: React.FC = () => {
    const WIDTH = 1000;
    const HEIGHT = 300;
    const PADDING = { top: 40, right: 40, bottom: 40, left: 60 };
    
    const maxVal = 500;
    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;
    
    const xScale = (i: number) => PADDING.left + (i / (data.length - 1)) * plotW;
    const yScale = (v: number) => PADDING.top + plotH - (v / maxVal) * plotH;
    
    const points = data.map((value, i) => ({ x: xScale(i), y: yScale(value) }));
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const cp1x = (points[i-1].x + points[i].x) / 2;
        path += ` C ${cp1x} ${points[i-1].y}, ${cp1x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }
    
    const areaPath = `${path} L ${points[points.length-1].x} ${HEIGHT - PADDING.bottom} L ${points[0].x} ${HEIGHT - PADDING.bottom} Z`;

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Thống kê tăng trưởng người dùng</h3>
                <select className={styles.chartYearSelect}>
                    <option>2026</option>
                    <option>2025</option>
                </select>
            </div>
            
            <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 100, 200, 300, 400, 500].map(v => (
                        <g key={v}>
                            <line x1={PADDING.left} y1={yScale(v)} x2={WIDTH - PADDING.right} y2={yScale(v)} stroke="#f1f5f9" strokeWidth="1" />
                            <text x={PADDING.left - 10} y={yScale(v) + 4} textAnchor="end" fontSize="12" fill="#94a3b8">{v}</text>
                        </g>
                    ))}
                    
                    {/* Area & Line */}
                    <path d={areaPath} fill="url(#chartGradient)" />
                    <path d={path} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Points */}
                    {points.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                    ))}
                    
                    {/* Special Tooltip Point for April (as in image) */}
                    <g transform={`translate(${points[16].x}, ${points[16].y - 15})`}>
                        <rect x="-56" y="-30" width="112" height="24" rx="4" fill="#3b82f6" />
                        <text y="-14" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">1.250 người dùng</text>
                        <path d="M -5 0 L 5 0 L 0 5 Z" fill="#3b82f6" transform="translate(0, -6)" />
                    </g>

                    {/* X Axis Labels */}
                    {monthLabels.map((month, i) => (
                        <text
                            key={month}
                            x={xScale(i * 4)}
                            y={HEIGHT - 10}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#94a3b8"
                        >
                            {month}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
};
