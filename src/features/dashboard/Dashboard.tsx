import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Button, Tooltip, Spin } from 'antd';
import {
    FullscreenOutlined,
    FullscreenExitOutlined,
    CloudServerOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import {
    KPICard,
    FailureChart,
    VersionTreemap,
    ActiveRolloutCard,
    LiveTicker,
} from './components';

import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetActions } from '@/api/generated/actions/actions';
import type { LiveTickerLog } from './components/LiveTicker';

const DashboardContainer = styled.div<{ $isFocusMode: boolean }>`
    height: ${(props) => (props.$isFocusMode ? '100vh' : 'calc(100vh - 64px)')};
    width: 100%;
    position: ${(props) => (props.$isFocusMode ? 'fixed' : 'relative')};
    top: 0;
    left: 0;
    z-index: ${(props) => (props.$isFocusMode ? 1000 : 1)};
    background: ${(props) => (props.$isFocusMode ? '#0b1120' : '#f0f2f5')};
    color: ${(props) => (props.$isFocusMode ? '#f8fafc' : 'inherit')};
    padding: 16px;
    display: grid;
    grid-template-rows: 120px 1fr 48px;
    gap: 16px;
    overflow: hidden;
    transition: background 0.3s ease;

    & .ant-card {
        background: ${(props) => (props.$isFocusMode ? '#182747' : '#fff')};
        color: ${(props) => (props.$isFocusMode ? '#f8fafc' : 'inherit')};
        border: none;
        box-shadow: ${(props) =>
            props.$isFocusMode ? '0 12px 30px rgba(8, 15, 40, 0.5)' : '0 6px 20px rgba(0, 0, 0, 0.08)'};
    }
`;

const KPISection = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    height: 100%;
`;

const MiddleRow = styled.div`
    display: grid;
    grid-template-columns: 35% 30% 35%;
    gap: 16px;
    min-height: 0;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    & > * {
        min-height: 0;
    }
`;

const BottomRow = styled.div`
    min-height: 0;
`;

const FloatingActionButton = styled(Button)`
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1001;
    opacity: 0.6;
    &:hover {
        opacity: 1;
    }
`;

const Dashboard: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();
    const [isFocusMode, setIsFocusMode] = useState(false);

    const { data: targetsData, isLoading: targetsLoading } = useGetTargets({ limit: 500 });
    const { data: actionsData, isLoading: actionsLoading } = useGetActions(
        { limit: 200 },
        { query: { refetchInterval: 15000 } }
    );

    const totalTargets = targetsData?.total ?? targetsData?.content?.length ?? 0;
    const sampleSize = targetsData?.content?.length ?? 0;
    const onlineSample = targetsData?.content
        ? targetsData.content.filter((target) => target.pollStatus?.overdue === false).length
        : 0;
    const estimatedOnlineTotal =
        sampleSize > 0 && totalTargets > sampleSize
            ? Math.round((onlineSample / sampleSize) * totalTargets)
            : onlineSample;
    const availability = totalTargets > 0 ? (estimatedOnlineTotal / totalTargets) * 100 : 0;

    const recentActions = useMemo(() => {
        if (!actionsData?.content) return [];
        const threshold = dayjs().subtract(24, 'hour');
        return actionsData.content.filter(
            (action) => action.createdAt && dayjs(action.createdAt).isAfter(threshold)
        );
    }, [actionsData]);

    const pendingActions = useMemo(
        () =>
            recentActions.filter((action) =>
                ['scheduled', 'pending', 'retrieving', 'ready'].includes(action.status?.toLowerCase() || '')
            ).length,
        [recentActions]
    );

    const { finishedCount, errorCount, errorItems } = useMemo(() => {
        let finished = 0;
        const errors: typeof recentActions = [];
        recentActions.forEach((action) => {
            const status = action.status?.toLowerCase();
            if (status === 'finished') finished += 1;
            if (status === 'error' || status === 'failed') {
                errors.push(action);
            }
        });

        return { finishedCount: finished, errorCount: errors.length, errorItems: errors };
    }, [recentActions]);

    const successRate = finishedCount + errorCount > 0 ? (finishedCount / (finishedCount + errorCount)) * 100 : 0;
    const criticalErrorCount = errorCount;

    const failureData = useMemo(() => {
        const bucketCount = 6;
        const bucketHours = 4;
        const start = dayjs().subtract(bucketCount * bucketHours, 'hour');

        const buckets = Array.from({ length: bucketCount }, (_, index) => {
            const bucketStart = start.add(index * bucketHours, 'hour');
            return {
                time: bucketStart.format('HH:mm'),
                timeout: 0,
                installError: 0,
                networkError: 0,
            };
        });

        const categorizeError = (detail?: string, statusCode?: number) => {
            const normalized = detail?.toLowerCase() || '';
            if (normalized.includes('network') || (statusCode && statusCode >= 500)) return 'networkError';
            if (normalized.includes('install')) return 'installError';
            if (normalized.includes('timeout') || normalized.includes('time')) return 'timeout';
            return 'installError';
        };

        errorItems.forEach((action) => {
            if (!action.createdAt) return;
            const created = dayjs(action.createdAt);
            if (created.isBefore(start)) return;
            const diffHours = Math.max(created.diff(start, 'hour'), 0);
            const bucketIndex = Math.min(bucketCount - 1, Math.floor(diffHours / bucketHours));
            const category = categorizeError(action.detailStatus, action.lastStatusCode);
            buckets[bucketIndex][category as 'timeout' | 'installError' | 'networkError'] += 1;
        });

        return buckets;
    }, [errorItems]);

    const liveLogs = useMemo<LiveTickerLog[]>(() => {
        return recentActions
            .slice()
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 12)
            .map((action) => {
                const status = action.status?.toLowerCase() || 'info';
                const targetId = action._links?.target?.href?.split('/')?.pop();
                return {
                    id: action.id || Number(Math.random().toString().slice(2, 8)),
                    time: action.createdAt ? dayjs(action.createdAt).format('HH:mm:ss') : '--:--',
                    type: status === 'error' ? 'error' : status === 'finished' ? 'success' : 'info',
                    message: `${action.rolloutName || 'Action'} #${action.id} • ${status.toUpperCase()} ${targetId ? `@${targetId}` : ''}`,
                    link: action.id ? `/actions?q=id==${action.id}` : undefined,
                };
            });
    }, [recentActions]);

    const versionDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        targetsData?.content?.forEach((target) => {
            const descriptor = target.description || target.name || '';
            const versionMatch = descriptor.match(/v[\d.]+/i);
            const bucket = versionMatch ? versionMatch[0].toUpperCase() : target.targetTypeName || 'Unknown';
            counts[bucket] = (counts[bucket] || 0) + 1;
        });
        return counts;
    }, [targetsData]);

    const versionTreemapData = useMemo(() => {
        const palette = ['#5c67f2', '#38bdf8', '#f472b6', '#34d399', '#facc15'];
        return Object.entries(versionDistribution)
            .map(([name, size], index) => ({
                name,
                size,
                fill: palette[index % palette.length],
            }))
            .sort((a, b) => b.size - a.size);
    }, [versionDistribution]);

    const uniqueVersions = Object.keys(versionDistribution).length;
    const fragmentationScore =
        totalTargets > 0 ? Math.min(100, (uniqueVersions / totalTargets) * 100) : 0;

    const availabilityTrendRef = useRef<number | null>(null);
    const [availabilityTrend, setAvailabilityTrend] = useState<number>();
    useEffect(() => {
        if (availabilityTrendRef.current !== null && totalTargets > 0) {
            const delta = estimatedOnlineTotal - availabilityTrendRef.current;
            setAvailabilityTrend(Number(((delta / totalTargets) * 100).toFixed(1)));
        }
        availabilityTrendRef.current = estimatedOnlineTotal;
    }, [estimatedOnlineTotal, totalTargets]);

    const successTrendRef = useRef<number | null>(null);
    const [successRateTrend, setSuccessRateTrend] = useState<number>();
    useEffect(() => {
        if (successTrendRef.current !== null) {
            setSuccessRateTrend(Number((successRate - successTrendRef.current).toFixed(1)));
        }
        successTrendRef.current = successRate;
    }, [successRate]);

    const toggleFocusMode = () => {
        setIsFocusMode((prev) => !prev);
        if (!isFocusMode) {
            document.documentElement.requestFullscreen().catch(() => null);
        } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => null);
        }
    };

    const handleTickerClick = useCallback(
        (log: LiveTickerLog) => {
            if (log.link) {
                navigate(log.link);
            }
        },
        [navigate]
    );

    if (targetsLoading || actionsLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" tip="Loading Dashboard Data..." />
            </div>
        );
    }

    return (
        <DashboardContainer $isFocusMode={isFocusMode}>
            <Tooltip title={isFocusMode ? t('focus.exit') : t('focus.enter')}>
                <FloatingActionButton
                    type="primary"
                    shape="circle"
                    icon={isFocusMode ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={toggleFocusMode}
                />
            </Tooltip>

            <KPISection>
                <KPICard
                    title={t('charts.availability')}
                    value={availability.toFixed(1)}
                    suffix="%"
                    trend={availabilityTrend}
                    color="#52c41a"
                    icon={<CloudServerOutlined />}
                    description={t('kpi.realtimeSample', { count: sampleSize })}
                />
                <KPICard
                    title={t('charts.successRate')}
                    value={successRate.toFixed(1)}
                    suffix="%"
                    trend={successRateTrend}
                    color="#1890ff"
                    icon={<CheckCircleOutlined />}
                    description={t('kpi.window24h')}
                />
                <KPICard
                    title={t('charts.pendingActions')}
                    value={pendingActions}
                    color="#faad14"
                    icon={<ClockCircleOutlined />}
                    description={t('kpi.window24h')}
                />
                <KPICard
                    title={t('kpi.criticalErrors')}
                    value={criticalErrorCount}
                    color="#ff4d4f"
                    icon={<WarningOutlined />}
                    badgeLabel={criticalErrorCount > 0 ? t('kpi.alertBadge') : undefined}
                    badgeColor="#ff7875"
                    description={t('kpi.window24h')}
                />
            </KPISection>

            <MiddleRow>
                <FailureChart data={failureData} />
                <ActiveRolloutCard />
                <VersionTreemap
                    data={versionTreemapData}
                    fragmentationScore={fragmentationScore}
                    uniqueVersions={uniqueVersions}
                />
            </MiddleRow>

            <BottomRow>
                <LiveTicker
                    logs={liveLogs}
                    title={t('ticker.title')}
                    emptyText={t('ticker.empty')}
                    onLogClick={handleTickerClick}
                />
            </BottomRow>
        </DashboardContainer>
    );
};

export default Dashboard;
