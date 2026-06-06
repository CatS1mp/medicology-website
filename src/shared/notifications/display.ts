import type { NotificationItem } from '@/shared/api/notifications';

/** Bản dịch nội dung thông báo cũ (không dấu / tiếng Anh) khi hiển thị. */
const LEGACY_NOTIFICATION_TEXT: Record<string, string> = {
    'Reminder skipped': 'Đã bỏ qua nhắc học',
    'Reminder already created today.': 'Hôm nay đã tạo nhắc học rồi.',
    'Streak reminder skipped': 'Đã bỏ qua nhắc streak',
    'User already studied today or has no active streak.':
        'Người dùng đã học hôm nay hoặc chưa có streak đang hoạt động.',
    'Ban khong co quyen gui email cho nguoi dung khac.': 'Bạn không có quyền gửi email cho người dùng khác.',
    'Can cung cap email khi admin gui cho user khac.':
        'Cần cung cấp email khi quản trị viên gửi cho người dùng khác.',
    'Khong tim thay email nguoi nhan.': 'Không tìm thấy email người nhận.',
    'SendGrid is not configured.': 'SendGrid chưa được cấu hình.',
    'SendGrid rejected the email.': 'SendGrid từ chối gửi email.',
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
    COMMENT: 'Bình luận',
    COURSE: 'Khóa học',
    REMINDER: 'Nhắc học',
    SYSTEM: 'Hệ thống',
    DAILY_STUDY_REMINDER: 'Nhắc học hằng ngày',
    STREAK_RISK_REMINDER: 'Cảnh báo streak',
    CALLING_BACK_REMINDER: 'Nhắc quay lại học',
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
    PENDING: 'Đang chờ gửi',
    SENT: 'Đã gửi email',
    FAILED: 'Gửi email thất bại',
    SKIPPED: 'Đã bỏ qua',
};

export function localizeNotificationText(text: string): string {
    const trimmed = text.trim();
    return LEGACY_NOTIFICATION_TEXT[trimmed] ?? trimmed;
}

export function getNotificationTypeLabel(type: string): string {
    return NOTIFICATION_TYPE_LABELS[type] ?? NOTIFICATION_TYPE_LABELS.SYSTEM;
}

export function getDeliveryStatusLabel(status?: string | null): string | null {
    if (!status) return null;
    return DELIVERY_STATUS_LABELS[status] ?? status;
}

export function formatNotificationForDisplay(item: NotificationItem): NotificationItem {
    return {
        ...item,
        title: localizeNotificationText(item.title),
        message: localizeNotificationText(item.message),
        failureReason: item.failureReason ? localizeNotificationText(item.failureReason) : item.failureReason,
    };
}
