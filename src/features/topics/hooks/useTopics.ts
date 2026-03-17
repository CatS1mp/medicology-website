import { useState, useMemo } from 'react';
import { TopicFiltersState } from '../types';
import { mockTopics } from '../data/mockData';

export const useTopics = () => {
    const [filters, setFilters] = useState<TopicFiltersState>({
        sortBy: 'Phổ biến nhất',
        level: 'Mọi trình độ',
        category: 'Tất cả',
        courseCount: 'Tất cả'
    });

    const [page, setPage] = useState(1);
    const limit = 6;

    // Simulate API filtering and sorting
    const filteredTopics = useMemo(() => {
        let result = [...mockTopics];

        if (filters.level !== 'Mọi trình độ') {
            result = result.filter(t => t.level === filters.level);
        }
        
        if (filters.category !== 'Tất cả') {
            result = result.filter(t => t.category === filters.category);
        }

        if (filters.courseCount !== 'Tất cả') {
            // Very naive simulation
            if (filters.courseCount === '1-3 khóa học') result = result.filter(t => t.courseCount >= 1 && t.courseCount <= 3);
            if (filters.courseCount === '4-7 khóa học') result = result.filter(t => t.courseCount >= 4 && t.courseCount <= 7);
            if (filters.courseCount === '+7 khóa học') result = result.filter(t => t.courseCount > 7);
        }

        // Add dummy sorting logic if needed
        return result;
    }, [filters]);

    // Simulate pagination
    const totalPages = Math.ceil(filteredTopics.length / limit);
    const paginatedTopics = filteredTopics.slice((page - 1) * limit, page * limit);

    return {
        topics: paginatedTopics,
        filters,
        setFilters,
        page,
        setPage,
        totalPages,
        totalItems: filteredTopics.length,
        isLoading: false // Will be true when actually fetching
    };
};
