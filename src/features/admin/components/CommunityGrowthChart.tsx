'use client';

import React from 'react';
import styles from '../admin.module.css';

const data = [
    { month: 'Tháng 1', new: 100, returning: 50 },
    { month: 'Tháng 2', new: 880, returning: 240 },
    { month: 'Tháng 3', new: 650, returning: 180 },
    { month: 'Tháng 4', new: 550, returning: 210 },
    { month: 'Tháng 5', new: 450, returning: 350 },
    { month: 'Tháng 6', new: 720, returning: 210 },
];

export const CommunityGrowthChart: React.FC = () => {
    const WIDTH = 1000;
    const HEIGHT = 400;
    const PADDING = { top: 60, right: 60, bottom: 60, left: 80 };
    
    const maxVal = 1000;
    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;
    
    const xScale = (i: number) => PADDING.left + (i / (data.length - 1)) * plotW;
    const yScale = (v: number) => PADDING.top + plotH - (v / maxVal) * plotH;
    
    const buildPath = (key: 'new' | 'returning') => {
        const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d[key]) }));
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const cp1x = (points[i-1].x + points[i].x) / 2;
            path += ` C ${cp1x} ${points[i-1].y}, ${cp1x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
        }
        return path;
    };

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <div>
                    <h3 className={styles.chartTitle}>Chỉ số Phát triển Cộng đồng Medicology</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>Biểu đồ phân tích mức độ tăng trưởng và khả năng giữ chân người dùng theo thời gian</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select className={styles.chartYearSelect}><option>Khoảng thời gian</option></select>
                    <select className={styles.chartYearSelect}><option>Chọn năm</option></select>
                </div>
            </div>
            
            <div style={{ position: 'relative', width: '100%' }}>
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
                    {/* Grid lines */}
                    {[0, 250, 500, 750, 1000].map(v => (
                        <g key={v}>
                            <line x1={PADDING.left} y1={yScale(v)} x2={WIDTH - PADDING.right} y2={yScale(v)} stroke="#f1f5f9" strokeWidth="1" />
                            <text x={PADDING.left - 15} y={yScale(v) + 4} textAnchor="end" fontSize="12" fill="#94a3b8">{v}</text>
                        </g>
                    ))}
                    
                    {/* New Users (Yellow) */}
                    <path d={buildPath('new')} fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((d, i) => (
                        <circle key={`new-${i}`} cx={xScale(i)} cy={yScale(d.new)} r="6" fill="#fbbf24" stroke="white" strokeWidth="2" />
                    ))}
                    
                    {/* Returning Users (Blue) */}
                    <path d={buildPath('returning')} fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((d, i) => (
                        <circle key={`ret-${i}`} cx={xScale(i)} cy={yScale(d.returning)} r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
                    ))}
                    
                    {/* X Axis Labels */}
                    {data.map((d, i) => (
                        <text key={i} x={xScale(i)} y={HEIGHT - 20} textAnchor="middle" fontSize="12" fill="#94a3b8">{d.month}</text>
                    ))}
                </svg>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#fbbf24' }}></div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Người dùng mới</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Người dùng quay trở lại</span>
                </div>
            </div>
        </div>
    );
};
