'use client';

import React from 'react';
import styles from '../admin.module.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { TopicCard } from './TopicCard';

const topicData = [
    { status: 'published' as const, level: 'Cơ bản', title: 'Tâm thần học – Psychiatry', desc: 'Nghiên cứu về sức khỏe tâm thần, rối loạn tâm lý, trầm cảm, lo âu,...', metrics: { courses: 12, lessons: 24, exercises: 25 }, createdDate: '2024-01-20', rating: 4.8 },
    { status: 'draft' as const, level: 'Cơ bản', title: 'Tâm thần học – Psychiatry', desc: 'Nghiên cứu về sức khỏe tâm thần, rối loạn tâm lý, trầm cảm, lo âu,...', metrics: { courses: 12, lessons: 24, exercises: 25 }, createdDate: '2024-01-20', rating: 4.8 },
    { status: 'published' as const, level: 'Cơ bản', title: 'Tâm thần học – Psychiatry', desc: 'Nghiên cứu về sức khỏe tâm thần, rối loạn tâm lý, trầm cảm, lo âu,...', metrics: { courses: 12, lessons: 24, exercises: 25 }, createdDate: '2024-01-20', rating: 4.8 },
    { status: 'published' as const, level: 'Cơ bản', title: 'Tâm thần học – Psychiatry', desc: 'Nghiên cứu về sức khỏe tâm thần, rối loạn tâm lý, trầm cảm, lo âu,...', metrics: { courses: 12, lessons: 24, exercises: 25 }, createdDate: '2024-01-20', rating: 4.8 },
    { status: 'published' as const, level: 'Cơ bản', title: 'Tâm thần học – Psychiatry', desc: 'Nghiên cứu về sức khỏe tâm thần, rối loạn tâm lý, trầm cảm, lo âu,...', metrics: { courses: 12, lessons: 24, exercises: 25 }, createdDate: '2024-01-20', rating: 4.8 },
    { status: 'published' as const, level: 'Cơ bản', title: 'Tâm thần học – Psychiatry', desc: 'Nghiên cứu về sức khỏe tâm thần, rối loạn tâm lý, trầm cảm, lo âu,...', metrics: { courses: 12, lessons: 24, exercises: 25 }, createdDate: '2024-01-20', rating: 4.8 },
];

import { BaseAdminLayout } from './BaseAdminLayout';

export const AdminTopicsScreen: React.FC = () => {
    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Quản lý Chủ đề học tập</h1>
                    <p>Hành trình hiểu về cơ thể và tâm trí qua các chủ đề học tập thiết thực</p>
                </div>
            </section>
            
            <section className={styles.filterSection}>
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Sắp xếp theo:</span>
                    <select className={styles.chartYearSelect} style={{ width: 160 }}>
                        <option>Mới cập nhật</option>
                        <option>Tên A-Z</option>
                    </select>
                </div>
                
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Trình độ</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Mọi trình độ</button>
                        <button className={styles.chip}>Cơ bản</button>
                        <button className={styles.chip}>Trung cấp</button>
                        <button className={styles.chip}>Nâng cao</button>
                    </div>
                </div>
                
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Chủ đề học tập</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Tất cả</button>
                        <button className={styles.chip}>Sơ cứu & Cấp cứu</button>
                        <button className={styles.chip}>Dinh dưỡng & Chế độ ăn</button>
                        <button className={styles.chip}>Sức khỏe Tinh thần</button>
                        <button className={styles.chip}>Sức khỏe Tim mạch</button>
                        <button className={styles.chip}>Y học Thường thức</button>
                    </div>
                </div>
                
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Trạng thái hiển thị</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Tất cả</button>
                        <button className={styles.chip}>Đã đăng tải</button>
                        <button className={styles.chip}>Bản nháp</button>
                    </div>
                </div>
            </section>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className={styles.btnPrimary} style={{ borderRadius: 12 }}>
                    <span style={{ fontSize: 18 }}>+</span> Thêm chủ đề
                </button>
            </div>
            
            <div className={styles.topicsGrid}>
                {topicData.map((topic, i) => (
                    <TopicCard key={i} {...topic} />
                ))}
            </div>
            
            <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                    Hiển thị <b>1-6</b> trong tổng số <b>200</b> chủ đề
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
