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
    resendVerificationEmail,
    revokeSession,
    unlinkLinkedAccount,
    updateCurrentProfile,
    updateCurrentSettings,
    updateCurrentUser,
} from '@/features/auth/api';

type Tab = 'profile' | 'security';

type PersonalForm = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    birthDay: string;
    birthMonth: string;
    birthYear: string;
    gender: string;
    location: string;
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

const emptyPersonal: PersonalForm = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: '',
    location: '',
    bio: '',
};
const emptySettings: SettingsForm = { notificationEnabled: true, dailyReminderTime: '', emailNotifications: true, pushNotifications: true, themePreference: 'system', dailyGoalCourses: '' };
const PROFILE_GENDER_STORAGE_KEY = 'profileGender';

function splitDisplayName(displayName: string) {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts[parts.length - 1],
    };
}

function joinDisplayName(firstName: string, lastName: string) {
    return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ').trim();
}

function splitDateOfBirth(dateOfBirth: string | null | undefined) {
    if (!dateOfBirth) return { birthDay: '', birthMonth: '', birthYear: '' };

    const [birthYear = '', birthMonth = '', birthDay = ''] = dateOfBirth.split('-');
    return {
        birthDay: birthDay ? String(Number(birthDay)) : '',
        birthMonth: birthMonth ? String(Number(birthMonth)) : '',
        birthYear,
    };
}

function buildDateOfBirth({ birthDay, birthMonth, birthYear }: Pick<PersonalForm, 'birthDay' | 'birthMonth' | 'birthYear'>) {
    if (!birthDay && !birthMonth && !birthYear) return null;
    if (!/^\d{1,2}$/.test(birthDay) || !/^\d{1,2}$/.test(birthMonth) || !/^\d{4}$/.test(birthYear)) return null;

    const day = Number(birthDay);
    const month = Number(birthMonth);
    const year = Number(birthYear);

    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function sanitizeDatePart(value: string, maxLength: number) {
    return value.replace(/\D/g, '').slice(0, maxLength);
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
    const [verified, setVerified] = useState(false);
    const [sendingVerification, setSendingVerification] = useState(false);

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
                const fromApiHoc = profile.lastName?.trim() ?? '';
                const fromApiTen = profile.firstName?.trim() ?? '';
                const fromDisplay = splitDisplayName(profile.displayName ?? '');
                const dateParts = splitDateOfBirth(profile.dateOfBirth);
                const savedGender = window.localStorage.getItem(PROFILE_GENDER_STORAGE_KEY) ?? '';
                const apiGender = profile.gender?.trim() ?? '';
                setPersonal({
                    firstName: fromApiHoc || fromDisplay.firstName,
                    lastName: fromApiTen || fromDisplay.lastName,
                    username: user.username ?? '',
                    email: user.email ?? '',
                    birthDay: dateParts.birthDay,
                    birthMonth: dateParts.birthMonth,
                    birthYear: dateParts.birthYear,
                    gender: apiGender || savedGender,
                    location: profile.address ?? '',
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
                setVerified(user.verified);
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
            const nextDateOfBirth = buildDateOfBirth(personal);
            if (!nextDateOfBirth && (personal.birthDay || personal.birthMonth || personal.birthYear)) {
                setMessage('Vui lòng nhập đầy đủ ngày sinh theo định dạng DD / MM / YYYY.');
                return;
            }
            const [, nextProfile] = await Promise.all([
                updateCurrentUser({
                    username: personal.username || undefined,
                }),
                updateCurrentProfile({
                    lastName: personal.firstName.trim() || null,
                    firstName: personal.lastName.trim() || null,
                    dateOfBirth: nextDateOfBirth,
                    gender: personal.gender.trim() || null,
                    address: personal.location.trim() || null,
                    bio: personal.bio || null,
                }),
            ]);
            localStorage.setItem('userProfile', JSON.stringify(nextProfile));
            localStorage.setItem(PROFILE_GENDER_STORAGE_KEY, personal.gender);
            window.dispatchEvent(new Event('user-profile-updated'));
            setMessage('Đã cập nhật thông tin cá nhân.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể cập nhật thông tin.');
        }
    }

    async function sendVerification() {
        if (!personal.email || verified || sendingVerification) return;
        setMessage('');
        setSendingVerification(true);
        try {
            await resendVerificationEmail(personal.email);
            setMessage('Đã gửi lại email xác thực.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể gửi email xác thực.');
        } finally {
            setSendingVerification(false);
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

    const name = joinDisplayName(personal.firstName, personal.lastName) || personal.username || 'Medicology';

    return (
        <div className="flex h-screen bg-[#f7f8fa] overflow-hidden font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />
                <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
                    <div className="mx-auto max-w-[1080px] rounded-[8px] border border-gray-200 bg-white px-4 py-5 md:px-8">
                        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-[#eef0f2] p-1">
                            <button className={`rounded-2xl py-2 text-sm font-semibold ${tab === 'profile' ? 'bg-[#2aa4e8] text-white' : 'text-gray-600'}`} onClick={() => setTab('profile')}>Thông tin cá nhân</button>
                            <button className={`rounded-2xl py-2 text-sm font-semibold ${tab === 'security' ? 'bg-[#2aa4e8] text-white' : 'text-gray-600'}`} onClick={() => setTab('security')}>Cài đặt và bảo mật</button>
                        </div>

                        {loading ? <div className="py-20 text-center text-gray-500">Đang tải dữ liệu hồ sơ...</div> : (
                            <>
                                <div className="mb-4 flex flex-col gap-4 border-b border-gray-300 pb-4 md:flex-row md:items-center">
                                    <div className="relative h-[96px] w-[96px] shrink-0 rounded-full border border-gray-200 bg-[#fafafa]">
                                        <div className="absolute inset-0 flex items-center justify-center text-[#5b5b60]">
                                            <svg width="76" height="76" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h14c0-3.866-3.134-7-7-7Z" />
                                            </svg>
                                        </div>
                                        <button
                                            type="button"
                                            className="absolute bottom-1 left-1 rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h1 className="text-[28px] font-extrabold leading-tight text-[#364f75]">{name}</h1>
                                            <p className="text-[15px] text-gray-500">{personal.username ? `@${personal.username}` : 'Chưa có username'}</p>
                                        </div>
                                        <p className="flex items-center gap-2 text-sm text-gray-500">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                                <path d="M16 2v4M8 2v4M3 10h18" />
                                            </svg>
                                            {joinedAt ? `Tham gia từ ${joinedAt}` : 'Chưa có ngày tham gia'}
                                        </p>
                                    </div>
                                </div>

                                {!!message && <div className="mb-6 rounded-2xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm text-[#126b98]">{message}</div>}

                                {tab === 'profile' ? (
                                    <div className="space-y-5">
                                        <div className="border-t border-gray-300 pt-3">
                                            <p className="text-[11px] font-bold tracking-wide text-gray-600">*CÁC TRƯỜNG BẮT BUỘC</p>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field label="HỌ" value={personal.firstName} onChange={(value) => setPersonal({ ...personal, firstName: value })} />
                                            <Field label="TÊN" value={personal.lastName} onChange={(value) => setPersonal({ ...personal, lastName: value })} />
                                            <Field label="USERNAME*" value={personal.username} onChange={(value) => setPersonal({ ...personal, username: value })} />
                                            <Field
                                                label="EMAIL*"
                                                value={personal.email}
                                                onChange={() => undefined}
                                                disabled
                                                rightElement={
                                                    verified ? (
                                                        <span className="text-[11px] font-medium text-[#2aa4e8]">Đã xác thực</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={sendVerification}
                                                            disabled={sendingVerification}
                                                            className="text-[11px] font-medium text-[#2aa4e8] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {sendingVerification ? 'Đang gửi...' : 'Xác thực Email'}
                                                        </button>
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="grid items-end gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="mb-2 text-[11px] font-semibold text-gray-600">BIRTHDAY</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Field
                                                        value={personal.birthDay}
                                                        onChange={(value) => setPersonal({ ...personal, birthDay: sanitizeDatePart(value, 2) })}
                                                        placeholder="DD"
                                                        inputMode="numeric"
                                                    />
                                                    <Field
                                                        value={personal.birthMonth}
                                                        onChange={(value) => setPersonal({ ...personal, birthMonth: sanitizeDatePart(value, 2) })}
                                                        placeholder="MM"
                                                        inputMode="numeric"
                                                    />
                                                    <Field
                                                        value={personal.birthYear}
                                                        onChange={(value) => setPersonal({ ...personal, birthYear: sanitizeDatePart(value, 4) })}
                                                        placeholder="YYYY"
                                                        inputMode="numeric"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="mb-2 text-[11px] font-semibold text-gray-600">GIỚI TÍNH</p>
                                                <div className="relative">
                                                    <select
                                                        value={personal.gender}
                                                        onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                                                        className="h-10 w-full appearance-none rounded-[3px] border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#2aa4e8] focus:ring-2 focus:ring-[#2aa4e8]/15"
                                                    >
                                                        <option value="">Chọn giới tính</option>
                                                        <option value="male">Nam</option>
                                                        <option value="female">Nữ</option>
                                                    </select>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center border-l border-gray-200 text-gray-400">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Field label="ĐỊA CHỈ" value={personal.location} onChange={(value) => setPersonal({ ...personal, location: value })} />

                                        <label className="block">
                                            <span className="mb-2 block text-[11px] font-semibold text-gray-600">BIO</span>
                                            <textarea
                                                value={personal.bio}
                                                onChange={(e) => setPersonal({ ...personal, bio: e.target.value })}
                                                className="h-[88px] w-full rounded-[3px] border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#2aa4e8] focus:ring-2 focus:ring-[#2aa4e8]/15"
                                            />
                                        </label>
                                        <div className="flex justify-center">
                                            <Button className="h-10 rounded-[6px] bg-[#2aa4e8] px-8 text-[12px] font-semibold uppercase tracking-wide" onClick={saveProfile}>
                                                Lưu thay đổi
                                            </Button>
                                        </div>
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

function Field({
    label,
    value,
    onChange,
    type = 'text',
    disabled = false,
    placeholder,
    rightElement,
    inputMode,
}: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    type?: React.HTMLInputTypeAttribute;
    disabled?: boolean;
    placeholder?: string;
    rightElement?: React.ReactNode;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
    return (
        <label className="block">
            {label && <span className="mb-2 block text-[11px] font-semibold text-gray-600">{label}</span>}
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    inputMode={inputMode}
                    onChange={(e) => onChange(e.target.value)}
                    className={`h-10 w-full rounded-[3px] border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#2aa4e8] focus:ring-2 focus:ring-[#2aa4e8]/15 disabled:bg-gray-50 disabled:text-gray-500 ${rightElement ? 'pr-28' : ''}`}
                />
                {rightElement ? (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        {rightElement}
                    </div>
                ) : null}
            </div>
        </label>
    );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
    return <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-4 text-sm text-gray-700"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#2aa4e8]" />{label}</label>;
}
