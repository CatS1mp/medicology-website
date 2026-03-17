import { RoadmapData } from '../types';

// These are the courses the user has enrolled in; will come from API later
export const enrolledCourses = [
    { slug: 'cham-soc-khan-cap', label: 'Tâm thần học' },
    { slug: 'suc-khoe-tinh-than', label: 'Sức khoẻ tinh thần' },
    { slug: 'so-cuu-cap-cuu', label: 'Sơ cứu & Cấp cứu' },
];

export const mockRoadmapData: Record<string, RoadmapData> = {
'cham-soc-khan-cap': {
    topicTitle: 'Tâm thần học',
    progress: {
        current: 7,
        total: 26,
    },
    streak: {
        days: 17, // Set to 17 per user request
        message: 'Bạn đang xây dựng một thói quen học tập vững chắc. Tiếp tục phát huy nhé!',
    },
    sections: [
        {
            id: 's1',
            title: 'Sốc phản vệ',
            nodes: [
                {
                    id: 'n1',
                    title: 'Nhận biết Sốc phản vệ',
                    status: 'completed',
                    type: 'lesson',
                    score: { current: 8, max: 10 }
                },
                {
                    id: 'n2',
                    title: 'Tiêm Epinephrine',
                    status: 'completed',
                    type: 'lesson',
                    score: { current: 7, max: 8 }
                },
                {
                    id: 'n3',
                    title: 'Điều trị nâng cao',
                    status: 'active',
                    type: 'lesson'
                },
                {
                    id: 'n4',
                    title: 'Kiểm tra Chương',
                    status: 'next',
                    type: 'test',
                    description: '15 câu hỏi - yêu cầu ≥ 70%'
                }
            ]
        },
        {
            id: 's2',
            title: 'Hồi sức tim phổi (CPR)',
            nodes: [
                {
                    id: 'n5',
                    title: 'Khi nào cần thực hiện CPR',
                    status: 'active',
                    type: 'lesson'
                },
                {
                    id: 'n6',
                    title: 'Kỹ thuật Ép tim ngoài lồng ngực',
                    status: 'locked',
                    type: 'lesson',
                    score: { current: 0, max: 10 }
                },
                {
                    id: 'n7',
                    title: 'Hô hấp nhân tạo',
                    status: 'locked',
                    type: 'lesson',
                    score: { current: 0, max: 8 }
                },
                {
                    id: 'n8',
                    title: 'Kiểm tra Chương',
                    status: 'locked',
                    type: 'test',
                    description: '15 câu hỏi - yêu cầu ≥ 70%'
                }
            ],
            hasDividerAfter: {
                title: 'TÀI LIỆU ĐỌC THÊM'
            }
        },
        {
            id: 's3',
            title: 'Kiến thức Sơ cấp cứu cơ bản',
            nodes: [
                {
                    id: 'n9',
                    title: 'Chăm sóc Vết thương & Cầm máu',
                    status: 'completed',
                    type: 'lesson',
                    score: { current: 5, max: 6 }
                },
                {
                    id: 'n10',
                    title: 'Bỏng & Sốc nhiệt',
                    status: 'active',
                    type: 'lesson'
                },
                {
                    id: 'n11',
                    title: 'Gãy xương & Bong gân',
                    status: 'locked',
                    type: 'lesson',
                    score: { current: 0, max: 8 }
                },
                {
                    id: 'n12',
                    title: 'Kiểm tra Chương',
                    status: 'locked',
                    type: 'test',
                    description: '15 câu hỏi - yêu cầu ≥ 70%'
                }
            ]
        },
        {
            id: 's4',
            title: 'Chuẩn bị cho Tình huống khẩn cấp',
            nodes: [
                {
                    id: 'n13',
                    title: 'Chuẩn bị Hộp sơ cứu',
                    status: 'active',
                    type: 'lesson'
                },
                {
                    id: 'n14',
                    title: 'Khi nào cần gọi Cấp cứu',
                    status: 'locked',
                    type: 'lesson',
                    score: { current: 0, max: 6 }
                },
                {
                    id: 'n15',
                    title: 'Kiểm tra Chương',
                    status: 'locked',
                    type: 'test',
                    description: '15 câu hỏi - yêu cầu ≥ 70%'
                }
            ]
        }
    ],
    continueLesson: {
        courseInfo: 'Sốc phản vệ — Bài 3',
        title: 'Điều trị nâng cao',
        description: 'Tìm hiểu các phương pháp điều trị nâng cao cho phản ứng phản vệ nghiêm trọng và phác đồ cấp cứu.',
        link: '/learning/n3'
    }
},
};
