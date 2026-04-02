import React from 'react';
import { LinkedAccount, PasswordForm, PrivacySettingsForm } from '../types';
import { Button } from '@/shared/components/Button';

interface ProfileSettingsTabProps {
    privacy: PrivacySettingsForm;
    password: PasswordForm;
    linkedAccounts: LinkedAccount[];
    onPrivacyChange: (next: PrivacySettingsForm) => void;
    onPasswordChange: (next: PasswordForm) => void;
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
    privacy,
    password,
    linkedAccounts,
    onPrivacyChange,
    onPasswordChange,
}) => {
    return (
        <div className="space-y-7">
            <section className="text-center border-b border-gray-200 pb-7">
                <h3 className="text-[38px] font-semibold text-gray-700 mb-4">Quyền riêng tư</h3>
                <div className="max-w-3xl mx-auto text-left space-y-4">
                    <CheckboxRow
                        title="Quyền riêng tư của hồ sơ"
                        description="Quyết định ai có thể theo dõi, xem hồ sơ và tiến trình học tập của bạn."
                        checked={privacy.isPrivateProfile}
                        onChange={(checked) => onPrivacyChange({ ...privacy, isPrivateProfile: checked })}
                    />
                    <CheckboxRow
                        title="Tuổi và giới tính"
                        description="Tùy chọn này sẽ ẩn nhóm tuổi và giới tính của bạn khỏi các học viên khác."
                        checked={privacy.hideAgeAndGender}
                        onChange={(checked) => onPrivacyChange({ ...privacy, hideAgeAndGender: checked })}
                    />
                </div>
                <div className="mt-6">
                    <Button className="h-9 px-8 bg-[#2aa4e8] text-[12px]">LƯU THAY ĐỔI</Button>
                </div>
            </section>

            <section className="border-b border-gray-200 pb-7">
                <h3 className="text-[38px] font-semibold text-center text-gray-700 mb-4">Đổi mật khẩu</h3>
                <div className="space-y-3">
                    <PasswordField label="Mật khẩu hiện tại" value={password.currentPassword} onChange={(v) => onPasswordChange({ ...password, currentPassword: v })} />
                    <div className="grid grid-cols-2 gap-3">
                        <PasswordField label="Mật khẩu mới" value={password.newPassword} onChange={(v) => onPasswordChange({ ...password, newPassword: v })} />
                        <PasswordField label="Xác nhận mật khẩu mới" value={password.confirmNewPassword} onChange={(v) => onPasswordChange({ ...password, confirmNewPassword: v })} />
                    </div>
                </div>
                <div className="mt-5 text-center">
                    <Button className="h-9 px-8 bg-[#2aa4e8] text-[12px]">LƯU THAY ĐỔI</Button>
                    <p className="text-xs text-gray-600 mt-4">Bạn sẽ cần đăng nhập lại bằng mật khẩu mới sau khi lưu thay đổi.</p>
                </div>
            </section>

            <section>
                <h3 className="text-[38px] font-semibold text-center text-gray-700 mb-5">Tài khoản liên kết</h3>
                <div className="space-y-5">
                    {linkedAccounts.map((item) => (
                        <div key={item.provider}>
                            <p className="text-[30px] leading-tight font-medium text-gray-700">Kết nối với {item.provider}</p>
                            <p className="text-sm text-gray-600 max-w-2xl">{item.description}</p>
                            <div className="mt-2 text-sm">
                                {item.status && <span className="text-gray-500 mr-2">{item.status}</span>}
                                <button className="text-pink-500 font-semibold">{item.actionText}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

interface CheckboxRowProps {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const CheckboxRow: React.FC<CheckboxRowProps> = ({ title, description, checked, onChange }) => {
    return (
        <div>
            <p className="text-[28px] leading-tight font-medium text-gray-700">{title}</p>
            <p className="text-sm text-gray-600 mb-2 max-w-2xl">{description}</p>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <span>Tùy chọn này sẽ ẩn thông tin của bạn.</span>
            </label>
        </div>
    );
};

interface PasswordFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, onChange }) => {
    return (
        <div>
            <p className="text-[11px] font-semibold text-gray-600 mb-2">{label}</p>
            <input
                type="password"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 px-3 rounded-[3px] border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2aa4e8]"
            />
        </div>
    );
};
