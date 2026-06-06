'use client';

import { buildHeaders, requestApi } from '@/shared/api/http';

export type NotificationType =
    | 'COMMENT'
    | 'COURSE'
    | 'REMINDER'
    | 'SYSTEM'
    | 'DAILY_STUDY_REMINDER'
    | 'CALLING_BACK_REMINDER'
    | 'STREAK_RISK_REMINDER'
    | string;
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | string;

export interface NotificationItem {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedCommentId?: string | null;
    relatedCourseId?: string | null;
    isRead: boolean;
    createdAt: string;
    readAt?: string | null;
    deliveryStatus?: DeliveryStatus | null;
    sentAt?: string | null;
    failureReason?: string | null;
}

export interface NotificationPreference {
    userId: string;
    emailEnabled: boolean;
    dailyReminderEnabled: boolean;
    reminderTime: string;
}

export interface NotificationPreferenceUpdate {
    emailEnabled?: boolean;
    dailyReminderEnabled?: boolean;
    reminderTime?: string;
}

export interface NotificationCreatePayload {
    userId?: string;
    type: string;
    title: string;
    message: string;
    relatedCommentId?: string;
    relatedCourseId?: string;
}

export interface NotificationPage {
    content: NotificationItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
}

export interface NotificationPageParams {
    page?: number;
    size?: number;
    read?: boolean;
}

function toQueryString(params?: NotificationPageParams) {
    const query = new URLSearchParams();
    query.set('page', String(Math.max(0, (params?.page ?? 1) - 1)));
    query.set('size', String(params?.size ?? 10));
    if (params?.read !== undefined) query.set('read', String(params.read));
    return `?${query.toString()}`;
}

export function getNotifications(params?: NotificationPageParams) {
    return requestApi<NotificationPage>(`/api/notifications${toQueryString(params)}`);
}

export function getUnreadNotifications(params?: Omit<NotificationPageParams, 'read'>) {
    return requestApi<NotificationPage>(`/api/notifications/unread${toQueryString(params)}`);
}

export function getUnreadCount() {
    return requestApi<{ count: number }>('/api/notifications/unread/count');
}

export function markNotificationRead(id: string) {
    return requestApi<NotificationItem>(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: buildHeaders(),
    });
}

export function markNotificationUnread(id: string) {
    return requestApi<NotificationItem>(`/api/notifications/${id}/unread`, {
        method: 'PATCH',
        headers: buildHeaders(),
    });
}

export function createNotification(payload: NotificationCreatePayload) {
    return requestApi<NotificationItem>('/api/notifications', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
    });
}

export function getNotificationPreference() {
    return requestApi<NotificationPreference>('/api/notifications/preferences');
}

export function updateNotificationPreference(payload: NotificationPreferenceUpdate) {
    return requestApi<NotificationPreference>('/api/notifications/preferences', {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
    });
}
