'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getEnrolledCourses } from '@/shared/api/learning';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

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

const IconChevronDown = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4147D5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const IconChevronUp = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4147D5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
    </svg>
);

const navGroups: NavGroup[] = [
    {
        title: 'TỔNG QUAN',
        items: [
            { icon: <Image src="/images/Icons/streamline-flex-color_dashboard-3.svg" alt="Bảng điều khiển" width={24} height={24} />, label: 'Bảng điều khiển', href: '/dashboard' },
            { icon: <Image src="/images/Icons/streamline-flex-color_bell-notification.svg" alt="Thông báo" width={24} height={24} />, label: 'Thông báo', href: '/notifications' },
        ],
    },
    {
        title: 'HỌC TẬP',
        items: [
            { icon: <Image src="/images/Icons/streamline-color_global-learning.svg" alt="Chủ đề học tập" width={24} height={24} />, label: 'Chủ đề học tập', href: '/topics' },
            { icon: <Image src="/images/Icons/streamline-color_open-book.svg" alt="Khoá học của bạn" width={24} height={24} />, label: 'Khoá học của bạn', href: '/courses' },
        ],
    },
    {
        title: 'NGUỒN TÀI LIỆU',
        items: [
            { icon: <Image src="/images/Icons/streamline-color_manual-book.svg" alt="Bách khoa Y học" width={24} height={24} />, label: 'Bách khoa Y học', href: '/encyclopedia' },
            { icon: <Image src="/images/Icons/Component.svg" alt="Sổ tay lưu trữ" width={24} height={24} />, label: 'Sổ tay lưu trữ', href: '/notebook' },
        ],
    },
    {
        title: 'HỆ THỐNG',
        items: [
            { icon: <Image src="/images/Icons/Component.svg" alt="Hồ sơ cá nhân" width={24} height={24} />, label: 'Hồ sơ cá nhân', href: '/profile' },
        ],
    },
];

export const AppSidebar: React.FC = () => {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [courseLinks, setCourseLinks] = useState<Array<{ slug: string; label: string }>>([]);

    const isInCourses = pathname?.startsWith('/courses');
    const [coursesOpen, setCoursesOpen] = useState(false);

    React.useEffect(() => {
        let cancelled = false;

        async function loadEnrolledCourses() {
            try {
                const courses = await getEnrolledCourses();
                if (cancelled) return;
                setCourseLinks(
                    courses
                        .slice(0, 3)
                        .map((course) => ({ slug: course.slug, label: course.name }))
                );
            } catch {
                if (!cancelled) setCourseLinks([]);
            }
        }

        loadEnrolledCourses();
        window.addEventListener('learning:courses-changed', loadEnrolledCourses);
        return () => {
            cancelled = true;
            window.removeEventListener('learning:courses-changed', loadEnrolledCourses);
        };
    }, []);

    return (
        <aside className={`relative flex flex-col bg-white border-r border-gray-100 h-screen transition-all duration-300 ${collapsed ? 'w-20' : 'w-[280px]'} flex-shrink-0`}>
            {/* Logo */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <Link href="/dashboard" className="flex items-center">
                    <MedicologyLogo collapsed={collapsed} />
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors ml-auto"
                    aria-label="Toggle sidebar"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        {collapsed ? <path d="M8 4l8 8-8 8V4z" /> : <path d="M16 4l-8 8 8 8V4z" />}
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-5 px-4 font-sans">
                {navGroups.map((group, groupIdx) => (
                    <div key={group.title} className={groupIdx !== 0 ? 'mt-8' : ''}>
                        {!collapsed && (
                            <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wide px-3 mb-3">
                                {group.title}
                            </p>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isCourses = item.label === 'Khoá học của bạn';
                                const isEncyclopedia = item.label === 'Bách khoa Y học';
                                const isProfile = item.label === 'Hồ sơ cá nhân';
                                // Highlight parent for all sub-routes
                                const isActive = isCourses
                                    ? !!isInCourses
                                    : isEncyclopedia
                                        ? !!pathname?.startsWith('/encyclopedia')
                                        : isProfile
                                            ? !!pathname?.startsWith('/profile')
                                        : pathname === item.href;

                                return (
                                    <div key={item.label}>
                                        {/* Main nav item */}
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-4 px-3 py-3 rounded-2xl text-[16px] transition-colors ${
                                                isActive ? 'bg-[#E5F0FF] text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                                                {item.icon}
                                            </span>
                                            {!collapsed && (
                                                <>
                                                    <span className="flex-1 truncate">{item.label}</span>
                                                    {isCourses && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setCoursesOpen((open) => !open);
                                                            }}
                                                            aria-label={coursesOpen ? 'Ẩn khóa học gần đây' : 'Hiện khóa học gần đây'}
                                                            className="flex-shrink-0 pr-1"
                                                        >
                                                            {coursesOpen ? <IconChevronUp /> : <IconChevronDown />}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </Link>

                                        {/* Sub-items: list of enrolled courses from data layer */}
                                        {isCourses && !collapsed && coursesOpen && (
                                            <div className="relative mt-2 mb-2">
                                                <div className="absolute left-[23px] top-[-8px] h-[8px] w-[2px] bg-[#4147D5]" />
                                                <div className="flex flex-col">
                                                    {courseLinks.map((course, idx) => {
                                                        const isLast = idx === courseLinks.length - 1;
                                                        const isCourseActive = pathname === `/courses/${course.slug}`;

                                                        return (
                                                            <div key={course.slug} className="relative py-[9px] pl-[52px] pr-3">
                                                                {!isLast && (
                                                                    <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-[#4147D5]" />
                                                                )}
                                                                {isLast && (
                                                                    <div className="absolute left-[23px] top-1/2 w-[2px] bg-[#4147D5]" />
                                                                )}
                                                                <div className="absolute left-[23px] top-0 h-1/2 w-[20px] border-l-[2px] border-b-[2px] border-[#4147D5] rounded-bl-[14px]" />

                                                                <div className="flex items-center gap-3 justify-between">
                                                                    <span
                                                                        className={`block text-[15px] leading-tight transition-colors font-medium ${
                                                                            isCourseActive
                                                                                ? 'text-[#4147D5]'
                                                                                : 'text-[#344054]'
                                                                        }`}
                                                                    >
                                                                        {course.label}
                                                                    </span>
                                                                    <Link
                                                                        href={`/courses/${course.slug}`}
                                                                        className="rounded-full bg-[#E5F0FF] px-3 py-1 text-[12px] font-semibold text-[#1CA1F2] hover:bg-[#d6ebff] transition-colors"
                                                                    >
                                                                        Vào học
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
};
