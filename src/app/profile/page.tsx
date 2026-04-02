import { ProfileScreen } from '@/features/profile';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hồ sơ cá nhân - Medicology',
    description: 'Quản lý thông tin cá nhân và cài đặt tài khoản',
};

export default function ProfilePage() {
    return <ProfileScreen />;
}
