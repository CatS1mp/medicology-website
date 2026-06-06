'use client';

import React from 'react';
import styles from '@/features/admin/admin.module.css';
import { AdminSidebar } from '@/features/admin/components/layout/AdminSidebar';

interface BaseAdminLayoutProps {
    children: React.ReactNode;
}

export const BaseAdminLayout: React.FC<BaseAdminLayoutProps> = ({ children }) => {
    return (
        <div className={styles.adminContainer}>
            <AdminSidebar />
            <div className={styles.mainWrapper}>
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </div>
    );
};
