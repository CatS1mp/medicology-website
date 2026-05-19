'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '@/features/admin/admin.module.css';
import tableStyles from './admin-dictionary-screen.module.css';
import { BaseAdminLayout } from '@/features/admin/components/layout/BaseAdminLayout';
import { AdminTableSkeleton } from '@/features/admin/components/shared/AdminTableSkeleton';
import type { DictionaryArticleResponse } from '@/features/encyclopedia/api';
import {
    adminDeleteArticle,
    adminListArticlesPaged,
} from '@/shared/api/admin-dictionary';

function formatDate(iso?: string | null): string {
    if (!iso) return '---';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('vi-VN');
}

export const AdminDictionaryScreen: React.FC = () => {
    const PAGE_SIZE = 20;
    const [articles, setArticles] = useState<DictionaryArticleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { items, total: totalItems } = await adminListArticlesPaged({ page: page - 1, size: PAGE_SIZE });
            setArticles(items);
            setTotal(totalItems);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được từ điển.');
            setArticles([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const handleClickOutside = (evt: MouseEvent) => {
            const target = evt.target as HTMLElement | null;
            if (!target?.closest(`.${tableStyles.rowMenuWrap}`)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const filteredArticles = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return articles;
        return articles.filter((item) => {
            const tags = (item.tags ?? []).map((tag) => tag.name).join(' ');
            return `${item.name} ${item.slug} ${tags}`.toLowerCase().includes(q);
        });
    }, [articles, searchText]);

    useEffect(() => {
        setPage(1);
    }, [searchText]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pagedArticles = filteredArticles;
    const startIndex = total === 0 ? 0 : start + 1;
    const endIndex = start + pagedArticles.length;

    const pageButtons = useMemo(() => {
        const hardTotal = totalPages;
        if (hardTotal <= 6) return Array.from({ length: hardTotal }, (_, i) => String(i + 1));
        const nearStart = currentPage <= 3;
        const nearEnd = currentPage >= hardTotal - 2;
        if (nearStart) return ['1', '2', '3', '...', String(hardTotal)];
        if (nearEnd) return ['1', '...', String(hardTotal - 2), String(hardTotal - 1), String(hardTotal)];
        return ['1', '...', String(currentPage), '...', String(hardTotal)];
    }, [currentPage, totalPages]);

    const toHumanAuthor = (adminId?: string | null) => {
        if (!adminId) return 'Jana Kim';
        if (adminId.includes('-') || adminId.length > 14) return 'Jana Kim';
        return adminId;
    };

    const toTopic = (slug?: string | null) => {
        if (!slug) return 'Sơ cứu & Cấp cứu';
        const text = slug.toLowerCase();
        if (text.includes('tim') || text.includes('heart')) return 'Tim mạch & Hô hấp';
        if (text.includes('di-ung') || text.includes('allergy')) return 'Dị ứng & Miễn dịch';
        return 'Sơ cứu & Cấp cứu';
    };

    const toArticleCode = (absoluteIndex: number) => `SPV${String((absoluteIndex % 99) + 1).padStart(2, '0')}`;

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

            <div className={tableStyles.card}>
                <div className={tableStyles.intro}>
                    <h3 className={tableStyles.title}>Danh sách Từ điển</h3>
                    <p className={tableStyles.subtitle}>
                        Quản lý các thuật ngữ và bài viết bách khoa y học trong hệ thống
                    </p>

                    <div className={tableStyles.toolbar}>
                        <div className={tableStyles.searchWrap}>
                            <svg className={tableStyles.searchIcon} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    d="M15.5 14h-.8l-.3-.3a6.6 6.6 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.8 4.8 0 1 1 0-9.6 4.8 4.8 0 0 1 0 9.6Z"
                                    fill="currentColor"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Tìm kiếm"
                                className={tableStyles.searchInput}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <div className={tableStyles.actions}>
                            <button type="button" className={styles.btnSecondary} disabled>
                                ↓ Nhập Excel
                            </button>
                            <button type="button" className={styles.btnSecondary} disabled>
                                ↓ Xuất Excel
                            </button>
                            <Link href="/admin/dictionary/new" className={styles.btnPrimary} style={{ borderRadius: 8 }}>
                                + Thêm thuật ngữ
                            </Link>
                        </div>
                    </div>
                </div>

                {loading && (
                    <AdminTableSkeleton
                        columns={[
                            { key: 'sel', width: 'w-6' },
                            { key: 'code', width: 'w-14' },
                            { key: 'term', width: 'w-56' },
                            { key: 'topic', width: 'w-40' },
                            { key: 'author', width: 'w-32' },
                            { key: 'pub', width: 'w-24' },
                            { key: 'upd', width: 'w-24' },
                            { key: 'tags', width: 'w-40' },
                            { key: 'status', width: 'w-24' },
                            { key: 'act', width: 'w-12' },
                        ]}
                    />
                )}
                {!loading && !error && articles.length === 0 && (
                    <p className={tableStyles.feedback}>Chưa có bài viết.</p>
                )}

                <div className={tableStyles.tableWrap}>
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th className={tableStyles.checkboxCol}>
                                    <input type="checkbox" disabled aria-label="Chọn tất cả" />
                                </th>
                                <th>Mã</th>
                                <th>Thuật ngữ</th>
                                <th>Chủ đề</th>
                                <th>Tác giả</th>
                                <th>Ngày đăng</th>
                                <th>Ngày cập nhật</th>
                                <th>Nhãn (Tags)</th>
                                <th>Trạng thái</th>
                                <th className={tableStyles.actionCol}>HD</th>
                            </tr>
                        </thead>
                        <tbody>
                        {pagedArticles.map((item, index) => {
                            const tagStr = (item.tags ?? []).map((t) => t.name).join(' | ') || '---';
                    const absoluteIndex = start + index;
                            const isRowMenuOpen = menuOpenId === item.id;
                            return (
                                <tr key={item.id}>
                                    <td className={tableStyles.checkboxCol}>
                                        <input type="checkbox" disabled aria-label={`Chọn ${item.name}`} />
                                    </td>
                                    <td>{toArticleCode(absoluteIndex)}</td>
                                    <td className={tableStyles.termCell}>{item.name}</td>
                                    <td>{toTopic(item.slug)}</td>
                                    <td>{toHumanAuthor(item.authorAdminId)}</td>
                                    <td>{formatDate(item.publishedAt)}</td>
                                    <td>{formatDate(item.updatedAt)}</td>
                                    <td className={tableStyles.tagsCell}>{tagStr}</td>
                                    <td>
                                        <span
                                            className={`${tableStyles.statusBadge} ${
                                                item.isPublished ? tableStyles.statusPublished : tableStyles.statusDraft
                                            }`}
                                        >
                                            {item.isPublished ? 'Đã đăng tải' : 'Bản nháp'}
                                        </span>
                                    </td>
                                    <td className={tableStyles.actionCol}>
                                        <div className={tableStyles.rowMenuWrap}>
                                            <button
                                                type="button"
                                                className={tableStyles.moreBtn}
                                                aria-label="Tác vụ"
                                                onClick={() => setMenuOpenId((cur) => (cur === item.id ? null : item.id))}
                                                disabled={busyId === item.id}
                                            >
                                                ⋮
                                            </button>
                                            {isRowMenuOpen && (
                                                <div className={tableStyles.rowMenu}>
                                                    <Link
                                                        href={`/encyclopedia/${item.slug}`}
                                                        className={tableStyles.rowMenuItem}
                                                        onClick={() => setMenuOpenId(null)}
                                                    >
                                                        👁 Xem chi tiết
                                                    </Link>
                                                    <Link
                                                        href={`/admin/dictionary/${item.id}/editor`}
                                                        className={tableStyles.rowMenuItem}
                                                        onClick={() => setMenuOpenId(null)}
                                                    >
                                                        ✎ Chỉnh sửa
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className={`${tableStyles.rowMenuItem} ${tableStyles.rowMenuDelete}`}
                                                        onClick={() => void handleDelete(item)}
                                                    >
                                                        × Xóa thuật ngữ
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                <div className={tableStyles.pagination}>
                    <div className={tableStyles.pageInfo}>
                        Hiển thị <b>{startIndex}-{endIndex}</b> trong tổng số <b>{total}</b> bài viết bách khoa
                    </div>
                    <div className={tableStyles.pageControls}>
                        <button
                            type="button"
                            className={tableStyles.pageBtn}
                            disabled={currentPage <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Trước
                        </button>
                        {pageButtons.map((btn, i) => {
                            if (btn === '...') return <span key={`dots-${i}`} className={tableStyles.pageDots}>...</span>;
                            const p = Number(btn);
                            return (
                                <button
                                    key={btn}
                                    type="button"
                                    className={`${tableStyles.pageNum} ${p === currentPage ? tableStyles.pageNumActive : ''}`}
                                    onClick={() => setPage(Math.min(totalPages, p))}
                                >
                                    {btn}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            className={tableStyles.pageBtn}
                            disabled={currentPage >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </BaseAdminLayout>
    );
};
