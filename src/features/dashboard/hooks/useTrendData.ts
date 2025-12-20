import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

interface MetricStats {
    totalTargets: number;
    onlineCount: number;
    offlineCount: number;
    successRate: number;
}

const STORAGE_KEY = 'dashboard_daily_stats_v1';

export const useTrendData = (currentStats: MetricStats, loading: boolean) => {
    const [trends, setTrends] = useState<{
        [K in keyof MetricStats]: number | null;
    } & { hasHistory: boolean }>({
        totalTargets: null,
        onlineCount: null,
        offlineCount: null,
        successRate: null,
        hasHistory: false
    });

    useEffect(() => {
        if (loading) return;

        // Load history and snapshot today
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            let history: (MetricStats & { date: string })[] = stored ? JSON.parse(stored) : [];

            const todayStr = dayjs().format('YYYY-MM-DD');
            const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

            // Find yesterday's data for comparison
            const yesterdayData = history.find(d => d.date === yesterdayStr);

            if (yesterdayData) {
                const calcTrend = (now: number, prev: number) => {
                    if (prev === 0) return now > 0 ? 100 : 0;
                    return Number(((now - prev) / prev * 100).toFixed(1));
                };

                setTrends({
                    totalTargets: calcTrend(currentStats.totalTargets, yesterdayData.totalTargets),
                    onlineCount: calcTrend(currentStats.onlineCount, yesterdayData.onlineCount),
                    offlineCount: calcTrend(currentStats.offlineCount, yesterdayData.offlineCount),
                    successRate: calcTrend(currentStats.successRate, yesterdayData.successRate),
                    hasHistory: true
                });
            } else {
                setTrends(prev => ({ ...prev, hasHistory: false }));
            }

            // Update Today's Snapshot
            // Remove today if exists to overwrite with latest
            history = history.filter(d => d.date !== todayStr);
            history.unshift({ date: todayStr, ...currentStats });

            // Keep last 7 days only to save space
            if (history.length > 7) {
                history = history.slice(0, 7);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

        } catch (e) {
            console.error("Failed to process trend data", e);
        }

    }, [
        loading,
        currentStats.totalTargets,
        currentStats.onlineCount,
        currentStats.offlineCount,
        currentStats.successRate
    ]);

    return trends;
};
