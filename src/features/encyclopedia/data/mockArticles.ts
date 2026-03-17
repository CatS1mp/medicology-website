import { ArticleDetail, ArticleSummary } from '../types';

export const mockArticles: Record<string, ArticleDetail> = {
    'nhoi-mau-co-tim': {
        id: '1',
        slug: 'nhoi-mau-co-tim',
        title: 'Nhồi máu cơ tim (Đau tim)',
        subtitle: 'BÀI VIẾT · SỨC KHỎE TIM MẠCH',
        excerpt: 'Nhồi máu cơ tim xảy ra khi dòng máu đến một phần cơ tim bị tắc nghẽn, thường do cục máu đông, gây tổn thương hoặc hoại tử mô tim. Điều trị kịp thời là yếu tố then chốt...',
        category: 'Tim mạch',
        tags: [
            { label: 'Tim mạch', slug: 'tim-mach' },
            { label: 'Y học cấp cứu', slug: 'y-hoc-cap-cuu' },
            { label: 'Bệnh tim', slug: 'benh-tim' },
            { label: 'Sơ cứu', slug: 'so-cuu' },
            { label: 'Tim mạch', slug: 'tim-mach-2' },
        ],
        viewCount: 12847,
        readTimeMin: 12,
        publishedAt: '2024-03-01',
        lastViewed: '2 phút trước',
        tableOfContents: [
            { id: 'hieu-benh', label: 'Hiểu về bệnh lý', level: 1 },
            { id: 'yeu-to-nguy-co', label: 'Yếu tố nguy cơ', level: 1 },
            { id: 'canh-bao-trieu-chung', label: 'Dấu hiệu & Triệu chứng cảnh báo', level: 1 },
            { id: 'trieu-chung-khong-dien-hinh', label: 'Triệu chứng không điển hình', level: 2 },
            { id: 'co-che-benh-sinh', label: 'Cơ chế bệnh sinh', level: 1 },
            { id: 'qua-trinh', label: 'Quá trình', level: 2 },
            { id: 'phan-loai', label: 'Phân loại Đau tim', level: 1 },
            { id: 'chan-doan', label: 'Chẩn đoán', level: 1 },
            { id: 'dieu-tri-cap-cuu', label: 'Điều trị cấp cứu', level: 1 },
        ],
        sections: [
            {
                id: 'hieu-benh',
                heading: 'Hiểu về bệnh lý',
                imageUrl: '/images/Others/Main.svg',
                content: `Nhồi máu cơ tim (MI), thường được gọi là đau tim, xảy ra khi dòng máu đến một phần cơ tim bị tắc nghẽn, thường do **cục máu đông**. Sự tắc nghẽn này ngăn oxy đến mô tim, gây tổn thương hoặc hoại tử vùng đó.\n\nNhồi máu cơ tim là một trong những trường hợp **khẩn cấp tim mạch** nghiêm trọng nhất và cần được điều trị y tế ngay lập tức để ngăn ngừa tổn thương vĩnh viễn hoặc tử vong.\n\nMức độ nghiêm trọng và kết quả phụ thuộc vào nhiều yếu tố liên kết nhau, bao gồm vị trí tắc nghẽn, thời gian thiếu máu, và quan trọng nhất — tốc độ điều trị. Nhận biết sớm và can thiệp y tế kịp thời có vai trò quyết định đến khả năng sống sót và phục hồi.`,
            },
            {
                id: 'yeu-to-nguy-co',
                heading: 'Yếu tố nguy cơ',
                content: `Nhiều yếu tố làm tăng nguy cơ bị nhồi máu cơ tim:\n\n- **Tăng huyết áp** — gây tổn hại thành động mạch theo thời gian\n- **Hút thuốc lá** — làm hỏng mạch máu và giảm oxy máu\n- **Cholesterol cao** — dẫn đến tích tụ mảng bám trong động mạch\n- **Tiểu đường** — tăng tốc xơ vữa động mạch\n- **Béo phì** — gây thêm áp lực cho tim\n- **Tiền sử gia đình** — yếu tố di truyền đóng vai trò quan trọng`,
            },
        ],
        relatedArticles: [
            {
                id: '2', slug: 'benh-dong-mach-vanh',
                title: 'Bệnh động mạch vành', subtitle: 'TIM MẠCH',
                excerpt: '', category: 'Tim mạch',
                tags: [], viewCount: 0, readTimeMin: 8, publishedAt: '2024-02-10'
            },
            {
                id: '3', slug: 'ngung-tim-vs-dau-tim',
                title: 'Ngừng tim và Đau tim', subtitle: 'Y HỌC CẤP CỨU',
                excerpt: '', category: 'Cấp cứu',
                tags: [], viewCount: 0, readTimeMin: 6, publishedAt: '2024-01-20'
            },
            {
                id: '4', slug: 'quan-ly-huyet-ap',
                title: 'Quản lý huyết áp', subtitle: 'SỨC KHỎE TIM MẠCH',
                excerpt: '', category: 'Tim mạch',
                tags: [], viewCount: 0, readTimeMin: 10, publishedAt: '2024-01-15'
            },
            {
                id: '5', slug: 'xo-vua-dong-mach',
                title: 'Xơ vữa động mạch', subtitle: 'TIM MẠCH',
                excerpt: '', category: 'Tim mạch',
                tags: [], viewCount: 0, readTimeMin: 7, publishedAt: '2024-01-05'
            },
            {
                id: '6', slug: 'co-ban-hoi-suc-tim-phoi',
                title: 'Kiến thức cơ bản CPR', subtitle: 'SƠ CỨU',
                excerpt: '', category: 'Sơ cứu',
                tags: [], viewCount: 0, readTimeMin: 5, publishedAt: '2023-12-20'
            },
        ],
    }
};

// Used for search results - returns any article that matches query anywhere in title/excerpt/tags
export const searchArticles = (query: string): ArticleSummary[] => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return Object.values(mockArticles).map(a => ({
        id: a.id, slug: a.slug, title: a.title, subtitle: a.subtitle,
        excerpt: a.excerpt, category: a.category, tags: a.tags,
        viewCount: a.viewCount, readTimeMin: a.readTimeMin, publishedAt: a.publishedAt
    })).filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some(t => t.label.toLowerCase().includes(q))
    );
};
