'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

// Logo component using the brand asset
const MedicologyLogo = ({ collapsed }: { collapsed: boolean }) => (
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
);

const IconDashboard = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
);
const IconBell = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
);
const IconBook = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
    </svg>
);
const IconChevronDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 10l5 5 5-5z" />
    </svg>
);
const IconBookmark = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
);
const IconGlobe = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
);

const navGroups: NavGroup[] = [
    {
        title: 'TỔNG QUAN',
        items: [
            { icon: <IconDashboard />, label: 'Bảng điều khiển', href: '/dashboard', active: true },
            { icon: <IconBell />, label: 'Thông báo', href: '/notifications' },
        ],
    },
    {
        title: 'HỌC TẬP',
        items: [
            { icon: <IconGlobe />, label: 'Chủ đề học tập', href: '/topics' },
            { icon: <IconBook />, label: 'Khoá học của bạn', href: '/courses' },
        ],
    },
    {
        title: 'NGUỒN TÀI LIỆU',
        items: [
            { icon: <IconGlobe />, label: 'Bách khoa Y học', href: '/encyclopedia' },
            { icon: <IconBookmark />, label: 'Sổ tay lưu trữ', href: '/notebook' },
        ],
    },
];

export const AppSidebar: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [coursesOpen, setCoursesOpen] = useState(false);

    return (
        <aside
            className={`relative flex flex-col bg-white border-r border-gray-100 h-screen transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'
                } flex-shrink-0`}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                <Link href="/dashboard" className="flex items-center">
                    <MedicologyLogo collapsed={collapsed} />
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors ml-auto"
                    aria-label="Toggle sidebar"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        {collapsed ? (
                            <path d="M8 4l8 8-8 8V4z" />
                        ) : (
                            <path d="M16 4l-8 8 8 8V4z" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {navGroups.map((group) => (
                    <div key={group.title} className="mb-4">
                        {!collapsed && (
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-1">
                                {group.title}
                            </p>
                        )}
                        {group.items.map((item) => {
                            const isCourses = item.label === 'Khoá học của bạn';
                            return (
                                <div key={item.label}>
                                    <Link
                                        href={item.href}
                                        onClick={isCourses ? (e) => { e.preventDefault(); setCoursesOpen(!coursesOpen); } : undefined}
                                        className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${item.active
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className={item.active ? 'text-blue-600' : 'text-gray-500'}>
                                            {item.icon}
                                        </span>
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1">{item.label}</span>
                                                {isCourses && <IconChevronDown />}
                                            </>
                                        )}
                                    </Link>
                                    {isCourses && !collapsed && coursesOpen && (
                                        <div className="ml-9 mb-1">
                                            {['Tim mạch học', 'Thần kinh học', 'Giải phẫu học'].map((sub) => (
                                                <Link
                                                    key={sub}
                                                    href="#"
                                                    className="block text-xs text-gray-500 hover:text-blue-600 py-1"
                                                >
                                                    {sub}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </aside>
    );
};
