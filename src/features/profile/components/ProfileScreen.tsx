'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { useLogout } from '@/shared/hooks/useLogout';
import { mockProfile } from '../data/mockProfile';
import { PasswordForm, PersonalProfileForm, PrivacySettingsForm } from '../types';
import { ProfilePersonalTab } from './ProfilePersonalTab';
import { ProfileSettingsTab } from './ProfileSettingsTab';

type ProfileTab = 'personal' | 'settings';

import { BaseUserLayout } from '@/shared/components/BaseUserLayout';

export const ProfileScreen: React.FC = () => {
    const { handleLogout } = useLogout();
    const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
    const [personalForm, setPersonalForm] = useState<PersonalProfileForm>(mockProfile.personalForm);
    const [privacySettings, setPrivacySettings] = useState<PrivacySettingsForm>(mockProfile.privacySettings);
    const [passwordForm, setPasswordForm] = useState<PasswordForm>(mockProfile.passwordForm);

    return (
        <BaseUserLayout streak={0}>
            <div className="max-w-[1000px] mx-auto min-h-full">
                <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-2xl p-1.5 mb-8">
                    <button
                        className={`rounded-xl py-2.5 text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-[#1CA1F2] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        Thông tin cá nhân
                    </button>
                    <button
                        className={`rounded-xl py-2.5 text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-[#1CA1F2] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Cài đặt
                    </button>
                </div>

                {activeTab === 'personal' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 px-2">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-50 shadow-sm flex items-center justify-center overflow-hidden">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h14c0-3.866-3.134-7-7-7z" />
                                </svg>
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-1">{mockProfile.fullName}</h2>
                                <p className="text-xl text-[#1CA1F2] font-semibold">{mockProfile.username}</p>
                                <p className="text-sm text-gray-500 mt-2 font-medium bg-gray-50 inline-block px-3 py-1 rounded-full">{mockProfile.joinedAtLabel}</p>
                            </div>
                        </div>
                        <ProfilePersonalTab form={personalForm} onChange={setPersonalForm} />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ProfileSettingsTab
                            privacy={privacySettings}
                            password={passwordForm}
                            linkedAccounts={mockProfile.linkedAccounts}
                            onPrivacyChange={setPrivacySettings}
                            onPasswordChange={setPasswordForm}
                        />
                    </div>
                )}
            </div>
        </BaseUserLayout>
    );
};
