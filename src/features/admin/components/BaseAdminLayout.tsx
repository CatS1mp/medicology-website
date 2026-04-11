'use client';

import React from 'react';
import styles from '../admin.module.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface BaseAdminLayoutProps {
    children: React.ReactNode;
}

export const BaseAdminLayout: React.FC<BaseAdminLayoutProps> = ({ children }) => {
    return (
        <div className={styles.adminContainer}>
            <AdminSidebar />
            <div className={styles.mainWrapper}>
                <main className={styles.mainContent}>
                    <AdminHeader />
                    {children}
                </main>
            </div>
        </div>
    );
};
