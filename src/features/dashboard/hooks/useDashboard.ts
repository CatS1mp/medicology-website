import { useEffect, useState } from 'react';
import { getProgress } from '@/shared/api/learning';
import { StatCard, ChartDataPoint, CourseCard, LearningResultPoint, LearningProgressItem } from '../types';
import { useUser } from '@/shared/contexts/UserContext';

export function useDashboard() {
    const { userProfile, streak } = useUser();
    const [totalLessons, setTotalLessons] = useState(0);
    const [statCards, setStatCards] = useState<StatCard[]>([]);
    const [weeklyChartData, setWeeklyChartData] = useState<ChartDataPoint[]>([]);
    const [courseCards, setCourseCards] = useState<CourseCard[]>([]);
    const [learningResults, setLearningResults] = useState<LearningResultPoint[]>([]);
    const [learningProgress, setLearningProgress] = useState<LearningProgressItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchDashboardData() {
            setIsLoading(true);
            try {
                // Lấy progress từ API
                const progress = await getProgress();
                console.log('Dashboard progress:', progress);

                // TODO: Transform progress data thành dashboard data
                // Hiện tại để empty, sẽ implement sau khi có data thật

                if (!cancelled) {
                    // Stats with streak from context
                    setStatCards([
                        { id: 'streak', label: 'Chuỗi ngày', value: streak?.currentStreak ?? 0, icon: '🔥', color: 'orange' },
                        { id: 'score', label: 'Điểm số', value: 0, icon: '⭐', color: 'yellow' },
                        { id: 'lessons', label: 'Bài học', value: 0, icon: '📚', color: 'blue' },
                    ]);
                    setTotalLessons(0);
                    
                    // Default weekly chart data (7 days with 0 values)
                    const today = new Date();
                    const defaultWeeklyData: ChartDataPoint[] = [];
                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date(today);
                        date.setDate(date.getDate() - i);
                        defaultWeeklyData.push({
                            day: dayNames[date.getDay()],
                            date: `${date.getDate()}/${date.getMonth() + 1}`,
                            value: 0,
                        });
                    }
                    setWeeklyChartData(defaultWeeklyData);
                    
                    // Default learning results (empty but chart will show)
                    const defaultResults: LearningResultPoint[] = [
                        { label: 'T2', actual: 0, target: 8 },
                        { label: 'T3', actual: 0, target: 8 },
                        { label: 'T4', actual: 0, target: 8 },
                        { label: 'T5', actual: 0, target: 8 },
                        { label: 'T6', actual: 0, target: 8 },
                        { label: 'T7', actual: 0, target: 8 },
                        { label: 'CN', actual: 0, target: 8 },
                    ];
                    setLearningResults(defaultResults);
                    
                    setCourseCards([]);
                    setLearningProgress([]);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchDashboardData();
        return () => {
            cancelled = true;
        };
    }, [streak]); // Re-run when streak changes

    return {
        userName: userProfile?.fullName ?? 'User',
        totalLessons,
        statCards,
        weeklyChartData,
        courseCards,
        learningResults,
        learningProgress,
        isLoading,
    };
}
