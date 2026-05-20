import React from 'react';
import styles from '@/features/admin/admin.module.css';

export const AdminHeader: React.FC = () => {
    return (
        <header className={styles.header}>
            <div className={styles.searchContainer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15.75 15.75L21 21" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="10.5" cy="10.5" r="6.75" stroke="#9CA3AF" strokeWidth="1.8" />
                </svg>
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.headerActions}>
                <button className={styles.headerBtn} aria-label="Lọc">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4.5 6.5H19.5L14 12V17.5L10 19V12L4.5 6.5Z" stroke="#9CA3AF" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                </button>

                <button type="button" className={styles.avatar} aria-label="Tài khoản quản trị" />
            </div>
        </header>
    );
};
