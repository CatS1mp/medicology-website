import { ProfileMockData } from '../types';

export const mockProfile: ProfileMockData = {
    fullName: 'Trần Văn A',
    username: '@username01',
    joinedAtLabel: 'Tham gia từ 11/2023',
    personalForm: {
        firstName: 'Trần Văn',
        lastName: 'A',
        username: '@username01',
        email: 'hello@gmail.com',
        birthDay: '19',
        birthMonth: '11',
        birthYear: '2005',
        gender: '',
        address: 'Thành phố Hồ Chí Minh',
        bio: 'Giới thiệu bản thân',
    },
    privacySettings: {
        isPrivateProfile: false,
        hideAgeAndGender: false,
    },
    passwordForm: {
        currentPassword: '**********',
        newPassword: '**********',
        confirmNewPassword: '**********',
    },
    linkedAccounts: [
        {
            provider: 'Facebook',
            description: 'Tìm bạn bè trên Facebook cũng đang học tập tại Medicology.',
            status: 'Bạn đã kết nối.',
            actionText: 'Ngắt kết nối',
        },
        {
            provider: 'Google',
            description: 'Đăng nhập nhanh chóng và an toàn, đồng thời đồng bộ tiến trình học tập.',
            status: '',
            actionText: 'Liên kết ngay >',
        },
    ],
};
