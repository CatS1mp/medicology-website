import { useEffect, useState } from 'react';
import { getThemes, getThemeSections } from '@/shared/api/learning';
import { RoadmapData } from '../types';

export const useRoadmap = (slug: string) => {
    const [data, setData] = useState<RoadmapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchRoadmap() {
            setIsLoading(true);
            setData(null);
            try {
                const themes = await getThemes();
                const theme = themes.find((t) => t.slug === slug);
                if (!theme) {
                    if (!cancelled) setData(null);
                    return;
                }

                const sections = await getThemeSections(theme.id);

                const mapped: RoadmapData = {
                    topicTitle: theme.name,
                    progress: {
                        current: 0,
                        total: Math.max(sections.length, 1),
                    },
                    streak: {
                        days: 0,
                        message: 'Bạn đang xây dựng một thói quen học tập vững chắc. Tiếp tục phát huy nhé!',
                    },
                    sections: sections
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((s, index) => ({
                            id: s.id,
                            title: s.name,
                            nodes: [
                                {
                                    id: `n${index + 1}`,
                                    title: 'Bắt đầu',
                                    status: 'active',
                                    type: 'lesson',
                                },
                            ],
                        })),
                };

                if (!cancelled) setData(mapped);
            } catch {
                if (!cancelled) setData(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchRoadmap();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    return {
        data,
        isLoading
    };
};

