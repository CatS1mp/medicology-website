'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BaseUserLayout } from '@/shared/components/BaseUserLayout';
import {
    getNotificationPreference,
    getNotifications,
    markNotificationRead,
    NotificationItem,
    NotificationPreference,
    updateNotificationPreference,
} from '@/shared/api/notifications';

type FilterKey = 'ALL' | 'UNREAD' | 'READ';

const typeMeta: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
    COMMENT: {
        label: 'Bình luận',
        tone: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: <path d="M4 5.75A3.75 3.75 0 0 1 7.75 2h8.5A3.75 3.75 0 0 1 20 5.75v5.5A3.75 3.75 0 0 1 16.25 15H10l-4.55 3.41A.9.9 0 0 1 4 17.69V5.75Zm3.75-2A2 2 0 0 0 5.75 5.75v10.2l3.39-2.54c.16-.11.34-.17.53-.17h6.58a2 2 0 0 0 2-2v-5.5a2 2 0 0 0-2-2h-8.5Z" />,
    },
    COURSE: {
        label: 'Khóa học',
        tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <path d="M5.5 3.25A2.25 2.25 0 0 0 3.25 5.5v12A2.25 2.25 0 0 0 5.5 19.75h12a1 1 0 0 0 0-2h-12a.25.25 0 0 1-.25-.25v-.25h11.5A2.25 2.25 0 0 0 19 15V5.5a2.25 2.25 0 0 0-2.25-2.25H5.5Zm-.25 12V5.5a.25.25 0 0 1 .25-.25h11.25a.25.25 0 0 1 .25.25V15a.25.25 0 0 1-.25.25H5.25Zm3-7.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5H9A.75.75 0 0 1 8.25 8Zm0 3a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" />,
    },
    REMINDER: {
        label: 'Nhắc học',
        tone: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <path d="M12 2.25A7.75 7.75 0 1 0 19.75 10 7.76 7.76 0 0 0 12 2.25ZM12 16A6 6 0 1 1 18 10a6 6 0 0 1-6 6Zm.75-9.25a.75.75 0 0 0-1.5 0v3.56c0 .22.1.43.27.58l2.25 2a.75.75 0 1 0 .96-1.14l-1.98-1.66V6.75Z" />,
    },
    SYSTEM: {
        label: 'Hệ thống',
        tone: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <path d="M11.13 2.76a1 1 0 0 1 1.74 0l8.25 14.5a1 1 0 0 1-.87 1.49H3.75a1 1 0 0 1-.87-1.49l8.25-14.5ZM12 5.28 5.47 16.75h13.06L12 5.28Zm0 3.22a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-1.5 0V9.25A.75.75 0 0 1 12 8.5Zm0 6.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
    },
};

function formatDateTime(value?: string | null) {
    if (!value) return '';
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    }).format(new Date(value));
}

function normalizeTimeForInput(value?: string | null) {
    if (!value) return '08:00';
    return value.slice(0, 5);
}

function Icon({ children }: { children: React.ReactNode }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {children}
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.25 12s3.5-6.25 9.75-6.25S21.75 12 21.75 12 18.25 18.25 12 18.25 2.25 12 2.25 12Z" />
            <circle cx="12" cy="12" r="2.75" />
        </svg>
    );
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [preference, setPreference] = useState<NotificationPreference | null>(null);
    const [filter, setFilter] = useState<FilterKey>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingPreference, setIsSavingPreference] = useState(false);
    const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            setIsLoading(true);
            setError(null);
            try {
                const [notificationData, preferenceData] = await Promise.all([
                    getNotifications(),
                    getNotificationPreference(),
                ]);
                if (cancelled) return;
                setNotifications(notificationData);
                setPreference(preferenceData);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('notifications:changed'));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Không thể tải thông báo.');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        loadData();
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredNotifications = useMemo(() => {
        if (filter === 'UNREAD') return notifications.filter((item) => !item.isRead);
        if (filter === 'READ') return notifications.filter((item) => item.isRead);
        return notifications;
    }, [filter, notifications]);

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    async function handleMarkRead(item: NotificationItem) {
        if (item.isRead) return;
        setPendingNotificationId(item.id);
        setError(null);
        try {
            const updated = await markNotificationRead(item.id);
            setNotifications((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('notifications:changed'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái đọc.');
        } finally {
            setPendingNotificationId(null);
        }
    }

    async function handlePreferenceChange(next: Partial<NotificationPreference>) {
        if (!preference) return;
        const nextPreference = { ...preference, ...next };
        setPreference(nextPreference);
        setIsSavingPreference(true);
        setError(null);
        try {
            const saved = await updateNotificationPreference({
                emailEnabled: nextPreference.emailEnabled,
                dailyReminderEnabled: nextPreference.dailyReminderEnabled,
                reminderTime: nextPreference.reminderTime.length === 5 ? `${nextPreference.reminderTime}:00` : nextPreference.reminderTime,
            });
            setPreference(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể lưu tùy chọn nhận tin.');
            setPreference(preference);
        } finally {
            setIsSavingPreference(false);
        }
    }

    return (
        <BaseUserLayout noContainer>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 font-normal">
                <section className="rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-sm md:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-wide text-[#4147D5]">Trung tâm thông báo</p>
                            <h1 className="mt-2 text-3xl font-semibold text-gray-950">Thông báo học tập</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                                Theo dõi phản hồi bình luận, cập nhật khóa học và nhắc học hằng ngày.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                <p className="text-xs font-medium text-gray-500">Tổng</p>
                                <p className="mt-1 text-2xl font-semibold text-gray-950">{notifications.length}</p>
                            </div>
                            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                                <p className="text-xs font-medium text-blue-600">Chưa đọc</p>
                                <p className="mt-1 text-2xl font-semibold text-blue-700">{unreadCount}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-950">Hộp thư</h2>
                                <p className="mt-1 text-sm text-gray-500">Danh sách thông báo được lấy từ dịch vụ notification.</p>
                            </div>

                            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                                {[
                                    { key: 'ALL', label: 'Tất cả' },
                                    { key: 'UNREAD', label: 'Chưa đọc' },
                                    { key: 'READ', label: 'Đã đọc' },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setFilter(item.key as FilterKey)}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                            filter === item.key
                                                ? 'bg-white text-[#4147D5] shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4 py-5">
                                {[0, 1, 2].map((item) => (
                                    <div key={item} className="h-28 animate-pulse rounded-xl bg-gray-100" />
                                ))}
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-base font-medium text-gray-900">Không có thông báo phù hợp</p>
                                <p className="mt-2 text-sm text-gray-500">Khi có thông báo mới, nội dung sẽ xuất hiện tại đây.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredNotifications.map((item) => {
                                    const type = typeMeta[item.type] ?? typeMeta.SYSTEM;

                                    return (
                                        <article key={item.id} className="relative flex gap-4 py-5 pr-12">
                                            <div className={`mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border ${type.tone}`}>
                                                <Icon>{type.icon}</Icon>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {!item.isRead && <span className="h-2.5 w-2.5 rounded-full bg-[#4147D5]" aria-label="Chưa đọc" />}
                                                            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${type.tone}`}>{type.label}</span>
                                                        </div>
                                                        <h3 className="mt-2 text-base font-semibold text-gray-950">{item.title}</h3>
                                                    </div>
                                                    <time className="flex-shrink-0 text-sm font-normal text-gray-400">{formatDateTime(item.createdAt)}</time>
                                                </div>

                                                <p className="mt-2 text-sm leading-6 text-gray-600">{item.message}</p>

                                                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-normal text-gray-500">
                                                    {item.relatedCourseId && <span className="rounded-full bg-gray-100 px-3 py-1.5">Khóa học: {item.relatedCourseId}</span>}
                                                    {item.relatedCommentId && <span className="rounded-full bg-gray-100 px-3 py-1.5">Bình luận: {item.relatedCommentId}</span>}
                                                    {item.readAt && <span className="rounded-full bg-gray-100 px-3 py-1.5">Đọc lúc {formatDateTime(item.readAt)}</span>}
                                                </div>
                                            </div>
                                            {!item.isRead && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkRead(item)}
                                                    disabled={pendingNotificationId === item.id}
                                                    className="absolute right-0 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#4147D5] transition-colors hover:border-[#4147D5] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    aria-label="Đánh dấu đã đọc"
                                                    title="Đánh dấu đã đọc"
                                                >
                                                    <EyeIcon />
                                                </button>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <aside className="flex flex-col gap-6">
                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-950">Tùy chọn nhận tin</h2>
                                    <p className="mt-1 text-sm leading-6 text-gray-500">Áp dụng cho email và nhắc học hằng ngày.</p>
                                </div>
                                {isSavingPreference && <span className="text-xs font-medium text-[#4147D5]">Đang lưu</span>}
                            </div>

                            <div className="mt-5 space-y-4">
                                <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                    <span>
                                        <span className="block text-sm font-medium text-gray-900">Nhận email</span>
                                        <span className="block text-xs text-gray-500">Bật gửi thông báo qua email</span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={preference?.emailEnabled ?? false}
                                        disabled={!preference}
                                        onChange={(event) => handlePreferenceChange({ emailEnabled: event.target.checked })}
                                        className="h-5 w-5 accent-[#4147D5]"
                                    />
                                </label>

                                <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                    <span>
                                        <span className="block text-sm font-medium text-gray-900">Nhắc học hằng ngày</span>
                                        <span className="block text-xs text-gray-500">Gửi lời nhắc theo giờ đã chọn</span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={preference?.dailyReminderEnabled ?? false}
                                        disabled={!preference}
                                        onChange={(event) => handlePreferenceChange({ dailyReminderEnabled: event.target.checked })}
                                        className="h-5 w-5 accent-[#4147D5]"
                                    />
                                </label>

                                <label className="block rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                    <span className="block text-sm font-medium text-gray-900">Giờ nhắc học</span>
                                    <span className="block text-xs text-gray-500">Thời điểm nhận nhắc học mỗi ngày</span>
                                    <input
                                        type="time"
                                        value={normalizeTimeForInput(preference?.reminderTime)}
                                        disabled={!preference}
                                        onChange={(event) => handlePreferenceChange({ reminderTime: event.target.value })}
                                        className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-[#4147D5] disabled:opacity-60"
                                    />
                                </label>
                            </div>
                        </section>

                    </aside>
                </div>
            </div>
        </BaseUserLayout>
    );
}
