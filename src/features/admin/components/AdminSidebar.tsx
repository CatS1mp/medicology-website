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
    <SidebarIconImage src="/images/Icons/streamline-color_global-learning.svg" alt="Quản lý chủ đề" />
);

const BookIcon = () => (
    <SidebarIconImage src="/images/Icons/streamline-color_open-book.svg" alt="Quản lý khoá học" />
);

const LessonsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="5.3" cy="4.4" r="2.25" stroke={ICON_COLOR} strokeWidth="1.7" />
        <path d="M2.8 10.8C2.8 8.68 4.52 6.95 6.65 6.95H10.1L9.6 9.05H7.45L6.75 16.9H4.1L3.62 11.05H2.8V10.8Z" stroke={ICON_COLOR} strokeWidth="1.7" strokeLinejoin="round" />
        <rect x="9.6" y="3" width="7.9" height="7.8" rx="1.5" stroke={ICON_COLOR} strokeWidth="1.7" />
        <path d="M12.1 6.9H15.2" stroke={ICON_COLOR} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

const TestsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="2.8" width="10.8" height="14.4" rx="1.7" fill="#DDE5FF" stroke={ICON_COLOR} strokeWidth="1.8" />
        <path d="M6 6.8H10.7" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 10H9.5" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15.2 4.2L17.5 5.4V17.2H15.2V4.2Z" stroke={ICON_COLOR} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
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
        title: 'QUẢN LÝ HỌC TẬP',
        items: [
            { icon: <TopicsIcon />, label: 'Quản lý chủ đề', href: '/admin/topics' },
            { icon: <BookIcon />, label: 'Quản lý khoá học', href: '/admin/courses' },
            { icon: <LessonsIcon />, label: 'Quản lý bài học', href: '/admin/lessons' },
            { icon: <TestsIcon />, label: 'Quản lý bài kiểm tra', href: '/admin/tests' },
            { icon: <DictionaryIcon />, label: 'Quản lý từ điển', href: '/admin/dictionary' },
        ]
    },
    {
        title: 'NGƯỜI DÙNG',
        items: [
            { icon: <StudentIcon />, label: 'Hồ sơ học viên', href: '/admin/students' },
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
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`} style={{ width: collapsed ? 80 : 280 }}>
            <div className={styles.logoContainer}>
                <Link href="/admin" className={styles.logoGroup}>
                    <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-10' : 'w-44'}`}>
                        <Image
                            src="/images/Logo/Frame 14.svg"
                            alt="Medicology"
                            width={201}
                            height={44}
                            priority
                            style={{ minWidth: 201, height: 'auto' }}
                        />
                    </div>
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
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
