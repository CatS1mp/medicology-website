"use client";
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { StarryBackground } from '@/shared/components/StarryBackground';

export const HomepageScreen = () => {
    const router = useRouter();
    const CATEGORIES = ['SINH LÝ HỌC', 'NỘI KHOA', 'DƯỢC LÝ HỌC', 'BỆNH LÝ HỌC', 'NGOẠI KHOA', 'NHI KHOA', 'DA LIỄU'];
    const INFINITE_CATEGORIES = React.useMemo(() => Array(100).fill(CATEGORIES).flat(), [CATEGORIES]);

    const [activeIndex, setActiveIndex] = React.useState(Math.floor(INFINITE_CATEGORIES.length / 2));
    const categoryScrollRef = React.useRef<HTMLUListElement>(null);

    React.useEffect(() => {
        if (categoryScrollRef.current) {
            const activeElement = categoryScrollRef.current.querySelector('[data-active="true"]');
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeIndex]);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Top Bar Header */}
            <header className="bg-[#153e6b] relative z-20 w-full flex justify-between items-center px-8 md:px-24 py-4 font-sans shadow-md border-b border-[#ffffff1a]">
                <div className="flex items-center">
                    <Image
                        src="/images/Logo/2.svg"
                        alt="Medicology Logo"
                        width={280}
                        height={60}
                        className="h-14 md:h-16 w-auto"
                        priority
                    />
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-white hover:text-gray-200 cursor-pointer transition-colors">
                    NGÔN NGỮ: TIẾNG VIỆT
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-[#1f5793] text-white min-h-[60vh] relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <StarryBackground starCount={150} />
                    <div className="absolute inset-0 bg-black opacity-10 mix-blend-multiply"></div>
                </div>

                <div className="container mx-auto px-4 py-12 md:py-20 relative z-10 flex flex-col h-full">
                    {/* Hero Content */}
                    <div className="flex flex-col md:flex-row items-center justify-center flex-1 mt-0 gap-12 md:gap-24 h-full max-w-7xl mx-auto">
                        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                            {/* Globe and Robot illustration */}
                            <div className="relative w-[320px] h-[320px] md:w-[600px] md:h-[600px] flex items-center justify-center">
                                <div className="absolute inset-4 md:inset-12 bg-green-500 rounded-full opacity-30 blur-3xl z-0"></div>

                                {/* Earth Aura Glow - layered to match reference images */}
                                <div className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] -left-20 md:-left-48 top-1/2 -translate-y-1/2 bg-blue-500 rounded-full opacity-50 blur-3xl z-0 pointer-events-none"></div>

                                {/* Earth Image */}
                                <div className="absolute z-0 w-[200px] h-[200px] md:w-[400px] md:h-[400px] -left-12 md:-left-24 top-1/2 -translate-y-1/2 opacity-90 drop-shadow-2xl transition-transform duration-300 hover:scale-110 hover:animate-shake cursor-pointer">
                                    <Image
                                        src="/images/Others/earth.png"
                                        alt="Earth"
                                        fill
                                        style={{ objectFit: 'contain' }}
                                        priority
                                    />
                                </div>

                                {/* Mascot Image */}
                                <div className="relative z-10 w-[240px] h-[240px] md:w-[450px] md:h-[450px] transition-transform duration-300 hover:scale-110 hover:animate-shake cursor-pointer">
                                    <Image
                                        src="/images/Mascot/13 1.svg"
                                        alt="Robot"
                                        fill
                                        style={{ objectFit: 'contain' }}
                                        priority
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-10 leading-tight md:max-w-xl">
                                Cách miễn phí, thú vị và hiệu quả để học kiến thức y khoa!
                            </h1>
                            <div className="flex flex-col gap-4 w-full flex-grow-0 items-center md:items-start">
                                <button
                                    className="bg-white text-[#1f5793] font-bold uppercase py-4 md:py-5 px-8 rounded-full shadow-lg hover:bg-gray-100 hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 w-full max-w-[350px] text-lg"
                                    onClick={() => router.push('/signup')}
                                >
                                    BẮT ĐẦU
                                </button>
                                <button
                                    className="bg-transparent border-2 border-[#10345d] bg-[#10345d]/40 backdrop-blur-sm hover:bg-[#10345d] text-white font-bold uppercase py-4 md:py-5 px-8 rounded-full transition-colors w-full shadow-sm max-w-[350px] text-lg tracking-wide"
                                    onClick={() => router.push('/login')}
                                >
                                    TÔI ĐÃ CÓ TÀI KHOẢN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Navigation */}
            <nav className="bg-[#10345d] text-[#b0c4df] py-5 shadow-lg z-20 sticky top-0 border-b border-[#1f5793]">
                <div className="w-full flex justify-center items-center relative">
                    <div
                        className="overflow-hidden relative w-[800px] max-w-[95vw] flex justify-center"
                        style={{
                            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)'
                        }}
                    >
                        <ul
                            ref={categoryScrollRef}
                            id="category-scroll"
                            className="flex flex-nowrap items-center gap-6 md:gap-14 text-sm md:text-base font-bold uppercase tracking-widest whitespace-nowrap overflow-x-auto pb-2 md:pb-0 scrollbar-hide [&::-webkit-scrollbar]:hidden before:content-[''] before:w-[50vw] before:shrink-0 after:content-[''] after:w-[50vw] after:shrink-0"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {INFINITE_CATEGORIES.map((category, index) => {
                                const dist = Math.abs(activeIndex - index);
                                const isHidden = dist > 2;

                                return (
                                    <li
                                        key={`${category}-${index}`}
                                        data-active={activeIndex === index}
                                        className={`cursor-pointer select-none outline-none transition-all duration-300 pb-1 shrink-0 snap-center
                                            ${isHidden ? 'opacity-0 w-0 m-0 p-0 overflow-hidden border-transparent pointer-events-none' : ''}
                                            ${activeIndex === index ? 'text-white border-b-2 border-white scale-110' : ''}
                                            ${dist === 1 ? 'text-[#b0c4df] border-b-2 border-transparent hover:text-white opacity-80' : ''}
                                            ${dist === 2 ? 'text-[#7a9bbd] border-b-2 border-transparent opacity-30 pointer-events-none' : ''}
                                        `}
                                        onClick={() => !isHidden && setActiveIndex(index)}
                                    >
                                        {!isHidden && category}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </nav>

            <main className="flex-1 bg-white text-gray-800">
                <div className="container mx-auto px-4 py-16 space-y-24">

                    {/* Intro section */}
                    <section className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 max-w-5xl mx-auto px-4 md:px-0">
                        <div className="w-full md:w-1/2 flex justify-center md:justify-center shrink-0">
                            <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] scale-110 md:scale-125">
                                <div className="w-full h-full transition-transform duration-300 hover:scale-110 hover:animate-shake cursor-pointer">
                                    <Image
                                        src="/images/Mascot/3.svg"
                                        alt="Robot 1"
                                        fill
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 max-w-xl text-center md:text-left md:-ml-12 lg:-ml-24">
                            <h2 className="text-3xl font-bold mb-6 text-[#242b36]">Top 1 cách trau dồi kiến thức y khoa</h2>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                Học cùng Medicology rất thú vị, và các nghiên cứu đã chứng minh độ hiệu quả của việc ứng dụng Gamification vào học tập! Với các bài học ngắn gọn, súc tích, người học sẽ tích lũy điểm số và mở khóa các cấp độ mới, đồng thời trau dồi các kỹ năng y khoa thực tế.
                            </p>
                        </div>
                    </section>

                    {/* Why Section */}
                    <section className="text-center max-w-6xl mx-auto">
                        <h2 className="text-3xl font-extrabold mb-16 text-gray-800">Lý do người học sẽ yêu thích việc học cùng Medicology</h2>

                        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
                            <div className="flex-1 space-y-12 text-left">
                                <div className="flex gap-6">
                                    <div className="relative w-14 h-14 mt-1 shrink-0">
                                        <Image src="/images/Icons/fire.svg" alt="Fire Icon" fill style={{ objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-gray-800">Hiệu quả và tối ưu</h3>
                                        <p className="text-gray-600 text-lg leading-relaxed">Các khóa học truyền đạt một cách hiệu quả và tối ưu các nền tảng y khoa, giải phẫu và kỹ năng lâm sàng.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="relative w-14 h-14 mt-1 shrink-0">
                                        <Image src="/images/Icons/tick.svg" alt="Tick Icon" fill style={{ objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-gray-800">Học tập cá nhân hóa</h3>
                                        <p className="text-gray-600 text-lg leading-relaxed">Ứng dụng AI vào giáo dục y khoa giúp thiết kế lộ trình bám sát tiến độ người học.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex justify-center py-8 px-4">
                                <div className="relative w-full max-w-[450px] aspect-[4/3]">
                                    <Image
                                        src="/images/Others/laptop.svg"
                                        alt="Laptop Mockup"
                                        fill
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 space-y-12 text-left">
                                <div className="flex gap-6">
                                    <div className="relative w-14 h-14 mt-1 shrink-0">
                                        <Image src="/images/Icons/crown.svg" alt="Crown Icon" fill style={{ objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-gray-800">Duy trì động lực</h3>
                                        <p className="text-gray-600 text-lg leading-relaxed">Việc hình thành thói quen học y khoa trở nên dễ dàng hơn với các tính năng giống trò chơi, các thử thách thú vị và lời nhắc nhở từ linh vật thân thiện, Bác sĩ Blue.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="relative w-14 h-14 mt-1 shrink-0">
                                        <Image src="/images/Icons/joyful.svg" alt="Joyful Icon" fill style={{ objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 text-gray-800">Học tập thật vui!</h3>
                                        <p className="text-gray-600 text-lg leading-relaxed">Trải nghiệm học tập thú vị mỗi ngày với hệ thống bài tập lôi cuốn cùng các nhân vật sinh động.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Knowledge Test Break */}
                    <section className="border-t-2 border-b-2 border-gray-100 py-20 my-12">
                        <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-12 md:gap-24">
                            <div className="w-full md:w-1/2 md:pl-12">
                                <h2 className="text-3xl font-extrabold mb-6 text-gray-800">Bài kiểm tra kiến thức Y Khoa Medicology</h2>
                                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                                    Chào mừng đến với bài kiểm tra y khoa tiện lợi, nhanh chóng, có mức phí hợp lý và
                                    được công nhận trên toàn thế giới. Bằng cách tích hợp khoa học đánh giá hiện đại
                                    nhất và AI, hệ thống tạo điều kiện cho bất kỳ ai cũng có thể làm bài kiểm tra ở bất
                                    cứ đâu và khi nào họ cảm thấy sẵn sàng nhất.
                                </p>
                                <a href="#" className="text-blue-500 font-black tracking-widest uppercase hover:underline text-lg">KIỂM TRA KIẾN THỨC CỦA BẠN &rarr;</a>
                            </div>
                            <div className="w-full md:w-1/2 flex justify-center md:justify-center shrink-0">
                                <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] scale-110 md:scale-125">
                                    <div className="w-full h-full transition-transform duration-300 hover:scale-110 hover:animate-shake cursor-pointer">
                                        <Image
                                            src="/images/Mascot/11.svg"
                                            alt="Robot Test"
                                            fill
                                            style={{ objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Courses */}
                    <section className="flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto gap-8 lg:gap-16 px-4 md:px-0 mb-16">
                        <div className="w-full lg:w-5/12 flex justify-center lg:justify-end shrink-0">
                            <div className="relative w-[220px] h-[220px] md:w-[320px] md:h-[320px]">
                                <div className="w-full h-full transition-transform duration-300 hover:scale-110 hover:animate-shake cursor-pointer">
                                    <Image
                                        src="/images/Mascot/28.svg"
                                        alt="Robot Chart"
                                        fill
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-full lg:w-7/12 max-w-xl text-center lg:text-left z-10 lg:pl-16">
                            <h2 className="text-3xl font-extrabold mb-6 text-gray-800">Các khóa học hiệu quả và tối ưu</h2>
                            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                                Các khóa học truyền đạt một cách hiệu quả và tối ưu các nền tảng y khoa và kỹ năng
                                lâm sàng. Hãy xem qua các khóa học mới nhất của nền tảng!
                            </p>
                            <a href="#" className="text-blue-500 font-black tracking-widest uppercase hover:underline text-lg">TÌM HIỂU THÊM &rarr;</a>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer pre-banner */}
            <section className="bg-[#1f5793] text-white py-16 flex flex-col items-center justify-center relative overflow-hidden">
                <StarryBackground className="opacity-70" starCount={50} />
                <div className="absolute inset-0 bg-black opacity-10 mix-blend-multiply"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <h2 className="text-3xl font-bold">Tiếp thu kiến thức cùng Medicology</h2>
                    <button
                        className="bg-white text-[#1f5793] font-bold uppercase py-3 px-12 rounded-full shadow-lg hover:bg-gray-100 hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                        onClick={() => router.push('/signup')}
                    >
                        BẮT ĐẦU
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#153e6b] text-white py-12 relative overflow-hidden text-sm">
                <StarryBackground className="opacity-50" starCount={80} />
                <div className="absolute inset-0 bg-black opacity-10 mix-blend-multiply"></div>
                <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">✉</span>
                            <a href="mailto:hello@medicology.com" className="hover:underline">hello@medicology.com</a>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📞</span>
                            <span>+84 123456789</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📍</span>
                            <span>Thành phố Hồ Chí Minh, Việt Nam</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">Về chúng tôi</h3>
                        <ul className="space-y-2 text-gray-300">
                            <li><a href="#" className="hover:text-white">Đội nhóm</a></li>
                            <li><a href="#" className="hover:text-white">Sứ mệnh</a></li>
                            <li><a href="#" className="hover:text-white">Mục tiêu</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">Trợ giúp và hỗ trợ</h3>
                        <ul className="space-y-2 text-gray-300">
                            <li><a href="#" className="hover:text-white">Câu hỏi thường gặp về Medicology</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">Các điều khoản</h3>
                        <ul className="space-y-2 text-gray-300">
                            <li><a href="#" className="hover:text-white">Nguyên tắc cộng đồng</a></li>
                            <li><a href="#" className="hover:text-white">Điều khoản</a></li>
                            <li><a href="#" className="hover:text-white">Quyền riêng tư</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div >
    );
};
