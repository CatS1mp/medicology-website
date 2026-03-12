'use client';

import React from 'react';

interface AppHeaderProps {
    streak: number;
}

const IconSearch = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
);

const IconFilter = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
        <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04c-.83 0-1.3.95-.79 1.61z" />
    </svg>
);

const IconBell = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
);

export const AppHeader: React.FC<AppHeaderProps> = ({ streak }) => {
    return (
        <header className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100">
            {/* Search */}
            <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <IconSearch />
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="flex-1 bg-transparent text-base text-gray-700 placeholder:text-gray-400 outline-none"
                />
            </div>

            {/* Filter */}
            <button className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <IconFilter />
            </button>

            {/* Streak badge */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors">
                <span className="text-orange-500 font-bold text-sm">🔥 {streak}</span>
            </button>

            {/* Notification bell */}
            <button className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors relative">
                <IconBell />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm cursor-pointer hover:bg-gray-400 transition-colors">
                N
            </div>
        </header>
    );
};
