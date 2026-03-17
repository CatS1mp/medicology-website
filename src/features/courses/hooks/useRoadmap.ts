import { useState, useEffect } from 'react';
import { mockRoadmapData } from '../data/mockRoadmap';
import { RoadmapData } from '../types';

export const useRoadmap = (slug: string) => {
    const [data, setData] = useState<RoadmapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        setData(null);
        // Simulate API fetch delay by slug
        const timer = setTimeout(() => {
            const result = mockRoadmapData[slug] ?? null;
            setData(result);
            setIsLoading(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [slug]);

    return {
        data,
        isLoading
    };
};

