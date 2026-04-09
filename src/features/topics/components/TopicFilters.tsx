import React from 'react';
import { TopicFiltersState, TopicLevel } from '../types';

interface TopicFiltersProps {
    filters: TopicFiltersState;
    onChange: (filters: TopicFiltersState) => void;
}

export const TopicFilters: React.FC<TopicFiltersProps> = ({ filters, onChange }) => {
    
    function updateFilter<K extends keyof TopicFiltersState>(key: K, value: TopicFiltersState[K]) {
        onChange({ ...filters, [key]: value });
    }

    const levels: Array<'Mọi trình độ' | TopicLevel> = ['Mọi trình độ', 'Cơ bản', 'Trung cấp', 'Nâng cao'];
    const categories: Array<'Tất cả' | string> = ['Tất cả', 'Sơ cứu & Cấp cứu', 'Dinh dưỡng & Chế độ ăn', 'Sức khỏe Tinh thần', 'Sức khỏe Tim mạch', 'Y học Thường thức'];
    const courseCounts: Array<'Tất cả' | '1-3 khóa học' | '4-7 khóa học' | '+7 khóa học'> = ['Tất cả', '1-3 khóa học', '4-7 khóa học', '+7 khóa học'];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <span className="text-gray-500 text-[14px]">Sắp xếp theo:</span>
                <select 
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value as TopicFiltersState['sortBy'])}
                    className="bg-gray-50 text-gray-700 text-[14px] font-medium px-4 py-2 rounded-lg border-none focus:ring-0 cursor-pointer appearance-none pr-10 relative outline-none"
                >
                    <option value="Phổ biến nhất">Phổ biến nhất</option>
                    <option value="Mới nhất">Mới nhất</option>
                    <option value="Đánh giá cao">Đánh giá cao</option>
                </select>
                <div className="absolute left-[200px] pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-[14px] w-28 flex-shrink-0">Trình độ</span>
                    <div className="flex flex-wrap gap-2">
                        {levels.map(level => (
                            <button
                                key={level}
                                onClick={() => updateFilter('level', level)}
                                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                                    filters.level === level 
                                        ? 'bg-[#1CA1F2] text-white' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-[14px] w-28 flex-shrink-0">Chuyên khoa</span>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => updateFilter('category', cat)}
                                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                                    filters.category === cat 
                                        ? 'bg-[#1CA1F2] text-white' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-[14px] w-28 flex-shrink-0">Số lượng Khóa học</span>
                    <div className="flex flex-wrap gap-2">
                        {courseCounts.map(count => (
                            <button
                                key={count}
                                onClick={() => updateFilter('courseCount', count)}
                                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                                    filters.courseCount === count 
                                        ? 'bg-[#1CA1F2] text-white' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};