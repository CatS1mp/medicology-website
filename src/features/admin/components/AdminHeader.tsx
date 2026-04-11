import React from 'react';
import styles from '../admin.module.css';

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

                <button className={styles.headerBtn} aria-label="Thông báo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6.75 9.5C6.75 6.6 9.1 4.25 12 4.25C14.9 4.25 17.25 6.6 17.25 9.5V12.75L18.75 15V16.25H5.25V15L6.75 12.75V9.5Z" stroke="#9CA3AF" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M10 18C10.3 19 11.1 19.75 12 19.75C12.9 19.75 13.7 19 14 18" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className={styles.notificationDot} aria-hidden="true" />
                </button>
                <button type="button" className={styles.avatar} aria-label="Tài khoản quản trị" />
            </div>
        </header>
    );
};
