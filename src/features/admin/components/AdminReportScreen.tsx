'use client';

import React from 'react';
import styles from '../admin.module.css';
import { CommunityGrowthChart } from './CommunityGrowthChart';
import { ContentInteractionChart } from './ContentInteractionChart';
import { BaseAdminLayout } from './BaseAdminLayout';

const topStats = [
    { label: 'Tổng lượt đăng ký', value: '1,480', subValue: '+18% trong tháng này', icon: '📊' },
    { label: 'Tỷ lệ hoàn thành', value: '65%', subValue: '+3% so với tháng trước', icon: '✔️' },
    { label: 'Thời gian học trung bình', value: '12 min', subValue: '-2 phút (có cải thiện)', icon: '⏱️' },
    { label: 'Mức độ hài lòng của học viên', value: '4.5/5', subValue: '+0.2 so với tháng trước', icon: '⭐' },
];

const coursePerformance = [
    { name: 'Sơ cứu & Cấp cứu', percent: 60, current: 234, target: 158, total: 392 },
    { name: 'Sức khỏe Tâm thần', percent: 57, current: 189, target: 145, total: 334 },
    { name: 'Kỹ năng Sơ cứu cơ bản', percent: 62, current: 145, target: 89, total: 234 },
    { name: 'Dinh dưỡng & Chế độ ăn', percent: 56, current: 96, target: 78, total: 174 },
];

const weeklyStats = [
    { week: 'Tuần 1', activeUsers: 1370, started: 2840, completed: 1420, avgScore: '72%' },
    { week: 'Tuần 2', activeUsers: 1350, started: 3120, completed: 1560, avgScore: '74%' },
    { week: 'Tuần 3', activeUsers: 1420, started: 3345, completed: 1680, avgScore: '75%' },
    { week: 'Tuần 4', activeUsers: 1580, started: 3890, completed: 1950, avgScore: '76%' },
];

export const AdminReportScreen: React.FC = () => {
    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Báo cáo tổng quan hệ thống</h1>
                    <p>Tổng quan chi tiết về các chỉ số nền tảng và mức độ tương tác của người dùng</p>
                </div>
                <div className={styles.reportActions}>
                    <button className={styles.btnSecondary}>📅 Khoảng thời gian</button>
                    <button className={styles.btnPrimary}>📤 Xuất báo cáo</button>
                </div>
            </section>
            
            <section className={styles.statsGrid}>
                {topStats.map((stat, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <span className={styles.statLabel}>{stat.label}</span>
                            <span style={{ fontSize: 18 }}>{stat.icon}</span>
                        </div>
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={`${styles.statChange} ${styles.changeBlue}`}>
                            {stat.subValue}
                        </div>
                    </div>
                ))}
            </section>
            
            <CommunityGrowthChart />
            
            <ContentInteractionChart />
            
            <section className={styles.chartContainer}>
                <h3 className={styles.chartTitle} style={{ marginBottom: 24 }}>Hiệu suất Khóa học</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {coursePerformance.map((course, i) => (
                        <div key={i} className={styles.progressItem}>
                            <div className={styles.progressLabelGroup}>
                                <span className={styles.progressName}>{course.name}</span>
                                <span className={styles.progressPercent}>{course.percent}%</span>
                            </div>
                            <div className={styles.progressBarContainer}>
                                <div className={styles.progressBarFill} style={{ width: `${course.percent}%` }}></div>
                            </div>
                            <div className={styles.progressStats}>
                                <span>✔️ {course.current}</span>
                                <span>→ {course.target}</span>
                                <span>Tổng cộng: {course.total}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            <div className={styles.bottomGrid}>
                <div className={styles.chartContainer} style={{ gridColumn: 'span 2' }}>
                    <h3 className={styles.chartTitle}>Tỷ lệ Hoàn thành bài học trên toàn hệ thống</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>Phân loại học viên theo các giai đoạn: Đã hoàn thành, Đang học và Chưa bắt đầu</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <div style={{ position: 'relative', width: 180, height: 180 }}>
                            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.65)} />
                            </svg>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}>65%</span>
                            </div>
                        </div>
                        
                        <div className={styles.highlightList}>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ backgroundColor: '#22c55e' }}></div>
                                <span>Đã hoàn thành: 65%</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ backgroundColor: '#eab308' }}></div>
                                <span>Đang học: 25%</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ backgroundColor: '#ef4444' }}></div>
                                <span>Chưa bắt đầu: 10%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className={styles.chartContainer}>
                    <h3 className={styles.chartTitle}>Thông số nổi bật</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>Tóm tắt các chỉ số quan trọng</p>
                    
                    <div className={styles.highlightList}>
                        <div className={styles.highlightItem}>
                            <div className={styles.highlightLabel}>Thời gian học trung bình mỗi lần đăng nhập</div>
                            <div className={styles.highlightValue}>24 phút</div>
                            <div className={styles.highlightSubtitle}>+3% so với tuần trước</div>
                        </div>
                        <div className={styles.highlightItem} style={{ borderLeftColor: '#22c55e' }}>
                            <div className={styles.highlightLabel}>Người dùng hoạt động hàng ngày</div>
                            <div className={styles.highlightValue} style={{ color: '#22c55e' }}>842</div>
                            <div className={styles.highlightSubtitle}>65% tổng số người dùng</div>
                        </div>
                        <div className={styles.highlightItem} style={{ borderLeftColor: '#f97316' }}>
                            <div className={styles.highlightLabel}>Lượt làm bài tập</div>
                            <div className={styles.highlightValue} style={{ color: '#f97316' }}>4,284</div>
                            <div className={styles.highlightSubtitle}>+12% so với tuần trước</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <section className={styles.chartContainer}>
                <h3 className={styles.chartTitle}>Chỉ số Hiệu suất Hàng tuần</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>Bảng phân tích chi tiết các hoạt động theo tuần</p>
                
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Tuần</th>
                                <th>Người dùng hoạt động</th>
                                <th>Bài học đã bắt đầu</th>
                                <th>Bài tập đã hoàn thành</th>
                                <th>Điểm trung bình</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeklyStats.map((row, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 700 }}>{row.week}</td>
                                    <td>{row.activeUsers.toLocaleString()}</td>
                                    <td>{row.started.toLocaleString()}</td>
                                    <td>{row.completed.toLocaleString()}</td>
                                    <td style={{ color: '#3b82f6', fontWeight: 700 }}>{row.avgScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </BaseAdminLayout>
    );
};
