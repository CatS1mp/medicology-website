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

export const ProfileScreen: React.FC = () => {
    const { handleLogout } = useLogout();
    const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
    const [personalForm, setPersonalForm] = useState<PersonalProfileForm>(mockProfile.personalForm);
    const [privacySettings, setPrivacySettings] = useState<PrivacySettingsForm>(mockProfile.privacySettings);
    const [passwordForm, setPasswordForm] = useState<PasswordForm>(mockProfile.passwordForm);

    return (
        <div className="flex h-screen bg-[#f7f8fa] overflow-hidden font-sans">
            <AppSidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={0} onLogout={handleLogout} />

                <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
                    <div className="max-w-[1000px] mx-auto bg-white border border-gray-200 rounded-[6px] px-6 py-4 md:px-8">
                        <div className="grid grid-cols-2 gap-1 bg-[#eef0f2] rounded-md p-1 mb-6">
                            <button
                                className={`rounded-[6px] py-1.5 text-[12px] font-semibold transition-colors ${activeTab === 'personal' ? 'bg-[#2aa4e8] text-white' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('personal')}
                            >
                                Thông tin cá nhân
                            </button>
                            <button
                                className={`rounded-[6px] py-1.5 text-[12px] font-semibold transition-colors ${activeTab === 'settings' ? 'bg-[#2aa4e8] text-white' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                Cài đặt
                            </button>
                        </div>

                        {activeTab === 'personal' ? (
                            <>
                                <div className="flex items-center gap-7 mb-5 px-1">
                                    <div className="w-[90px] h-[90px] rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                                            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h14c0-3.866-3.134-7-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-[42px] leading-[1.05] font-extrabold text-[#364f75]">{mockProfile.fullName}</h2>
                                        <p className="text-[26px] text-gray-500">{mockProfile.username}</p>
                                        <p className="text-sm text-gray-600 mt-1">{mockProfile.joinedAtLabel}</p>
                                    </div>
                                </div>
                                <ProfilePersonalTab form={personalForm} onChange={setPersonalForm} />
                            </>
                        ) : (
                            <ProfileSettingsTab
                                privacy={privacySettings}
                                password={passwordForm}
                                linkedAccounts={mockProfile.linkedAccounts}
                                onPrivacyChange={setPrivacySettings}
                                onPasswordChange={setPasswordForm}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
