'use client';

import React, { useState } from 'react';
import styles from '../admin.module.css';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const ICON_COLOR = '#4A55E2';

const SidebarIconImage = ({ src, alt }: { src: string; alt: string }) => (
    <Image src={src} alt={alt} width={20} height={20} />
);

const DashboardIcon = () => (
    <SidebarIconImage src="/images/Icons/streamline-flex-color_dashboard-3.svg" alt="Bảng điều khiển" />
);

const BellIcon = () => (
    <SidebarIconImage src="/images/Icons/streamline-flex-color_bell-notification.svg" alt="Thông báo" />
);

const TopicsIcon = () => (
    <SidebarIconImage src="/images/Icons/streamline-color_open-book.svg" alt="Quản lý khóa học" />
);

const DictionaryIcon = () => (
    <SidebarIconImage src="/images/Icons/streamline-color_manual-book.svg" alt="Quản lý từ điển" />
);

const StudentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3.4 6.3V4.6C3.4 4.05 3.85 3.6 4.4 3.6H6.1" stroke={ICON_COLOR} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M16.6 6.3V4.6C16.6 4.05 16.15 3.6 15.6 3.6H13.9" stroke={ICON_COLOR} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M3.4 13.7V15.4C3.4 15.95 3.85 16.4 4.4 16.4H6.1" stroke={ICON_COLOR} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M16.6 13.7V15.4C16.6 15.95 16.15 16.4 15.6 16.4H13.9" stroke={ICON_COLOR} strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="10" cy="8.05" r="2.35" stroke={ICON_COLOR} strokeWidth="1.7" />
        <path d="M6.45 15.05C6.45 12.99 8.11 11.3 10.17 11.3H10.3C12.37 11.3 14.03 12.99 14.03 15.05" stroke={ICON_COLOR} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

const ReportIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke={ICON_COLOR} strokeWidth="1.8" />
        <path d="M10 10V3.3" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10 10H16.6" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10 10L14.9 6.8" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 6.5H7.5C6.67 6.5 6 7.17 6 8V16C6 16.83 6.67 17.5 7.5 17.5H10" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M11.5 12H19M16 8.5L19.5 12L16 15.5" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const navSections = [
    {
        title: 'TỔNG QUAN',
        items: [
            { icon: <DashboardIcon />, label: 'Bảng điều khiển', href: '/admin' },
            { icon: <BellIcon />, label: 'Thông báo', href: '/admin/notifications' },
        ]
    },
    {
        title: 'QUẢN LÝ',
        items: [
            { icon: <TopicsIcon />, label: 'Quản lý khóa học', href: '/admin/topics' },
            { icon: <DictionaryIcon />, label: 'Quản lý từ điển', href: '/admin/dictionary' },
            { icon: <StudentIcon />, label: 'Quản lý người dùng', href: '/admin/students' },
        ]
    },
    {
        title: 'HỆ THỐNG',
        items: [
            { icon: <ReportIcon />, label: 'Báo cáo tổng quan', href: '/admin/reports' },
        ]
    }
];

export const AdminSidebar: React.FC = () => {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`} style={{ width: collapsed ? 88 : 280 }}>
            <div className={`${styles.logoContainer} ${collapsed ? styles.logoContainerCollapsed : ''}`}>
                <Link href="/admin" className={styles.logoGroup}>
                    {collapsed ? (
                        <div className={styles.logoMarkWrap}>
                            <Image
                                src="/images/Logo/Frame 14.svg"
                                alt="Medicology"
                                width={201}
                                height={44}
                                priority
                                className={styles.logoMarkImage}
                            />
                        </div>
                    ) : (
                        <Image
                            src="/images/Logo/Frame 14.svg"
                            alt="Medicology"
                            width={201}
                            height={44}
                            priority
                            className={styles.logoImage}
                        />
                    )}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={styles.collapseBtn}
                    aria-label="Toggle sidebar"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        {collapsed ? <path d="M8 4l8 8-8 8V4z" /> : <path d="M16 4l-8 8 8 8V4z" />}
                    </svg>
                </button>
            </div>

            <nav className={styles.navScrollArea}>
                {navSections.map((section, idx) => (
                    <div key={idx} className={styles.navGroup}>
                        {!collapsed && <p className={styles.navTitle}>{section.title}</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {section.items.map((item, i) => {
                                const isDashboard = item.href === '/admin';
                                const isActive = isDashboard
                                    ? pathname === '/admin'
                                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <Link
                                        href={item.href}
                                        key={i}
                                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                    >
                                        <span className={styles.navIcon}>{item.icon}</span>
                                        {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <button type="button" className={styles.logoutBtn}>
                <span className={styles.navIcon}><LogoutIcon /></span>
                {!collapsed && <span>Đăng xuất</span>}
            </button>
        </aside>
    );
};
