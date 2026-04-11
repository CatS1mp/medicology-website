'use client';

import React from 'react';
import styles from '../admin.module.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

const questions = [
    { type: 'ĐÚNG/SAI', score: 3, text: 'Tâm thất trái bơm máu đến phổi?', level: 'CƠ BẢN', active: true },
    { type: 'MCQ', score: 5, text: 'Xác định nguyên nhân chính gây Sa van hai lá ở bệnh nhân trưởng thành.', level: 'TRUNG BÌNH', active: false },
    { type: 'MCQ', score: 8, text: 'Cơ chế tác dụng của thuốc chống loạn nhịp nhóm III liên quan đến việc ngăn chặn kênh...', level: 'NÂNG CAO', active: false },
];

import { BaseAdminLayout } from './BaseAdminLayout';

export const AdminTestDetailScreen: React.FC = () => {
    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Chi tiết Quản lý Bài tập/Bài kiểm tra</h1>
                    <p>Quản lý tập trung hệ thống câu hỏi và thiết lập cấu hình bài kiểm tra trong toàn bộ hệ thống</p>
                </div>
            </section>
            
            <div className={styles.tabGroup}>
                <div className={`${styles.tabBtn} ${styles.tabBtnActive}`}>Bài kiểm tra khoá học</div>
                <div className={`${styles.tabBtn} ${styles.tabBtnInactive}`}>Bài kiểm tra đầu vào</div>
            </div>

            <div className={styles.editorContainer}>
                <aside className={styles.questionListSidebar}>
                    <button className={styles.btnPrimary} style={{ width: '100%', borderRadius: 12 }}>+ Thêm câu hỏi</button>
                    
                    <div className={styles.chipGroup} style={{ backgroundColor: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                        <button className={`${styles.chip} ${styles.chipActive}`} style={{ flex: 1, border: 'none' }}>Tất cả</button>
                        <button className={styles.chip} style={{ flex: 1, border: 'none', background: 'transparent' }}>Bản nháp</button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Câu hỏi đánh giá</p>
                        {questions.map((q, i) => (
                            <div key={i} className={`${styles.qItemCard} ${q.active ? styles.qItemCardActive : ''}`}>
                                <div className={styles.qItemHeader}>
                                    <span className={styles.qTypeBadge}>{q.type}</span>
                                    <span className={styles.qScoreBadge}>{q.score} Điểm</span>
                                </div>
                                <p className={styles.qTextSnippet}>{q.text}</p>
                                <span className={styles.levelBadge} style={{ fontSize: 9, padding: '2px 8px' }}>
                                    {q.level}
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                        <span style={{ color: '#3b82f6' }}>Tổng số câu hỏi: 5</span>
                        <span style={{ color: '#64748b' }}>Tổng điểm: 29</span>
                    </div>
                </aside>

                <section className={styles.editorMain}>
                    <div className={styles.infoRow}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Cardiology Advanced - Kiểm tra Chuyên khoa</h2>
                    </div>
                    
                    <div className={styles.settingRow}>
                        <div className={styles.settingItem}>
                            <span className={styles.settingLabel}>Điểm đạt</span>
                            <div className={styles.inputStepper}>
                                <button className={styles.stepperBtn}>-</button>
                                <input className={styles.stepperInput} defaultValue="70" />
                                <button className={styles.stepperBtn}>+</button>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>%</span>
                        </div>
                        
                        <div className={styles.settingItem}>
                            <span className={styles.settingLabel}>Thời gian</span>
                            <div className={styles.inputStepper}>
                                <button className={styles.stepperBtn}>-</button>
                                <input className={styles.stepperInput} defaultValue="30" />
                                <button className={styles.stepperBtn}>+</button>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>PHÚT</span>
                        </div>
                        
                        <div className={styles.settingItem}>
                            <span className={styles.settingLabel}>Số lần làm tối đa</span>
                            <div className={styles.inputStepper}>
                                <button className={styles.stepperBtn}>-</button>
                                <input className={styles.stepperInput} defaultValue="3" />
                                <button className={styles.stepperBtn}>+</button>
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.infoRow}>
                        <div className={styles.infoGroup}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Loại câu hỏi</span>
                                <span className={styles.infoValue} style={{ color: '#3b82f6' }}>ĐÚNG / SAI</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Điểm số</span>
                                <span className={styles.infoValue} style={{ textAlign: 'center' }}>3</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Mức độ khó</span>
                                <span className={styles.infoValue}>CƠ BẢN</span>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button className={styles.btnSecondary} style={{ color: '#3b82f6', border: '1px solid #3b82f6' }}>✨ Tối ưu bằng AI</button>
                            <button style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🗑️ XÓA</button>
                        </div>
                    </div>
                    
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>Nội dung câu hỏi</p>
                        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Tâm thất trái bơm máu đến phổi?</h3>
                    </div>
                    
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 20 }}>Lựa chọn đáp án</p>
                        <div className={styles.answerGrid}>
                            <div className={`${styles.answerBtn} ${styles.answerBtnActive}`}>
                                ĐÚNG <span style={{ fontSize: 18 }}>✔️</span>
                            </div>
                            <div className={styles.answerBtn}>
                                SAI
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.aiBox}>
                        <div className={styles.aiHeader}>
                            <span>✨</span> Giải thích y khoa (AI)
                        </div>
                        <p className={styles.aiContent}>
                            Tâm thất trái chịu trách nhiệm cho tuần hoàn hệ thống, bơm máu có oxy đến cơ thể qua động mạch chủ. Chính tâm thất phải mới là nơi bơm máu nghèo oxy lên phổi thông qua động mạch phổi.
                        </p>
                    </div>
                </section>
            </div>
            
            <footer className={styles.statusBar}>
                <div className={styles.statusMsg}>
                    <span>⚠️</span> Tổng điểm câu hỏi hiện tại chưa đạt mức điểm đạt yêu cầu!
                </div>
                <div className={styles.statusInfo}>
                    <span>☁️ Trạng thái: <b>Vừa được lưu</b></span>
                </div>
            </footer>
        </BaseAdminLayout>
    );
};
