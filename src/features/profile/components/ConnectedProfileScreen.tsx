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
                if (!cancelled) setMessage(error instanceof Error ? error.message : 'Khong the tai du lieu ho so.');
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
            setMessage('Da cap nhat thong tin ca nhan.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Khong the cap nhat thong tin.');
        }
    }

    async function saveSettings() {
        setMessage('');
        try {
            await updateCurrentSettings({ ...settings, dailyReminderTime: settings.dailyReminderTime || null, dailyGoalCourses: settings.dailyGoalCourses ? Number(settings.dailyGoalCourses) : null });
            setMessage('Da cap nhat cai dat.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Khong the cap nhat cai dat.');
        }
    }

    async function savePassword() {
        setMessage('');
        try {
            await changeCurrentPassword(password);
            setPassword({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setMessage('Da doi mat khau.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Khong the doi mat khau.');
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
                            <button className={`rounded-2xl py-2 text-sm font-semibold ${tab === 'profile' ? 'bg-[#2aa4e8] text-white' : 'text-gray-600'}`} onClick={() => setTab('profile')}>Thong tin ca nhan</button>
                            <button className={`rounded-2xl py-2 text-sm font-semibold ${tab === 'security' ? 'bg-[#2aa4e8] text-white' : 'text-gray-600'}`} onClick={() => setTab('security')}>Cai dat va bao mat</button>
                        </div>

                        {loading ? <div className="py-20 text-center text-gray-500">Dang tai du lieu ho so...</div> : (
                            <>
                                <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e6f4fd] text-2xl font-bold text-[#2aa4e8]">{name.slice(0, 2).toUpperCase()}</div>
                                    <div>
                                        <h1 className="text-3xl font-extrabold text-[#364f75]">{name}</h1>
                                        <p className="text-base text-gray-500">@{personal.username || 'unknown'}</p>
                                        <p className="text-sm text-gray-500">{joinedAt ? `Tham gia tu ${joinedAt}` : 'Chua co ngay tham gia'}</p>
                                    </div>
                                </div>

                                {!!message && <div className="mb-6 rounded-2xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm text-[#126b98]">{message}</div>}

                                {tab === 'profile' ? (
                                    <div className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field label="Ten hien thi" value={personal.displayName} onChange={(value) => setPersonal({ ...personal, displayName: value })} />
                                            <Field label="Username" value={personal.username} onChange={(value) => setPersonal({ ...personal, username: value })} />
                                            <Field label="Email" value={personal.email} onChange={() => undefined} disabled />
                                            <Field label="Ngay sinh" type="date" value={personal.dateOfBirth} onChange={(value) => setPersonal({ ...personal, dateOfBirth: value })} />
                                            <Field label="Dia diem" value={personal.location} onChange={(value) => setPersonal({ ...personal, location: value })} />
                                            <Field label="Avatar URL" value={personal.avatarUrl} onChange={(value) => setPersonal({ ...personal, avatarUrl: value })} />
                                        </div>
                                        <label className="block">
                                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Gioi thieu</span>
                                            <textarea value={personal.bio} onChange={(e) => setPersonal({ ...personal, bio: e.target.value })} className="min-h-[120px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2aa4e8]" />
                                        </label>
                                        <div className="flex justify-end"><Button onClick={saveProfile}>Luu thay doi</Button></div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <section className="rounded-3xl border border-gray-200 p-5">
                                            <h2 className="mb-4 text-xl font-bold text-gray-800">Thong bao va giao dien</h2>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Toggle label="Thong bao tong" checked={settings.notificationEnabled} onChange={(checked) => setSettings({ ...settings, notificationEnabled: checked })} />
                                                <Toggle label="Thong bao email" checked={settings.emailNotifications} onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })} />
                                                <Toggle label="Thong bao push" checked={settings.pushNotifications} onChange={(checked) => setSettings({ ...settings, pushNotifications: checked })} />
                                                <Field label="Gio nhac hoc hang ngay" type="time" value={settings.dailyReminderTime} onChange={(value) => setSettings({ ...settings, dailyReminderTime: value })} />
                                                <Field label="Theme" value={settings.themePreference} onChange={(value) => setSettings({ ...settings, themePreference: value as SettingsForm['themePreference'] })} />
                                                <Field label="Muc tieu khoa hoc moi ngay" type="number" value={settings.dailyGoalCourses} onChange={(value) => setSettings({ ...settings, dailyGoalCourses: value })} />
                                            </div>
                                            <div className="mt-4 flex justify-end"><Button onClick={saveSettings}>Luu cai dat</Button></div>
                                        </section>

                                        <section className="rounded-3xl border border-gray-200 p-5">
                                            <h2 className="mb-4 text-xl font-bold text-gray-800">Doi mat khau</h2>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <Field label="Mat khau hien tai" type="password" value={password.currentPassword} onChange={(value) => setPassword({ ...password, currentPassword: value })} />
                                                <Field label="Mat khau moi" type="password" value={password.newPassword} onChange={(value) => setPassword({ ...password, newPassword: value })} />
                                                <Field label="Xac nhan mat khau moi" type="password" value={password.confirmNewPassword} onChange={(value) => setPassword({ ...password, confirmNewPassword: value })} />
                                            </div>
                                            <div className="mt-4 flex justify-end"><Button onClick={savePassword}>Cap nhat mat khau</Button></div>
                                        </section>

                                        <section className="rounded-3xl border border-gray-200 p-5">
                                            <h2 className="mb-4 text-xl font-bold text-gray-800">Tai khoan lien ket</h2>
                                            <div className="space-y-3">
                                                {accounts.length === 0 && <p className="text-sm text-gray-500">Chua co tai khoan lien ket.</p>}
                                                {accounts.map((account) => (
                                                    <div key={account.provider} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
                                                        <div className="flex-1 text-sm text-gray-600"><div className="font-semibold text-gray-800">{account.provider}</div><div>{account.providerEmail || account.providerUserId}</div></div>
                                                        <Button variant="outline" onClick={async () => { await unlinkLinkedAccount(account.provider); setAccounts(accounts.filter((item) => item.provider !== account.provider)); }}>Ngat lien ket</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="rounded-3xl border border-gray-200 p-5">
                                            <h2 className="mb-4 text-xl font-bold text-gray-800">Phien dang nhap</h2>
                                            <div className="space-y-3">
                                                {sessions.length === 0 && <p className="text-sm text-gray-500">Khong co phien dang nhap nao.</p>}
                                                {sessions.map((session) => (
                                                    <div key={session.id} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
                                                        <div className="flex-1 text-sm text-gray-600">
                                                            <div className="font-semibold text-gray-800">{session.tokenPreview}</div>
                                                            <div>Tao luc: {new Date(session.createdAt).toLocaleString('vi-VN')}</div>
                                                            <div>Het han: {new Date(session.expiresAt).toLocaleString('vi-VN')}</div>
                                                        </div>
                                                        {!session.revoked && <Button variant="outline" onClick={async () => { await revokeSession(session.id); setSessions(sessions.filter((item) => item.id !== session.id)); }}>Thu hoi</Button>}
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
