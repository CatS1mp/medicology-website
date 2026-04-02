'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEnrolledCourses } from '@/shared/hooks/useEnrolledCourses';

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
];

export const AppSidebar: React.FC = () => {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { courses: enrolledCourses, isLoading: coursesLoading } = useEnrolledCourses();

    // "Khoá học của bạn" expands when we're inside any /courses/* route
    const isInCourses = pathname?.startsWith('/courses');
    const [coursesOpen, setCoursesOpen] = useState(isInCourses ?? false);

    React.useEffect(() => {
        if (isInCourses) setCoursesOpen(true);
    }, [isInCourses]);

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
                                // Highlight parent for all sub-routes
                                const isActive = isCourses
                                    ? !!isInCourses
                                    : isEncyclopedia
                                        ? !!pathname?.startsWith('/encyclopedia')
                                        : pathname === item.href;

                                return (
                                    <div key={item.label}>
                                        {/* Main nav item */}
                                        <Link
                                            href={isCourses ? '#' : item.href}
                                            onClick={isCourses ? (e) => { e.preventDefault(); setCoursesOpen(o => !o); } : undefined}
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
                                                        <span className="flex-shrink-0 pr-1">
                                                            {coursesOpen ? <IconChevronUp /> : <IconChevronDown />}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </Link>

                                        {/* Sub-items: list of enrolled courses from API */}
                                        {isCourses && !collapsed && coursesOpen && (
                                            <div className="relative mt-2 mb-2">
                                                {coursesLoading ? (
                                                    <div className="pl-[52px] py-2 text-sm text-gray-400">Đang tải...</div>
                                                ) : enrolledCourses.length === 0 ? (
                                                    <div className="pl-[52px] py-2 text-sm text-gray-400">Chưa có khóa học</div>
                                                ) : (
                                                    <>
                                                        <div className="absolute left-[23px] top-[-8px] h-[8px] w-[2px] bg-[#4147D5]" />
                                                        <div className="flex flex-col">
                                                            {enrolledCourses.map((course, idx) => {
                                                                const isLast = idx === enrolledCourses.length - 1;
                                                                const isCourseActive = pathname === `/courses/${course.slug}`;

                                                                return (
                                                                    <div key={course.slug} className="relative py-[9px] pl-[52px]">
                                                                        {!isLast && (
                                                                            <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-[#4147D5]" />
                                                                        )}
                                                                        {isLast && (
                                                                            <div className="absolute left-[23px] top-0 bottom-1/2 w-[2px] bg-[#4147D5]" />
                                                                        )}
                                                                        <div className="absolute left-[23px] top-0 h-1/2 w-[20px] border-l-[2px] border-b-[2px] border-[#4147D5] rounded-bl-[14px]" />

                                                                        <Link
                                                                            href={`/courses/${course.slug}`}
                                                                            className={`block text-[15px] leading-tight transition-colors font-medium ${
                                                                                isCourseActive
                                                                                    ? 'text-[#4147D5]'
                                                                                    : 'text-[#344054] hover:text-[#4147D5]'
                                                                            }`}
                                                                        >
                                                                            {course.label}
                                                                        </Link>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}
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
