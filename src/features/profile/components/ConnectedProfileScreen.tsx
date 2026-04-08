'use client';

import React, { useEffect, useState } from 'react';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { Button } from '@/shared/components/Button';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import {
    changeCurrentPassword,
    getCurrentProfile,
    getCurrentSettings,
    getCurrentUser,
    getLinkedAccounts,
    getSessions,
    revokeSession,
    unlinkLinkedAccount,
    updateCurrentProfile,
    updateCurrentSettings,
    updateCurrentUser,
} from '@/features/auth/api';

type Tab = 'profile' | 'security';

type PersonalForm = {
    username: string;
    email: string;
    dateOfBirth: string;
    location: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
};

type SettingsForm = {
    notificationEnabled: boolean;
    dailyReminderTime: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    themePreference: 'light' | 'dark' | 'system';
    dailyGoalCourses: string;
};

const emptyPersonal: PersonalForm = { username: '', email: '', dateOfBirth: '', location: '', displayName: '', avatarUrl: '', bio: '' };
const emptySettings: SettingsForm = { notificationEnabled: true, dailyReminderTime: '', emailNotifications: true, pushNotifications: true, themePreference: 'system', dailyGoalCourses: '' };

function getDisplayInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'M';
}

export function ConnectedProfileScreen() {
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const [tab, setTab] = useState<Tab>('profile');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [personal, setPersonal] = useState<PersonalForm>(emptyPersonal);
    const [settings, setSettings] = useState<SettingsForm>(emptySettings);
    const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [sessions, setSessions] = useState<Array<{ id: string; tokenPreview: string; createdAt: string; expiresAt: string; revoked: boolean }>>([]);
    const [accounts, setAccounts] = useState<Array<{ provider: string; providerEmail: string | null; providerUserId: string }>>([]);
    const [joinedAt, setJoinedAt] = useState('');

    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const [user, profile, currentSettings, linkedAccounts, currentSessions] = await Promise.all([
                    getCurrentUser(),
                    getCurrentProfile(),
                    getCurrentSettings(),
                    getLinkedAccounts(),
                    getSessions(),
                ]);
                if (cancelled) return;
                setPersonal({
                    username: user.username ?? '',
                    email: user.email ?? '',
                    dateOfBirth: user.dateOfBirth ?? '',
                    location: user.location ?? '',
                    displayName: profile.displayName ?? '',
                    avatarUrl: profile.avatarUrl ?? '',
                    bio: profile.bio ?? '',
                });
                setSettings({
                    notificationEnabled: currentSettings.notificationEnabled,
                    dailyReminderTime: currentSettings.dailyReminderTime ?? '',
                    emailNotifications: currentSettings.emailNotifications,
                    pushNotifications: currentSettings.pushNotifications,
                    themePreference: currentSettings.themePreference ?? 'system',
                    dailyGoalCourses: currentSettings.dailyGoalCourses ? String(currentSettings.dailyGoalCourses) : '',
                });
                setAccounts(linkedAccounts);
                setSessions(currentSessions);
                setJoinedAt(user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : '');
            } catch (error) {
                if (!cancelled) setMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu hồ sơ.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, []);

    async function saveProfile() {
        setMessage('');
        try {
            const [, nextProfile] = await Promise.all([
                updateCurrentUser({ username: personal.username || undefined, dateOfBirth: personal.dateOfBirth || null, location: personal.location || null }),
                updateCurrentProfile({ displayName: personal.displayName || null, avatarUrl: personal.avatarUrl || null, bio: personal.bio || null }),
            ]);
            localStorage.setItem('userProfile', JSON.stringify(nextProfile));
            window.dispatchEvent(new Event('user-profile-updated'));
            setMessage('Đã cập nhật thông tin cá nhân.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể cập nhật thông tin.');
        }
    }

    async function saveSettings() {
        setMessage('');
        try {
            await updateCurrentSettings({ ...settings, dailyReminderTime: settings.dailyReminderTime || null, dailyGoalCourses: settings.dailyGoalCourses ? Number(settings.dailyGoalCourses) : null });
            setMessage('Đã cập nhật cài đặt.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể cập nhật cài đặt.');
        }
    }

    async function savePassword() {
        setMessage('');
        try {
            await changeCurrentPassword(password);
            setPassword({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setMessage('Đã đổi mật khẩu.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.');
        }
    }

    const name = personal.displayName || personal.username || 'Medicology';

    return (
        <div className="flex h-screen bg-[#f7f8fa] overflow-hidden font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />
                <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
                    <div className="mx-auto max-w-[1080px] rounded-3xl border border-gray-200 bg-white px-6 py-6 md:px-8">
                        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-[#eef0f2] p-1">
                            <button className={`rounded-2xl py-2 text-sm font-semibold ${tab === 'profile' ? 'bg-[#2aa4e8] text-white' : 'text-gray-600'}`} onClick={() => setTab('profile')}>Thông tin cá nhân</button>
                            <button className={`rounded-2xl py-2 text-sm font-semibold ${tab === 'security' ? 'bg-[#2aa4e8] text-white' : 'text-gray-600'}`} onClick={() => setTab('security')}>Cài đặt và bảo mật</button>
                        </div>

                        {loading ? <div className="py-20 text-center text-gray-500">Đang tải dữ liệu hồ sơ...</div> : (
                            <>
                                <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e6f4fd] text-2xl font-bold text-[#2aa4e8]">{getDisplayInitials(name)}</div>
                                    <div>
                                        <h1 className="text-3xl font-extrabold text-[#364f75]">{name}</h1>
                                        <p className="text-base text-gray-500">{personal.username ? `@${personal.username}` : 'Chưa có username'}</p>
                                        <p className="text-sm text-gray-500">{joinedAt ? `Tham gia từ ${joinedAt}` : 'Chưa có ngày tham gia'}</p>
                                    </div>
                                </div>

                                {!!message && <div className="mb-6 rounded-2xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm text-[#126b98]">{message}</div>}

                                {tab === 'profile' ? (
                                    <div className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field label="Tên hiển thị" value={personal.displayName} onChange={(value) => setPersonal({ ...personal, displayName: value })} />
                                            <Field label="Username" value={personal.username} onChange={(value) => setPersonal({ ...personal, username: value })} />
                                            <Field label="Email" value={personal.email} onChange={() => undefined} disabled />
                                            <Field label="Ngày sinh" type="date" value={personal.dateOfBirth} onChange={(value) => setPersonal({ ...personal, dateOfBirth: value })} />
                                            <Field label="Địa điểm" value={personal.location} onChange={(value) => setPersonal({ ...personal, location: value })} />
                                            <Field label="Avatar URL" value={personal.avatarUrl} onChange={(value) => setPersonal({ ...personal, avatarUrl: value })} />
                                        </div>
                                        <label className="block">
                                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Giới thiệu</span>
                                            <textarea value={personal.bio} onChange={(e) => setPersonal({ ...personal, bio: e.target.value })} className="min-h-[120px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2aa4e8]" />
                                        </label>
                                        <div className="flex justify-end"><Button onClick={saveProfile}>Lưu thay đổi</Button></div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <section className="rounded-3xl border border-gray-200 p-5">
                                            <h2 className="mb-4 text-xl font-bold text-gray-800">Thông báo và giao diện</h2>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Toggle label="Thông báo tổng" checked={settings.notificationEnabled} onChange={(checked) => setSettings({ ...settings, notificationEnabled: checked })} />
                                                <Toggle label="Thông báo email" checked={settings.emailNotifications} onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })} />
                                                <Toggle label="Thông báo push" checked={settings.pushNotifications} onChange={(checked) => setSettings({ ...settings, pushNotifications: checked })} />
                                                <Field label="Giờ nhắc học hằng ngày" type="time" value={settings.dailyReminderTime} onChange={(value) => setSettings({ ...settings, dailyReminderTime: value })} />
                                                <Field label="Theme" value={settings.themePreference} onChange={(value) => setSettings({ ...settings, themePreference: value as SettingsForm['themePreference'] })} />
                                                <Field label="Mục tiêu khóa học mỗi ngày" type="number" value={settings.dailyGoalCourses} onChange={(value) => setSettings({ ...settings, dailyGoalCourses: value })} />
                                            </div>
                                            <div className="mt-4 flex justify-end"><Button onClick={saveSettings}>Lưu cài đặt</Button></div>
                                        </section>

                                        <section className="rounded-3xl border border-gray-200 p-5">
                                            <h2 className="mb-4 text-xl font-bold text-gray-800">Đổi mật khẩu</h2>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <Field label="Mật khẩu hiện tại" type="password" value={password.currentPassword} onChange={(value) => setPassword({ ...password, currentPassword: value })} />
                                                <Field label="Mật khẩu mới" type="password" value={password.newPassword} onChange={(value) => setPassword({ ...password, newPassword: value })} />
                                                <Field label="Xác nhận mật khẩu mới" type="password" value={password.confirmNewPassword} onChange={(value) => setPassword({ ...password, confirmNewPassword: value })} />
                                            </div>
                                            <div className="mt-4 flex justify-end"><Button onClick={savePassword}>Cập nhật mật khẩu</Button></div>
                                        </section>

                                        <section className="rounded-3xl border border-gray-200 p-5">
                                            <h2 className="mb-4 text-xl font-bold text-gray-800">Tài khoản liên kết</h2>
                                            <div className="space-y-3">
                                                {accounts.length === 0 && <p className="text-sm text-gray-500">Chưa có tài khoản liên kết.</p>}
                                                {accounts.map((account) => (
                                                    <div key={account.provider} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
                                                        <div className="flex-1 text-sm text-gray-600"><div className="font-semibold text-gray-800">{account.provider}</div><div>{account.providerEmail || account.providerUserId}</div></div>
                                                        <Button variant="outline" onClick={async () => { await unlinkLinkedAccount(account.provider); setAccounts(accounts.filter((item) => item.provider !== account.provider)); }}>Ngắt liên kết</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="rounded-3xl border border-gray-200 p-5">
                                            <h2 className="mb-4 text-xl font-bold text-gray-800">Phiên đăng nhập</h2>
                                            <div className="space-y-3">
                                                {sessions.length === 0 && <p className="text-sm text-gray-500">Không có phiên đăng nhập nào.</p>}
                                                {sessions.map((session) => (
                                                    <div key={session.id} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
                                                        <div className="flex-1 text-sm text-gray-600">
                                                            <div className="font-semibold text-gray-800">{session.tokenPreview}</div>
                                                            <div>Tạo lúc: {new Date(session.createdAt).toLocaleString('vi-VN')}</div>
                                                            <div>Hết hạn: {new Date(session.expiresAt).toLocaleString('vi-VN')}</div>
                                                        </div>
                                                        {!session.revoked && <Button variant="outline" onClick={async () => { await revokeSession(session.id); setSessions(sessions.filter((item) => item.id !== session.id)); }}>Thu hồi</Button>}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: React.HTMLInputTypeAttribute; disabled?: boolean }) {
    return <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span><input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm text-gray-700 outline-none focus:border-[#2aa4e8] disabled:bg-gray-100 disabled:text-gray-400" /></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
    return <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-4 text-sm text-gray-700"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#2aa4e8]" />{label}</label>;
}
