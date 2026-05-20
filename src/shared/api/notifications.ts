'use client';

import { buildHeaders, requestApi } from '@/shared/api/http';

export type NotificationType = 'COMMENT' | 'COURSE' | 'REMINDER' | 'SYSTEM' | string;
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

export function getNotifications() {
    return requestApi<NotificationItem[]>('/api/notifications');
}

export function getUnreadNotifications() {
    return requestApi<NotificationItem[]>('/api/notifications/unread');
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
