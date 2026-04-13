'use client';

import React, { useCallback, useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { BaseAdminLayout } from './BaseAdminLayout';
import type { DictionaryArticleResponse } from '@/features/encyclopedia/api';
import {
    adminCreateArticle,
    adminDeleteArticle,
    adminListArticles,
    adminPublishArticle,
} from '@/shared/api/admin-dictionary';

function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN');
}

export const AdminDictionaryScreen: React.FC = () => {
    const [articles, setArticles] = useState<DictionaryArticleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await adminListArticles();
            setArticles(list);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được từ điển.');
            setArticles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreate = async () => {
        const themeId = window.prompt('Theme ID');
        if (!themeId?.trim()) return;
        const name = window.prompt('Tên thuật ngữ');
        if (!name?.trim()) return;
        const slug = window.prompt('Slug (URL)', name.trim().toLowerCase().replace(/\s+/g, '-')) ?? '';
        if (!slug.trim()) return;
        try {
            await adminCreateArticle({
                themeId: themeId.trim(),
                name: name.trim(),
                slug: slug.trim(),
                contentMarkdown: `# ${name.trim()}\n\n`,
                isPublished: false,
            });
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Tạo bài viết thất bại.');
        }
    };

    const handleTogglePublish = async (a: DictionaryArticleResponse) => {
        setBusyId(a.id);
        try {
            await adminPublishArticle(a.id, !a.isPublished);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Cập nhật trạng thái thất bại.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (a: DictionaryArticleResponse) => {
        if (!window.confirm(`Xóa bài viết "${a.name}"?`)) return;
        setBusyId(a.id);
        try {
            await adminDeleteArticle(a.id);
            await load();
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Xóa thất bại.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <BaseAdminLayout>
            <section className={styles.reportHeader}>
                <div className={styles.reportTitleGroup}>
                    <h1>Quản lý Từ điển</h1>
                    <p>Hành trình xây dựng kho kiến thức y khoa bách khoa chính xác và tin cậy</p>
                </div>
            </section>

            {error && (
                <section className={styles.filterSection} style={{ borderColor: '#fecaca', background: '#fef2f2', padding: 16 }}>
                    <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
                    <button type="button" className={styles.btnPrimary} style={{ marginTop: 12 }} onClick={() => void load()}>
                        Thử lại
                    </button>
                </section>
            )}

            <section className={styles.filterSection}>
                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Sắp xếp theo:</span>
                    <select className={styles.chartYearSelect} style={{ width: 160 }} disabled>
                        <option>Mới cập nhật</option>
                    </select>
                </div>

                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Nhãn phổ biến</span>
                    <div className={styles.chipGroup}>
                        <button type="button" className={`${styles.chip} ${styles.chipActive}`}>
                            Tất cả
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            #SơCứu
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            #DịỨng
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            #TimMạch
                        </button>
                    </div>
                </div>

                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Chủ đề học tập</span>
                    <div className={styles.chipGroup}>
                        <button type="button" className={`${styles.chip} ${styles.chipActive}`}>
                            Tất cả
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            Sơ cứu & Cấp cứu
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            Dinh dưỡng & Chế độ ăn
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            Sức khỏe Tinh thần
                        </button>
                    </div>
                </div>

                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Trạng thái hiển thị</span>
                    <div className={styles.chipGroup}>
                        <button type="button" className={`${styles.chip} ${styles.chipActive}`}>
                            Tất cả
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            Đã đăng tải
                        </button>
                        <button type="button" className={styles.chip} disabled>
                            Bản nháp
                        </button>
                    </div>
                </div>
            </section>

            <div className={styles.chartContainer} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 24 }}>
                    <h3 className={styles.chartTitle}>Danh sách Từ điển</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                        Quản lý các thuật ngữ và bài viết bách khoa y học trong hệ thống
                    </p>

                    <div className={styles.actionsBar}>
                        <div className={styles.searchContainer} style={{ maxWidth: 400 }}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} disabled />
                        </div>
                        <div className={styles.actionsGroup}>
                            <button type="button" className={styles.btnSecondary} disabled>
                                📥 Nhập Excel
                            </button>
                            <button type="button" className={styles.btnSecondary} disabled>
                                📤 Xuất Excel
                            </button>
                            <button type="button" className={styles.btnPrimary} style={{ borderRadius: 8 }} onClick={() => void handleCreate()}>
                                + Thêm thuật ngữ
                            </button>
                        </div>
                    </div>
                </div>

                {loading && <p style={{ padding: '0 24px 16px', color: '#94a3b8' }}>Đang tải…</p>}
                {!loading && !error && articles.length === 0 && (
                    <p style={{ padding: '0 24px 16px', color: '#94a3b8' }}>Chưa có bài viết.</p>
                )}

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th style={{ width: 40 }}>
                                    <input type="checkbox" disabled />
                                </th>
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
                            {articles.map((item) => {
                                const tagStr = (item.tags ?? []).map((t) => t.name).join(' | ');
                                return (
                                    <tr key={item.id} className={styles.tableRow}>
                                        <td className={styles.tableCell}>
                                            <input type="checkbox" disabled />
                                        </td>
                                        <td className={styles.tableCell}>{item.slug.slice(0, 12)}</td>
                                        <td className={styles.tableCell} style={{ fontWeight: 600 }}>
                                            {item.name}
                                        </td>
                                        <td className={styles.tableCell}>{item.themeId}</td>
                                        <td className={styles.tableCell}>{item.authorAdminId}</td>
                                        <td className={styles.tableCell}>{formatDate(item.publishedAt)}</td>
                                        <td className={styles.tableCell}>{formatDate(item.updatedAt)}</td>
                                        <td className={styles.tableCell} style={{ fontSize: 11, color: '#3b82f6' }}>
                                            {tagStr || '—'}
                                        </td>
                                        <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                            <span
                                                className={`${styles.levelBadge} ${
                                                    item.isPublished ? styles.lvlGeneral : styles.badgeLevel
                                                }`}
                                            >
                                                {item.isPublished ? 'Đã đăng tải' : 'Bản nháp'}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                className={styles.iconBtn}
                                                title={item.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
                                                disabled={busyId === item.id}
                                                onClick={() => void handleTogglePublish(item)}
                                            >
                                                {item.isPublished ? '⬇' : '⬆'}
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.iconBtn}
                                                title="Xóa"
                                                disabled={busyId === item.id}
                                                onClick={() => void handleDelete(item)}
                                            >
                                                🗑
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.pagination} style={{ padding: '24px 0' }}>
                <div className={styles.pageInfo}>
                    Hiển thị <b>1-{articles.length || 0}</b> trong tổng số <b>{articles.length}</b> bài viết bách khoa
                </div>
                <div className={styles.pageControls}>
                    <span className={styles.pageBtnInert}>Trước</span>
                    <span className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</span>
                    <span className={styles.pageBtnInert}>Sau</span>
                </div>
            </div>
        </BaseAdminLayout>
    );
};
