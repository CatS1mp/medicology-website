'use client';

import React from 'react';
import styles from '../admin.module.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

const dictData = [
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '---', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Draft' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '---', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Draft' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '---', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Draft' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '---', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Draft' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '---', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Draft' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '03/12/2025', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Published' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '---', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Draft' },
    { code: 'SPV01', term: 'Sốc phản vệ', topic: 'Sơ cứu & Cấp cứu', author: 'Jana Kim', posted: '---', updated: '06/04/2026', tags: ['Cấp cứu', 'Dị ứng', 'Tim mạch'], status: 'Draft' },
];

import { BaseAdminLayout } from './BaseAdminLayout';

export const AdminDictionaryScreen: React.FC = () => {
    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Quản lý Từ điển</h1>
                    <p>Hành trình xây dựng kho kiến thức y khoa bách khoa chính xác và tin cậy</p>
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
                    <span className={styles.filterLabel}>Nhãn phổ biến</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Tất cả</button>
                        <button className={styles.chip}>#SơCứu</button>
                        <button className={styles.chip}>#DịỨng</button>
                        <button className={styles.chip}>#TimMạch</button>
                    </div>
                </div>
                
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Chủ đề học tập</span>
                    <div className={styles.chipGroup}>
                        <button className={`${styles.chip} ${styles.chipActive}`}>Tất cả</button>
                        <button className={styles.chip}>Sơ cứu & Cấp cứu</button>
                        <button className={styles.chip}>Dinh dưỡng & Chế độ ăn</button>
                        <button className={styles.chip}>Sức khỏe Tinh thần</button>
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
            
            <div className={styles.chartContainer} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 24 }}>
                    <h3 className={styles.chartTitle}>Danh sách Từ điển</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Quản lý các thuật ngữ và bài viết bách khoa y học trong hệ thống</p>
                    
                    <div className={styles.actionsBar}>
                        <div className={styles.searchContainer} style={{ maxWidth: 400 }}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} />
                        </div>
                        <div className={styles.actionsGroup}>
                            <button className={styles.btnSecondary}>📥 Nhập Excel</button>
                            <button className={styles.btnSecondary}>📤 Xuất Excel</button>
                            <button className={styles.btnPrimary} style={{ borderRadius: 8 }}>+ Thêm thuật ngữ</button>
                        </div>
                    </div>
                </div>
                
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th style={{ width: 40 }}><input type="checkbox" /></th>
                                <th>Mã</th>
                                <th>Thuật ngữ</th>
                                <th>Chủ đề</th>
                                <th>Tác giả</th>
                                <th>Ngày đăng</th>
                                <th>Ngày cập nhật</th>
                                <th>Nhãn (Tags)</th>
                                <th>Trạng thái</th>
                                <th>HD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dictData.map((item, i) => (
                                <tr key={i} className={styles.tableRow}>
                                    <td className={styles.tableCell}><input type="checkbox" /></td>
                                    <td className={styles.tableCell}>{item.code}</td>
                                    <td className={styles.tableCell} style={{ fontWeight: 600 }}>{item.term}</td>
                                    <td className={styles.tableCell}>{item.topic}</td>
                                    <td className={styles.tableCell}>{item.author}</td>
                                    <td className={styles.tableCell}>{item.posted}</td>
                                    <td className={styles.tableCell}>{item.updated}</td>
                                    <td className={styles.tableCell} style={{ fontSize: 11, color: '#3b82f6' }}>
                                        {item.tags.join(' | ')}
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        <span className={`${styles.levelBadge} ${
                                            item.status === 'Published' ? styles.lvlGeneral : styles.badgeLevel
                                        }`}>
                                            {item.status === 'Published' ? 'Đã đăng tải' : 'Bản nháp'}
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
                    Hiển thị <b>1-20</b> trong tổng số <b>345</b> bài viết bách khoa
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
