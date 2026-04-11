'use client';

import React from 'react';
import styles from '../admin.module.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

const miniStats = [
    { label: 'Tổng số người dùng', value: '2,543', change: '+12% so với tháng trước', icon: '👤', type: 'blue' as const },
    { label: 'Bài kiểm tra đang hoạt động', value: '24', change: '+2 so với tháng trước', icon: '📄', type: 'green' as const },
    { label: 'Tổng số lượt làm bài', value: '1,248', change: '+45 so với tháng trước', icon: '📋', type: 'orange' as const },
    { label: 'Tỷ lệ vượt qua trung bình', value: '73%', change: '+5% so với tháng trước', icon: '📈', type: 'purple' as const },
];

const testData = [
    { stt: 1, name: 'Kiểm tra Kỹ thuật Sơ cứu cơ bản', course: 'Kỹ thuật sơ cứu cơ bản', passing: '70%', duration: '15 phút', attempts: '3 lần', status: 'Active' },
    { stt: 2, name: 'Quiz Tổng hợp Dinh dưỡng trẻ em', course: 'Dinh dưỡng cho trẻ nhỏ', passing: '75%', duration: '20 phút', attempts: '3 lần', status: 'Hidden' },
    { stt: 3, name: 'Quiz Tổng hợp Khoáng chất', course: 'Khoáng chất trong thực vật', passing: '70%', duration: '10 phút', attempts: '3 lần', status: 'Active' },
    { stt: 4, name: 'Quiz Tổng hợp .....', course: 'Dưỡng chất trong động vật', passing: '70%', duration: '10 phút', attempts: '3 lần', status: 'Active' },
    { stt: 5, name: 'Quiz Tổng hợp .....', course: 'Khoáng chất trong thực vật', passing: '70%', duration: '15 phút', attempts: '3 lần', status: 'Active' },
    { stt: 6, name: 'Quiz Tổng hợp .....', course: 'Kỹ thuật sơ cứu nâng cao', passing: '70%', duration: '19 phút', attempts: '3 lần', status: 'Hidden' },
    { stt: 7, name: 'Quiz Tổng hợp .....', course: 'Kỹ thuật sơ cứu nâng cao', passing: '70%', duration: '13 phút', attempts: '3 lần', status: 'Active' },
    { stt: 8, name: 'Quiz Tổng hợp .....', course: 'Kỹ thuật sơ cứu nâng cao', passing: '70%', duration: '14 phút', attempts: '3 lần', status: 'Hidden' },
    { stt: 9, name: 'Quiz Tổng hợp .....', course: 'Kỹ thuật sơ cứu nâng cao', passing: '70%', duration: '15 phút', attempts: '3 lần', status: 'Active' },
    { stt: 10, name: 'Quiz Tổng hợp .....', course: 'Kỹ thuật sơ cứu nâng cao', passing: '70%', duration: '16 phút', attempts: '3 lần', status: 'Active' },
    { stt: 11, name: 'Quiz Tổng hợp .....', course: 'Nhận biết trầm cảm', passing: '70%', duration: '20 phút', attempts: '3 lần', status: 'Active' },
    { stt: 12, name: 'Quiz Tổng hợp .....', course: 'Nhận biết trầm cảm', passing: '70%', duration: '20 phút', attempts: '3 lần', status: 'Hidden' },
    { stt: 13, name: 'Quiz Tổng hợp .....', course: 'Nhận biết trầm cảm', passing: '70%', duration: '9 phút', attempts: '3 lần', status: 'Active' },
    { stt: 14, name: 'Quiz Tổng hợp .....', course: 'Nhận biết trầm cảm', passing: '70%', duration: '20 phút', attempts: '3 lần', status: 'Hidden' },
    { stt: 15, name: 'Quiz Tổng hợp .....', course: 'Chăm sóc sau đột quỵ', passing: '70%', duration: '7 phút', attempts: '3 lần', status: 'Hidden' },
    { stt: 16, name: 'Quiz Tổng hợp .....', course: 'Chăm sóc sau đột quỵ', passing: '70%', duration: '20 phút', attempts: '3 lần', status: 'Active' },
    { stt: 17, name: 'Quiz Tổng hợp .....', course: 'Chăm sóc sau đột quỵ', passing: '70%', duration: '20 phút', attempts: '3 lần', status: 'Active' },
    { stt: 18, name: 'Quiz Tổng hợp .....', course: 'Chăm sóc sau đột quỵ', passing: '70%', duration: '7 phút', attempts: '3 lần', status: 'Active' },
    { stt: 19, name: 'Quiz Tổng hợp .....', course: 'Chăm sóc sau đột quỵ', passing: '70%', duration: '20 phút', attempts: '3 lần', status: 'Hidden' },
    { stt: 20, name: 'Quiz Tổng hợp .....', course: 'Chăm sóc sau đột quỵ', passing: '70%', duration: '7 phút', attempts: '3 lần', status: 'Hidden' },
];

import { BaseAdminLayout } from './BaseAdminLayout';

export const AdminTestsScreen: React.FC = () => {
    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Quản lý Bài kiểm tra & Đánh giá</h1>
                    <p>Thiết lập ngân hàng câu hỏi Quiz và quản lý các tiêu chuẩn đánh giá năng lực học viên trên toàn hệ thống</p>
                </div>
            </section>
            
            <section className={styles.filterSection}>
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Sắp xếp theo:</span>
                    <select className={styles.chartYearSelect} style={{ width: 160 }}>
                        <option>Mới cập nhật</option>
                    </select>
                </div>
                
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Cấp độ</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Mọi cấp độ</button>
                        <button className={styles.chip}>Cơ bản</button>
                        <button className={styles.chip}>Trung cấp</button>
                        <button className={styles.chip}>Nâng cao</button>
                    </div>
                </div>
            </section>
            
            <div className={styles.tabGroup}>
                <div className={`${styles.tabBtn} ${styles.tabBtnActive}`}>Bài kiểm tra khoá học</div>
                <div className={`${styles.tabBtn} ${styles.tabBtnInactive}`}>Bài kiểm tra đầu vào</div>
            </div>

            <div className={styles.statsGrid} style={{ marginBottom: 24 }}>
                {miniStats.map((stat, i) => (
                    <div key={i} className={styles.statCard} style={{ padding: 16 }}>
                        <div className={styles.statHeader} style={{ marginBottom: 8 }}>
                            <span className={styles.statLabel}>{stat.label}</span>
                            <div className={`${styles.statIcon} ${
                                stat.type === 'blue' ? styles.iconBlue : 
                                stat.type === 'green' ? styles.iconGreen : 
                                stat.type === 'orange' ? styles.iconOrange : 
                                styles.iconPurple
                            }`} style={{ width: 28, height: 28, fontSize: 14 }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className={styles.statValue} style={{ fontSize: 20 }}>{stat.value}</div>
                        <div className={`${styles.statChange} ${styles.changeBlue}`} style={{ fontSize: 10 }}>
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className={styles.chartContainer} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 24 }}>
                    <h3 className={styles.chartTitle}>Danh sách Bài kiểm tra khoá học</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Quản lý các bài đánh giá năng lực cuối mỗi khoá học chuyên đề</p>
                    
                    <div className={styles.actionsBar}>
                        <div className={styles.searchContainer} style={{ maxWidth: 400 }}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} />
                        </div>
                        <div className={styles.actionsGroup}>
                            <button className={styles.btnSecondary}>📥 Nhập Excel</button>
                            <button className={styles.btnSecondary}>📤 Xuất Excel</button>
                            <button className={styles.btnPrimary} style={{ borderRadius: 8 }}>+ Thêm mới</button>
                        </div>
                    </div>
                </div>
                
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th style={{ width: 40 }}><input type="checkbox" /></th>
                                <th>STT</th>
                                <th>Tên bài kiểm tra</th>
                                <th>Khoá học chuyên đề</th>
                                <th style={{ textAlign: 'center' }}>Điểm đạt (%)</th>
                                <th style={{ textAlign: 'center' }}>Thời lượng</th>
                                <th style={{ textAlign: 'center' }}>Số lần thử</th>
                                <th>Trạng thái</th>
                                <th>HD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testData.map((test, i) => (
                                <tr key={i} className={styles.tableRow}>
                                    <td className={styles.tableCell}><input type="checkbox" /></td>
                                    <td className={styles.tableCell}>{test.stt}</td>
                                    <td className={styles.tableCell} style={{ fontWeight: 600 }}>{test.name}</td>
                                    <td className={styles.tableCell}>{test.course}</td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>{test.passing}</td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>{test.duration}</td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>{test.attempts}</td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        <span className={`${styles.statusPill} ${
                                            test.status === 'Active' ? styles.statusActive : styles.statusHidden
                                        }`}>
                                            {test.status === 'Active' ? 'Hoạt động' : 'Tạm ẩn'}
                                        </span>
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        <button className={styles.iconBtn}>⋮</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className={styles.pagination} style={{ padding: '24px 0' }}>
                <div className={styles.pageInfo}>
                    Hiển thị <b>1-20</b> trong tổng số <b>345</b> bài kiểm tra
                </div>
                <div className={styles.pageControls}>
                    <span className={styles.pageBtnInert}>Trước</span>
                    <span className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</span>
                    <span className={styles.pageBtn}>2</span>
                    <span className={styles.pageBtn}>3</span>
                    <span className={styles.pageBtnInert}>...</span>
                    <span className={styles.pageBtn}>140</span>
                    <span className={styles.pageBtnInert} style={{ color: '#3b82f6' }}>Sau</span>
                </div>
            </div>
        </BaseAdminLayout>
    );
};
