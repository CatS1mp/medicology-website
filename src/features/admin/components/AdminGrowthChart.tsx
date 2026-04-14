'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { fetchAdminUsers } from '@/shared/api/admin-users';
import type { AdminUserApiRecord } from '@/shared/types/admin';

const MONTH_LABELS = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
];
const PAGE_SIZE = 200;
const MAX_PAGE_GUARD = 200;

function parseCreatedAtMonth(isoLike?: string | null): { year: number; month: number } | null {
    if (!isoLike) return null;
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth() };
}

async function fetchAllAdminUsers(): Promise<AdminUserApiRecord[]> {
    let page = 0;
    let total = Number.POSITIVE_INFINITY;
    const users: AdminUserApiRecord[] = [];

    while (users.length < total && page < MAX_PAGE_GUARD) {
        const { items, total: nextTotal } = await fetchAdminUsers({ page, size: PAGE_SIZE });
        total = nextTotal;
        if (items.length === 0) break;
        users.push(...items);
        page += 1;
    }

    return users;
}

function computeMonthlyByYear(users: AdminUserApiRecord[]): Record<number, number[]> {
    const byYear: Record<number, number[]> = {};
    for (const user of users) {
        const parsed = parseCreatedAtMonth(user.createdAt ?? user.joinedAt);
        if (!parsed) continue;
        if (!byYear[parsed.year]) {
            byYear[parsed.year] = Array(12).fill(0);
        }
        byYear[parsed.year][parsed.month] += 1;
    }
    return byYear;
}

function getNiceYAxisTicks(maxDataValue: number): number[] {
    const rawTop = Math.max(5, maxDataValue);
    const niceTop = Math.ceil(rawTop / 5) * 5;
    const step = Math.max(1, Math.ceil(niceTop / 5));
    return Array.from({ length: 6 }, (_, i) => i * step);
}

export const AdminGrowthChart: React.FC = () => {
    const [monthlyByYear, setMonthlyByYear] = useState<Record<number, number[]>>({});
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const users = await fetchAllAdminUsers();
                const grouped = computeMonthlyByYear(users);
                const currentYear = new Date().getFullYear();
                if (!grouped[currentYear]) {
                    grouped[currentYear] = Array(12).fill(0);
                }
                if (cancelled) return;
                setMonthlyByYear(grouped);
                const years = Object.keys(grouped)
                    .map(Number)
                    .filter((year) => !Number.isNaN(year))
                    .sort((a, b) => b - a);
                setSelectedYear((prev) => (years.includes(prev) ? prev : (years[0] ?? currentYear)));
            } catch (e) {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : 'Không tải được dữ liệu tăng trưởng người dùng.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const WIDTH = 1000;
    const HEIGHT = 300;
    const PADDING = { top: 40, right: 40, bottom: 40, left: 60 };

    const availableYears = useMemo(
        () =>
            Object.keys(monthlyByYear)
                .map(Number)
                .filter((year) => !Number.isNaN(year))
                .sort((a, b) => b - a),
        [monthlyByYear]
    );

    const monthlyData = monthlyByYear[selectedYear] ?? Array(12).fill(0);
    const yTicks = getNiceYAxisTicks(Math.max(...monthlyData, 0));
    const maxVal = yTicks[yTicks.length - 1] ?? 1;
    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;

    const xScale = (i: number) => PADDING.left + (i / (MONTH_LABELS.length - 1)) * plotW;
    const yScale = (v: number) => PADDING.top + plotH - (v / Math.max(maxVal, 1)) * plotH;

    const points = monthlyData.map((value, i) => ({ x: xScale(i), y: yScale(value) }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const cp1x = (points[i - 1].x + points[i].x) / 2;
        path += ` C ${cp1x} ${points[i - 1].y}, ${cp1x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }

    const areaPath = `${path} L ${points[points.length - 1].x} ${HEIGHT - PADDING.bottom} L ${points[0].x} ${HEIGHT - PADDING.bottom} Z`;
    const peakValue = Math.max(...monthlyData, 0);
    const peakIndex = monthlyData.findIndex((v) => v === peakValue);

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Thống kê tăng trưởng người dùng</h3>
                <select
                    className={styles.chartYearSelect}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    disabled={loading || availableYears.length === 0}
                >
                    {availableYears.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            {loading && <p style={{ margin: '0 0 10px', color: '#64748b' }}>Đang tải dữ liệu người dùng…</p>}
            {error && <p style={{ margin: '0 0 10px', color: '#b91c1c' }}>Không tải được dữ liệu: {error}</p>}

            <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {yTicks.map((v) => (
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

                    {peakValue > 0 && peakIndex >= 0 && (
                        <g transform={`translate(${points[peakIndex].x}, ${points[peakIndex].y - 15})`}>
                            <rect x="-62" y="-30" width="124" height="24" rx="4" fill="#3b82f6" />
                            <text y="-14" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">
                                {peakValue.toLocaleString('vi-VN')} người dùng
                            </text>
                            <path d="M -5 0 L 5 0 L 0 5 Z" fill="#3b82f6" transform="translate(0, -6)" />
                        </g>
                    )}

                    {/* X Axis Labels */}
                    {MONTH_LABELS.map((month, i) => (
                        <text
                            key={month}
                            x={xScale(i)}
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
