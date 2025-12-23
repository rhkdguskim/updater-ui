import React, { useMemo } from 'react';
import { Card, Typography, Button, Flex, Skeleton, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    ReloadOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    StopOutlined,
    WifiOutlined,
    ThunderboltOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetActions } from '@/api/generated/actions/actions';
import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import type { MgmtAction, MgmtTarget } from '@/api/generated/model';
import { AirportSlideList } from '@/components/common';
import DeviceCardGrid from '@/features/dashboard/components/DeviceCardGrid';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

// Animations
const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: calc(100vh - 120px);
    min-height: 600px;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
`;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    flex-shrink: 0;
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const GradientTitle = styled(Title)`
    && {
        margin: 0;
        background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .dark-mode & {
        background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        background-clip: text;
    }
`;

const TopRow = styled.div`
    display: flex;
    gap: 12px;
    flex: 0 0 auto;
    height: 220px;
    min-height: 220px;
`;

const BottomRow = styled.div`
    display: flex;
    gap: 12px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

const KPIGridContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    flex: 0 0 280px;
    height: 100%;
`;

const ChartsContainer = styled.div`
    display: flex;
    gap: 12px;
    flex: 1;
    min-width: 0;
`;

const StatsCard = styled(Card) <{ $accentColor?: string; $delay?: number; $pulse?: boolean }>`
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    cursor: pointer;
    height: 100%;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: ${props => props.$accentColor || 'var(--gradient-primary)'};
        ${props => props.$pulse && css`animation: ${pulse} 2s ease-in-out infinite;`}
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
    }
    
    .ant-card-body {
        padding: 12px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
`;

const ChartCard = styled(Card) <{ $delay?: number }>`
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    height: 100%;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    
    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        padding: 8px 12px;
        min-height: auto;
    }
    
    .ant-card-head-title {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        padding: 4px 0;
    }
    
    .ant-card-body {
        flex: 1;
        padding: 8px 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
        
        .ant-card-head {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .ant-card-head-title {
            color: #e2e8f0;
        }
    }
`;

const ListCard = styled(Card) <{ $delay?: number }>`
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    height: 100%;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    
    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        padding: 8px 12px;
        min-height: auto;
    }
    
    .ant-card-head-title {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        padding: 4px 0;
    }
    
    .ant-card-body {
        flex: 1;
        padding: 8px 12px;
        overflow: hidden;
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
        
        .ant-card-head {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .ant-card-head-title {
            color: #e2e8f0;
        }
    }
`;

const BigNumber = styled.div`
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 2px;
`;

const LiveIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    
    &::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        animation: ${pulse} 1.5s ease-in-out infinite;
    }
`;

const ChartLegendItem = styled(Flex)`
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
`;

const COLORS = {
    online: '#10b981',
    offline: '#f59e0b',
    pending: '#f59e0b',
    success: '#3b82f6',
    running: '#3b82f6',
    finished: '#10b981',
    error: '#ef4444',
    approval: '#8b5cf6',
};

const getActionStatusColor = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'finished') return 'green';
    if (s === 'error' || s === 'failed') return 'red';
    if (s === 'running' || s === 'pending' || s === 'retrieving') return 'blue';
    if (s === 'scheduled' || s === 'waiting_for_confirmation') return 'orange';
    return 'default';
};

const isActionErrored = (action: MgmtAction) => {
    const status = action.status?.toLowerCase() || '';
    const detail = action.detailStatus?.toLowerCase() || '';
    const hasErrorStatus = status === 'error' || status === 'failed';
    const hasErrorDetail = detail.includes('error') || detail.includes('failed');
    const hasErrorCode = typeof action.lastStatusCode === 'number' && action.lastStatusCode >= 400;
    return hasErrorStatus || hasErrorDetail || hasErrorCode;
};

const getActionDisplayStatus = (action: MgmtAction) => {
    if (isActionErrored(action)) {
        return 'error';
    }
    return action.status?.toLowerCase();
};

const getActionStatusIcon = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'finished') return <CheckCircleOutlined />;
    if (s === 'error' || s === 'failed') return <CloseCircleOutlined />;
    if (s === 'running' || s === 'retrieving') return <SyncOutlined spin />;
    if (s === 'scheduled' || s === 'pending' || s === 'waiting_for_confirmation') return <ClockCircleOutlined />;
    if (s === 'canceled' || s === 'canceling') return <StopOutlined />;
    return <ClockCircleOutlined />;
};

const isOverdueByExpectedTime = (pollStatus?: { nextExpectedRequestAt?: number }) => {
    if (!pollStatus?.nextExpectedRequestAt) return false;
    return Date.now() > pollStatus.nextExpectedRequestAt;
};

const Dashboard: React.FC = () => {
    const { t } = useTranslation(['dashboard', 'common']);
    const navigate = useNavigate();

    const { data: targetsData, isLoading: targetsLoading, refetch: refetchTargets, dataUpdatedAt } = useGetTargets(
        { limit: 200 },
        { query: { staleTime: 30000 } }
    );
    const { data: actionsData, isLoading: actionsLoading, refetch: refetchActions } = useGetActions(
        { limit: 100 },
        { query: { staleTime: 15000 } }
    );
    const { data: rolloutsData, isLoading: rolloutsLoading, refetch: refetchRollouts } = useGetRollouts(
        { limit: 100 },
        { query: { staleTime: 30000 } }
    );

    const isLoading = targetsLoading || actionsLoading || rolloutsLoading;
    const refetch = () => { refetchTargets(); refetchActions(); refetchRollouts(); };
    const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).fromNow() : '-';

    const targets = targetsData?.content || [];
    const totalDevices = targetsData?.total ?? 0;

    // Device status calculation
    const onlineCount = targets.filter(t =>
        t.pollStatus?.lastRequestAt !== undefined &&
        !t.pollStatus?.overdue &&
        !isOverdueByExpectedTime(t.pollStatus)
    ).length;
    const offlineCount = targets.filter(t =>
        t.pollStatus?.lastRequestAt !== undefined &&
        (t.pollStatus?.overdue || isOverdueByExpectedTime(t.pollStatus))
    ).length;

    // Rollouts stats
    const rollouts = rolloutsData?.content || [];
    const activeRolloutCount = rollouts.filter(r =>
        ['running', 'starting'].includes(r.status?.toLowerCase() || '')
    ).length;
    const finishedRolloutCount = rollouts.filter(r =>
        r.status?.toLowerCase() === 'finished'
    ).length;
    const errorRolloutCount = rollouts.filter(r =>
        ['error', 'stopped'].includes(r.status?.toLowerCase() || '')
    ).length;

    // Actions stats
    const actions = actionsData?.content || [];
    const recentActions = actions.filter(a =>
        a.createdAt && dayjs(a.createdAt).isAfter(dayjs().subtract(24, 'hour'))
    );
    const pendingCount = recentActions.filter(a =>
        ['scheduled', 'pending', 'retrieving', 'running', 'waiting_for_confirmation'].includes(a.status?.toLowerCase() || '') &&
        !isActionErrored(a)
    ).length;
    const finishedCount = recentActions.filter(a => a.status?.toLowerCase() === 'finished' && !isActionErrored(a)).length;
    const errorCount = recentActions.filter(isActionErrored).length;
    const successRate = finishedCount + errorCount > 0
        ? Math.round((finishedCount / (finishedCount + errorCount)) * 100)
        : null;

    // Deployment Rate
    const totalRolloutTargets = rollouts.reduce((sum, r) => sum + (r.totalTargets || 0), 0);
    const finishedRolloutTargets = rollouts.reduce(
        (sum, r) => sum + (r.totalTargetsPerStatus?.finished || 0), 0
    );

    // Fallback to Actions if no Rollouts
    const hasRollouts = totalRolloutTargets > 0;
    const totalActions = recentActions.length;
    const finishedActions = finishedCount; // Only successful ones

    const deploymentRate = hasRollouts
        ? Math.round((finishedRolloutTargets / totalRolloutTargets) * 100)
        : totalActions > 0
            ? Math.round((finishedActions / totalActions) * 100)
            : null;

    const deploymentRateLabel = hasRollouts
        ? `${finishedRolloutTargets} / ${totalRolloutTargets} ${t('chart.targets', 'targets')}`
        : `${finishedActions} / ${totalActions} ${t('chart.actions', 'actions')}`;

    // Pie chart data - Connectivity
    const connectivityPieData = useMemo(() => [
        { name: t('chart.online'), value: onlineCount, color: COLORS.online },
        { name: t('chart.offline'), value: offlineCount, color: COLORS.offline },
    ].filter(d => d.value > 0), [onlineCount, offlineCount, t]);

    // Pie chart data - Rollout Status
    const rolloutStatusData = useMemo(() => [
        { name: t('common:status.running', 'Running'), value: activeRolloutCount, color: COLORS.running },
        { name: t('common:status.finished', 'Finished'), value: finishedRolloutCount, color: COLORS.finished },
        { name: t('common:status.error', 'Error'), value: errorRolloutCount, color: COLORS.error },
    ].filter(d => d.value > 0), [activeRolloutCount, finishedRolloutCount, errorRolloutCount, t]);

    // Pie chart data - Action Status
    const actionStatusData = useMemo(() => [
        { name: t('common:status.running', 'Running'), value: pendingCount, color: COLORS.running },
        { name: t('common:status.finished', 'Finished'), value: finishedCount, color: COLORS.finished },
        { name: t('common:status.error', 'Error'), value: errorCount, color: COLORS.error },
    ].filter(d => d.value > 0), [pendingCount, finishedCount, errorCount, t]);

    const isActivePolling = activeRolloutCount > 0 || pendingCount > 0;

    // Recent activity
    const recentDevices = useMemo(() => {
        return [...targets]
            .filter(t => t.pollStatus?.lastRequestAt)
            .sort((a, b) => (b.pollStatus?.lastRequestAt || 0) - (a.pollStatus?.lastRequestAt || 0))
            .slice(0, 10);
    }, [targets]);

    const recentActionsList = useMemo(() => {
        return [...recentActions]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 10);
    }, [recentActions]);

    // Target lookup map for actions
    const targetMap = useMemo(() => {
        const map = new Map<string, { name: string; ip: string; controllerId: string }>();
        targets.forEach(t => {
            if (t.controllerId) {
                map.set(t.controllerId, {
                    name: t.name || t.controllerId,
                    ip: t.ipAddress || '-',
                    controllerId: t.controllerId,
                });
            }
        });
        return map;
    }, [targets]);

    const getStatusLabel = (status?: string) => {
        if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
    };

    // Custom Legend Renderer
    const renderCustomLegend = (data: { name: string; value: number; color: string }[]) => (
        <Flex vertical gap={4} style={{ marginTop: 8 }}>
            {data.map(entry => (
                <ChartLegendItem key={entry.name} align="center" justify="space-between">
                    <Flex align="center" gap={6}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.color }} />
                        <Text style={{ fontSize: 12 }}>{entry.name}</Text>
                    </Flex>
                    <Text strong style={{ fontSize: 13, color: entry.color }}>{entry.value}</Text>
                </ChartLegendItem>
            ))}
        </Flex>
    );

    return (
        <PageContainer>
            <PageHeader>
                <HeaderContent>
                    <GradientTitle level={3}>
                        {t('title', 'Operations Dashboard')}
                    </GradientTitle>
                    <Flex align="center" gap={12}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {t('subtitle', 'Real-time system monitoring')}
                        </Text>
                        <LiveIndicator>
                            {isActivePolling ? t('polling.live', 'Live') : t('polling.idle', 'Idle')}
                        </LiveIndicator>
                    </Flex>
                </HeaderContent>
                <Flex align="center" gap={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('lastUpdated', 'Updated')}: {lastUpdated}
                    </Text>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={refetch}
                        loading={isLoading}
                        size="small"
                    >
                        {t('refresh', 'Refresh')}
                    </Button>
                </Flex>
            </PageHeader>

            {/* Top Row: KPI Cards (2x2) + 4 Charts */}
            <TopRow>
                {/* KPI Cards - 2x2 Grid */}
                <KPIGridContainer>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        $delay={1}
                        onClick={() => navigate('/targets')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex vertical gap={2}>
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                                    {t('kpi.connectivity', 'Connectivity')}
                                </Text>
                                <BigNumber style={{ color: COLORS.online }}>{onlineCount}/{totalDevices}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 10 }}>
                                    {t('kpi.onlineDevices', 'online devices')}
                                </Text>
                            </Flex>
                        )}
                    </StatsCard>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                        $delay={2}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex vertical gap={2}>
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                                    {t('kpi.successRate', 'Success Rate')}
                                </Text>
                                <BigNumber style={{ color: COLORS.success }}>
                                    {successRate !== null ? `${successRate}%` : '-'}
                                </BigNumber>
                                <Progress
                                    percent={successRate ?? 0}
                                    size="small"
                                    strokeColor={COLORS.success}
                                    showInfo={false}
                                />
                            </Flex>
                        )}
                    </StatsCard>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        $delay={3}
                        $pulse={pendingCount > 0}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex vertical gap={2}>
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                                    {t('kpi.pendingActions', 'Pending Actions')}
                                </Text>
                                <BigNumber style={{ color: COLORS.pending }}>{pendingCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 10 }}>
                                    {t('kpi.last24h', 'Last 24 hours')}
                                </Text>
                            </Flex>
                        )}
                    </StatsCard>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
                        $delay={4}
                        $pulse={errorCount > 0}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex vertical gap={2}>
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                                    {t('kpi.errors', 'Errors')}
                                </Text>
                                <BigNumber style={{ color: errorCount > 0 ? COLORS.error : '#64748b' }}>
                                    {errorCount}
                                </BigNumber>
                                {errorCount > 0 ? (
                                    <Tag color="red" icon={<WarningOutlined />} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>{t('kpi.requiresAttention')}</Tag>
                                ) : (
                                    <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>{t('kpi.allClear')}</Tag>
                                )}
                            </Flex>
                        )}
                    </StatsCard>
                </KPIGridContainer>

                {/* Charts Container - 4 Charts */}
                <ChartsContainer>
                    {/* Connectivity Status Chart */}
                    <ChartCard
                        title={
                            <Flex align="center" gap={6}>
                                <WifiOutlined style={{ color: COLORS.online, fontSize: 14 }} />
                                <span>{t('chart.connectivityStatus', 'Connectivity')}</span>
                            </Flex>
                        }
                        $delay={5}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                        ) : connectivityPieData.length > 0 ? (
                            <Flex vertical style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height={100}>
                                    <PieChart>
                                        <Pie
                                            data={connectivityPieData}
                                            innerRadius={28}
                                            outerRadius={40}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {connectivityPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {renderCustomLegend(connectivityPieData)}
                            </Flex>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>

                    {/* Deployment Rate Chart */}
                    <ChartCard
                        title={
                            <Flex align="center" gap={6}>
                                <ThunderboltOutlined style={{ color: COLORS.finished, fontSize: 14 }} />
                                <span>{t('chart.deploymentRate', 'Deployment')}</span>
                            </Flex>
                        }
                        $delay={6}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 2 }} />
                        ) : (
                            <Flex vertical align="center" justify="center" style={{ flex: 1 }}>
                                <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.finished }}>
                                    {deploymentRate !== null ? `${deploymentRate}%` : '-'}
                                </div>
                                <Text type="secondary" style={{ fontSize: 10, marginTop: 4 }}>
                                    {t('chart.deploymentRateDesc', 'Target completion')}
                                </Text>
                                <Progress
                                    percent={deploymentRate ?? 0}
                                    strokeColor={COLORS.finished}
                                    style={{ width: '90%', marginTop: 8 }}
                                    size="small"
                                />
                                <Text type="secondary" style={{ fontSize: 10, marginTop: 4 }}>
                                    {deploymentRateLabel}
                                </Text>
                            </Flex>
                        )}
                    </ChartCard>

                    {/* Rollout Status Chart */}
                    <ChartCard
                        title={
                            <Flex align="center" gap={6}>
                                <PlayCircleOutlined style={{ color: COLORS.running, fontSize: 14 }} />
                                <span>{t('chart.rolloutStatus', 'Rollout')}</span>
                            </Flex>
                        }
                        $delay={7}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                        ) : rolloutStatusData.length > 0 ? (
                            <Flex vertical style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height={100}>
                                    <PieChart>
                                        <Pie
                                            data={rolloutStatusData}
                                            innerRadius={28}
                                            outerRadius={40}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {rolloutStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {renderCustomLegend(rolloutStatusData)}
                            </Flex>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>

                    {/* Action Status Chart */}
                    <ChartCard
                        title={
                            <Flex align="center" gap={6}>
                                <SyncOutlined style={{ color: COLORS.running, fontSize: 14 }} />
                                <span>{t('chart.actionStatus', 'Actions (24h)')}</span>
                            </Flex>
                        }
                        $delay={8}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                        ) : actionStatusData.length > 0 ? (
                            <Flex vertical style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height={100}>
                                    <PieChart>
                                        <Pie
                                            data={actionStatusData}
                                            innerRadius={28}
                                            outerRadius={40}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {actionStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {renderCustomLegend(actionStatusData)}
                            </Flex>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </ChartsContainer>
            </TopRow>

            {/* Bottom Row: Recent Devices + Recent Actions + Device Grid */}
            <BottomRow>
                {/* Recent Device Status */}
                <ListCard
                    title={t('recentDevices.title', 'Recent Device Activity')}
                    $delay={9}
                >
                    {isLoading ? (
                        <Skeleton active paragraph={{ rows: 4 }} />
                    ) : recentDevices.length > 0 ? (
                        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <AirportSlideList
                                items={recentDevices}
                                itemHeight={52}
                                visibleCount={4}
                                interval={3000}
                                fullHeight={true}
                                renderItem={(record: MgmtTarget) => (
                                    <Flex
                                        key={record.controllerId}
                                        align="center"
                                        justify="space-between"
                                        style={{
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            height: '100%',
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.01)',
                                            borderRadius: 6,
                                        }}
                                        onClick={() => navigate(`/targets/${record.controllerId}`)}
                                    >
                                        <Flex align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: record.pollStatus?.overdue ? '#fef3c7' : '#d1fae5',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <WifiOutlined style={{
                                                    fontSize: 16,
                                                    color: record.pollStatus?.overdue ? COLORS.offline : COLORS.online
                                                }} />
                                            </div>
                                            <Flex vertical gap={0} style={{ minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {record.name || record.controllerId}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 10 }}>
                                                    {record.pollStatus?.lastRequestAt ? dayjs(record.pollStatus.lastRequestAt).format('HH:mm:ss') : '-'}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                        <Tag color={record.pollStatus?.overdue ? 'warning' : 'success'} style={{ margin: 0, fontSize: 10 }}>
                                            {record.pollStatus?.overdue ? t('common:status.offline', 'Offline') : t('common:status.online', 'Online')}
                                        </Tag>
                                    </Flex>
                                )}
                            />
                        </div>
                    ) : (
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Text type="secondary">{t('common:messages.noData')}</Text>
                        </Flex>
                    )}
                </ListCard>

                {/* Recent Actions */}
                <ListCard
                    title={t('recentActions.title', 'Recent Actions (24h)')}
                    $delay={10}
                >
                    {isLoading ? (
                        <Skeleton active paragraph={{ rows: 4 }} />
                    ) : recentActionsList.length > 0 ? (
                        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <AirportSlideList
                                items={recentActionsList}
                                itemHeight={52}
                                visibleCount={4}
                                interval={3500}
                                fullHeight={true}
                                renderItem={(record: MgmtAction) => {
                                    const displayStatus = getActionDisplayStatus(record);
                                    let targetId = record._links?.target?.href?.split('/').pop();
                                    if (!targetId && record._links?.self?.href) {
                                        const match = record._links.self.href.match(/targets\/([^/]+)\/actions/);
                                        if (match) targetId = match[1];
                                    }
                                    const targetInfo = targetId ? targetMap.get(targetId) : undefined;
                                    const actionType = record.type === 'update' ? t('actionType.update', 'Update') :
                                        record.type === 'cancel' ? t('actionType.cancel', 'Cancel') :
                                            record.type === 'download' ? t('actionType.download', 'Download') :
                                                record.type || t('actionType.deploy', 'Deploy');

                                    return (
                                        <Flex
                                            key={record.id}
                                            align="center"
                                            justify="space-between"
                                            style={{
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                                height: '100%',
                                                width: '100%',
                                                background: 'rgba(0,0,0,0.01)',
                                                borderRadius: 6,
                                            }}
                                            onClick={() => navigate(`/actions/${record.id}`)}
                                        >
                                            <Flex align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 6,
                                                    background: displayStatus === 'error' ? '#fef2f2' :
                                                        displayStatus === 'finished' ? '#f0fdf4' : '#eff6ff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {getActionStatusIcon(displayStatus)}
                                                </div>
                                                <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                                                    <Flex gap={6} align="center">
                                                        <Text strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {targetInfo?.name || targetId || t('common:unknownDevice')}
                                                        </Text>
                                                        <Tag color="geekblue" style={{ margin: 0, fontSize: 9, padding: '0 4px', lineHeight: '16px' }}>
                                                            {actionType}
                                                        </Tag>
                                                    </Flex>
                                                    <Flex gap={8} align="center">
                                                        <Text type="secondary" style={{ fontSize: 10 }}>
                                                            {targetInfo?.ip || '-'}
                                                        </Text>
                                                        <Text type="secondary" style={{ fontSize: 10 }}>
                                                            {record.createdAt ? dayjs(record.createdAt).format('HH:mm') : '-'}
                                                        </Text>
                                                    </Flex>
                                                </Flex>
                                            </Flex>
                                            <Tag
                                                color={getActionStatusColor(displayStatus)}
                                                icon={getActionStatusIcon(displayStatus)}
                                                style={{ margin: 0, fontSize: 10, padding: '2px 6px' }}
                                            >
                                                {getStatusLabel(displayStatus)}
                                            </Tag>
                                        </Flex>
                                    );
                                }}
                            />
                        </div>
                    ) : (
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Text type="secondary">{t('common:messages.noData')}</Text>
                        </Flex>
                    )}
                </ListCard>

                {/* Device Card Grid */}
                <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <DeviceCardGrid
                        targets={targets}
                        actions={actions}
                        loading={isLoading}
                        title={t('deviceGrid.title', 'Device Status Grid')}
                        delay={11}
                        cols={3}
                        rows={3}
                        gap={6}
                        rowHeight={80}
                    />
                </div>
            </BottomRow>
        </PageContainer>
    );
};

export default Dashboard;
