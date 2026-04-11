'use client';

import React from 'react';
import styles from '../admin.module.css';

// Generating some dummy data for the 31 days
const data = Array.from({ length: 11 }, (_, i) => ({
    day: i * 3 + 1,
    started: Math.floor(Math.random() * 60) + 20,
    completed: Math.floor(Math.random() * 60) + 30,
}));

export const ContentInteractionChart: React.FC = () => {
    const WIDTH = 1000;
    const HEIGHT = 300;
    const PADDING = { top: 40, right: 40, bottom: 40, left: 60 };
    
    const maxVal = 100;
    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;
    
    const xScale = (day: number) => PADDING.left + ((day - 1) / 30) * plotW;
    const yScale = (v: number) => PADDING.top + plotH - (v / maxVal) * plotH;
    
    const buildAreaPath = (key: 'started' | 'completed') => {
        let path = `M ${xScale(data[0].day)} ${yScale(data[0].started)}`; // Placeholder
        const pts = data.map(d => ({ x: xScale(d.day), y: yScale(d[key]) }));
        
        path = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const cp1x = (pts[i-1].x + pts[i].x) / 2;
            path += ` C ${cp1x} ${pts[i-1].y}, ${cp1x} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
        }
        
        const areaPath = `${path} L ${pts[pts.length-1].x} ${HEIGHT - PADDING.bottom} L ${pts[0].x} ${HEIGHT - PADDING.bottom} Z`;
        return { line: path, area: areaPath };
    };

    const startedPath = buildAreaPath('started');
    const completedPath = buildAreaPath('completed');

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <div>
                    <h3 className={styles.chartTitle}>Xu hướng Tương tác Nội dung</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>So sánh giữa việc bắt đầu bài học và hoàn thành bài tập</p>
                </div>
                <select className={styles.chartYearSelect}><option>Tháng 5</option></select>
            </div>
            
            <div style={{ position: 'relative', width: '100%' }}>
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
                    <defs>
                        <linearGradient id="startedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f87171" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#f87171" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>

                    {/* Y Grid */}
                    {[0, 20, 40, 60, 80, 100].map(v => (
                        <g key={v}>
                            <text x={PADDING.left - 15} y={yScale(v) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
                        </g>
                    ))}
                    
                    {/* Paths */}
                    <path d={completedPath.area} fill="url(#completedGradient)" />
                    <path d={startedPath.area} fill="url(#startedGradient)" style={{ mixBlendMode: 'multiply' }} />
                    
                    {/* X Axis labels */}
                    {[1, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 31].map(day => (
                        <text key={day} x={xScale(day)} y={HEIGHT - 10} textAnchor="middle" fontSize="10" fill="#94a3b8">{day}</text>
                    ))}
                </svg>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f87171' }}></div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Bài học đã bắt đầu</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#c084fc' }}></div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Bài tập đã hoàn thành</span>
                </div>
            </div>
        </div>
    );
};
