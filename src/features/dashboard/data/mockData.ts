import type {
    UserInfo,
    StatCard,
    ChartDataPoint,
    CourseCard,
    LearningResultPoint,
    LearningProgressItem,
} from '../types';

export const mockUser: UserInfo = {
    name: 'Name',
    avatarInitials: 'N',
    streak: 17,
    score: 8.5,
    totalLessons: 42,
};

export const mockStatCards: StatCard[] = [
    {
        id: 'streak',
        icon: '🔥',
        value: 17,
        label: 'Chuỗi ngày học',
        color: 'text-orange-500',
    },
    {
        id: 'score',
        icon: '⭐',
        value: '8.5/10',
        label: 'Điểm đánh giá năng lực',
        color: 'text-yellow-500',
    },
    {
        id: 'lessons',
        icon: '💧',
        value: 42,
        label: 'Số bài học đã hoàn thành',
        color: 'text-blue-500',
    },
];

export const mockWeeklyChartData: ChartDataPoint[] = [
    { day: 'Thứ 2', date: '03/03/2026', value: 3 },
    { day: 'Thứ 3', date: '04/03/2026', value: 5 },
    { day: 'Thứ 4', date: '05/03/2026', value: 4 },
    { day: 'Thứ 5', date: '06/03/2026', value: 6 },
    { day: 'Thứ 6', date: '07/03/2026', value: 5 },
    { day: 'Thứ 7', date: '08/03/2026', value: 7 },
    { day: 'Chủ Nhật', date: '09/03/2026', value: 4 },
];

export const mockCourseCards: CourseCard[] = [
    {
        id: 'c1',
        category: 'SƠ CỨU',
        categoryColor: '#EF4444',
        title: 'Kỹ Năng Sơ Cứu Vết Thương Hở Tại Nhà',
        nextLesson: 'Sơ cứu học di vật',
        progress: 60,
        total: 5,
        completed: 3,
    },
    {
        id: 'c2',
        category: 'DINH DƯỠNG',
        categoryColor: '#F59E0B',
        title: 'Xây Dựng Chế Độ Ăn: Hiểu Đúng Về Calo Và Các Nhóm Chất.',
        nextLesson: 'Các loại vitamin',
        progress: 60,
        total: 5,
        completed: 3,
    },
    {
        id: 'c3',
        category: 'TÂM LÝ HỌC',
        categoryColor: '#8B5CF6',
        title: 'Nhận Diện Và Chăm Sóc Sức Khỏe Tinh Thần',
        nextLesson: 'Trầm cảm ảnh hưởng như thế nào?',
        progress: 60,
        total: 5,
        completed: 3,
    },
];

export const mockLearningResults: LearningResultPoint[] = [
    { label: 'T2', actual: 6, target: 8 },
    { label: 'T3', actual: 7, target: 8 },
    { label: 'T4', actual: 5, target: 8 },
    { label: 'T5', actual: 8.5, target: 8 },
    { label: 'T6', actual: 7.5, target: 8 },
    { label: 'T7', actual: 9, target: 8 },
];

export const mockLearningProgress: LearningProgressItem[] = [
    {
        id: 'tim-mach',
        subject: 'Tim mạch học',
        completed: 24,
        total: 30,
        color: '#EF4444',
        icon: '❤️',
    },
    {
        id: 'than-kinh',
        subject: 'Thần kinh học',
        completed: 18,
        total: 25,
        color: '#6366F1',
        icon: '🧠',
    },
    {
        id: 'duoc-ly',
        subject: 'Dược lý học',
        completed: 15,
        total: 20,
        color: '#10B981',
        icon: '💊',
    },
    {
        id: 'vi-sinh',
        subject: 'Vi sinh vật',
        completed: 8,
        total: 15,
        color: '#3B82F6',
        icon: '🔬',
    },
    {
        id: 'giai-phau',
        subject: 'Giải phẫu học',
        completed: 12,
        total: 28,
        color: '#F59E0B',
        icon: '🦴',
    },
];
