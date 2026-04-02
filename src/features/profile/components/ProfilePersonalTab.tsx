import React from 'react';
import { PersonalProfileForm } from '../types';
import { Button } from '@/shared/components/Button';

interface ProfilePersonalTabProps {
    form: PersonalProfileForm;
    onChange: (next: PersonalProfileForm) => void;
}

export const ProfilePersonalTab: React.FC<ProfilePersonalTabProps> = ({ form, onChange }) => {
    const update = (key: keyof PersonalProfileForm, value: string) => {
        onChange({ ...form, [key]: value });
    };

    return (
        <div className="space-y-5">
            <div className="border-t border-gray-300 pt-3">
                <p className="text-[11px] font-bold text-gray-600 tracking-wide">*CÁC TRƯỜNG BẮT BUỘC</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="HỌ" value={form.firstName} onChange={(v) => update('firstName', v)} />
                <Field label="TÊN" value={form.lastName} onChange={(v) => update('lastName', v)} />
                <Field label="USERNAME*" value={form.username} onChange={(v) => update('username', v)} />
                <Field label="EMAIL*" value={form.email} onChange={(v) => update('email', v)} />
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-4 items-end">
                <div>
                    <p className="text-[11px] font-semibold text-gray-600 mb-2">NGÀY SINH</p>
                    <div className="grid grid-cols-3 gap-2">
                        <Field value={form.birthDay} onChange={(v) => update('birthDay', v)} />
                        <Field value={form.birthMonth} onChange={(v) => update('birthMonth', v)} />
                        <Field value={form.birthYear} onChange={(v) => update('birthYear', v)} />
                    </div>
                </div>
                <div>
                    <p className="text-[11px] font-semibold text-gray-600 mb-2">GIỚI TÍNH</p>
                    <div className="relative">
                        <input
                            value={form.gender}
                            onChange={(e) => update('gender', e.target.value)}
                            className="w-full h-10 px-3 rounded-[3px] border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2aa4e8]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌄</span>
                    </div>
                </div>
            </div>

            <Field label="ĐỊA CHỈ" value={form.address} onChange={(v) => update('address', v)} />

            <div>
                <p className="text-[11px] font-semibold text-gray-600 mb-2">GIỚI THIỆU</p>
                <textarea
                    value={form.bio}
                    onChange={(e) => update('bio', e.target.value)}
                    className="w-full h-[88px] px-3 py-2 rounded-[3px] border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2aa4e8]"
                />
            </div>

            <div className="flex justify-center">
                <Button className="px-8 h-9 bg-[#2aa4e8] text-[12px]">LƯU THAY ĐỔI</Button>
            </div>
        </div>
    );
};

interface FieldProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange }) => {
    return (
        <div>
            {label && <p className="text-[11px] font-semibold text-gray-600 mb-2">{label}</p>}
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 px-3 rounded-[3px] border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2aa4e8]"
            />
        </div>
    );
};
