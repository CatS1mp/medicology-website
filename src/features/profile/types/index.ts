export interface PersonalProfileForm {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    birthDay: string;
    birthMonth: string;
    birthYear: string;
    gender: string;
    address: string;
    bio: string;
}

export interface PrivacySettingsForm {
    isPrivateProfile: boolean;
    hideAgeAndGender: boolean;
}

export interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface LinkedAccount {
    provider: string;
    description: string;
    status: string;
    actionText: string;
}

export interface ProfileMockData {
    fullName: string;
    username: string;
    joinedAtLabel: string;
    personalForm: PersonalProfileForm;
    privacySettings: PrivacySettingsForm;
    passwordForm: PasswordForm;
    linkedAccounts: LinkedAccount[];
}
