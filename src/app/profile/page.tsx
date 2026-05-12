import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ProfileScreen = dynamic(() => import('@/features/profile').then((mod) => mod.ProfileScreen));

export const metadata: Metadata = {
    title: 'Hồ sơ cá nhân - Medicology',
    description: 'Quản lý thông tin cá nhân và cài đặt tài khoản',
};

export default function ProfilePage() {
    return <ProfileScreen />;
}
