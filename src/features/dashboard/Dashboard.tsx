import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Button, Flex, Skeleton, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import {
    CloudServerOutlined,
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
    height: 100%;
    min-height: 100%;
    overflow: auto;
    animation: ${fadeInUp} 0.5s ease-out;
`;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
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
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
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
    
    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
    
    .ant-card-head-title {
        font-size: 15px;
        font-weight: 600;
        color: #334155;
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
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 4px;
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
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
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
    const deploymentRate = totalRolloutTargets > 0
        ? Math.round((finishedRolloutTargets / totalRolloutTargets) * 100)
        : null;

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
                    <GradientTitle level={2}>
                        {t('title', 'Operations Dashboard')}
                    </GradientTitle>
                    <Flex align="center" gap={12}>
                        <Text type="secondary" style={{ fontSize: 15 }}>
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
                    >
                        {t('refresh', 'Refresh')}
                    </Button>
                </Flex>
            </PageHeader>

            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        $delay={1}
                        onClick={() => navigate('/targets')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('kpi.connectivity', 'Connectivity')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.online }}>{onlineCount}/{totalDevices}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {t('kpi.onlineDevices', 'online devices')}
                                    </Text>
                                </div>
                                <CloudServerOutlined style={{ fontSize: 32, color: COLORS.online, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                        $delay={2}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
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
                                        style={{ width: 100 }}
                                    />
                                </div>
                                <CheckCircleOutlined style={{ fontSize: 32, color: COLORS.success, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        $delay={3}
                        $pulse={pendingCount > 0}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('kpi.pendingActions', 'Pending Actions')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.pending }}>{pendingCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {t('kpi.last24h', 'Last 24 hours')}
                                    </Text>
                                </div>
                                <ClockCircleOutlined style={{ fontSize: 32, color: COLORS.pending, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
                        $delay={4}
                        $pulse={errorCount > 0}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('kpi.errors', 'Errors')}
                                    </Text>
                                    <BigNumber style={{ color: errorCount > 0 ? COLORS.error : '#64748b' }}>
                                        {errorCount}
                                    </BigNumber>
                                    {errorCount > 0 ? (
                                        <Tag color="red" icon={<WarningOutlined />}>{t('kpi.requiresAttention')}</Tag>
                                    ) : (
                                        <Tag color="green" icon={<CheckCircleOutlined />}>{t('kpi.allClear')}</Tag>
                                    )}
                                </div>
                                <WarningOutlined style={{ fontSize: 32, color: COLORS.error, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]}>
                {/* Connectivity Status Chart */}
                <Col xs={24} md={12} lg={6}>
                    <ChartCard
                        title={
                            <Flex align="center" gap={8}>
                                <WifiOutlined style={{ color: COLORS.online }} />
                                <span>{t('chart.connectivityStatus', 'Connectivity Status')}</span>
                            </Flex>
                        }
                        $delay={5}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={120} shape="circle" style={{ margin: '16px auto', display: 'block' }} />
                        ) : connectivityPieData.length > 0 ? (
                            <div>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={connectivityPieData}
                                            innerRadius={45}
                                            outerRadius={60}
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
                            </div>
                        ) : (
                            <Flex justify="center" align="center" style={{ height: 160 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>

                {/* Deployment Rate Chart */}
                <Col xs={24} md={12} lg={6}>
                    <ChartCard
                        title={
                            <Flex align="center" gap={8}>
                                <ThunderboltOutlined style={{ color: COLORS.finished }} />
                                <span>{t('chart.deploymentRate', 'Deployment Rate')}</span>
                            </Flex>
                        }
                        $delay={6}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 3 }} />
                        ) : (
                            <Flex vertical align="center" justify="center" style={{ height: 160 + 68 }}>
                                <div style={{ fontSize: 48, fontWeight: 700, color: COLORS.finished }}>
                                    {deploymentRate !== null ? `${deploymentRate}%` : '-'}
                                </div>
                                <Text type="secondary" style={{ fontSize: 13, marginTop: 8 }}>
                                    {t('chart.deploymentRateDesc', 'Target completion rate')}
                                </Text>
                                <Progress
                                    percent={deploymentRate ?? 0}
                                    strokeColor={COLORS.finished}
                                    style={{ width: '80%', marginTop: 12 }}
                                />
                                <Text type="secondary" style={{ fontSize: 11, marginTop: 8 }}>
                                    {finishedRolloutTargets} / {totalRolloutTargets} {t('chart.targets', 'targets')}
                                </Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>

                {/* Rollout Status Chart */}
                <Col xs={24} md={12} lg={6}>
                    <ChartCard
                        title={
                            <Flex align="center" gap={8}>
                                <PlayCircleOutlined style={{ color: COLORS.running }} />
                                <span>{t('chart.rolloutStatus', 'Rollout Status')}</span>
                            </Flex>
                        }
                        $delay={7}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={120} shape="circle" style={{ margin: '16px auto', display: 'block' }} />
                        ) : rolloutStatusData.length > 0 ? (
                            <div>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={rolloutStatusData}
                                            innerRadius={45}
                                            outerRadius={60}
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
                            </div>
                        ) : (
                            <Flex justify="center" align="center" style={{ height: 160 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>

                {/* Action Status Chart */}
                <Col xs={24} md={12} lg={6}>
                    <ChartCard
                        title={
                            <Flex align="center" gap={8}>
                                <SyncOutlined style={{ color: COLORS.running }} />
                                <span>{t('chart.actionStatus', 'Action Status (24h)')}</span>
                            </Flex>
                        }
                        $delay={8}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={120} shape="circle" style={{ margin: '16px auto', display: 'block' }} />
                        ) : actionStatusData.length > 0 ? (
                            <div>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={actionStatusData}
                                            innerRadius={45}
                                            outerRadius={60}
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
                            </div>
                        ) : (
                            <Flex justify="center" align="center" style={{ height: 160 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>
            </Row>

            {/* List Views Row */}
            <Row gutter={[16, 16]}>
                {/* Recent Device Status */}
                <Col xs={24} lg={12}>
                    <ChartCard
                        title={t('recentDevices.title', 'Recent Device Activity')}
                        $delay={9}
                        styles={{ body: { padding: '12px', minHeight: 280 } }}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 5 }} />
                        ) : recentDevices.length > 0 ? (
                            <AirportSlideList
                                items={recentDevices}
                                itemHeight={64}
                                visibleCount={5}
                                interval={3000}
                                renderItem={(record: MgmtTarget) => (
                                    <Flex
                                        key={record.controllerId}
                                        align="center"
                                        justify="space-between"
                                        style={{
                                            padding: '8px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                                            cursor: 'pointer',
                                            height: '100%',
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.01)',
                                            borderRadius: 8,
                                        }}
                                        onClick={() => navigate(`/targets/${record.controllerId}`)}
                                    >
                                        <Flex align="center" gap={16} style={{ flex: 1 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                background: record.pollStatus?.overdue ? '#fef3c7' : '#d1fae5',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <WifiOutlined style={{
                                                    fontSize: 20,
                                                    color: record.pollStatus?.overdue ? COLORS.offline : COLORS.online
                                                }} />
                                            </div>
                                            <Flex vertical gap={2}>
                                                <Text strong style={{ fontSize: 14 }}>
                                                    {record.name || record.controllerId}
                                                </Text>
                                                <Flex gap={8} align="center">
                                                    {record.ipAddress && (
                                                        <Tag style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>{record.ipAddress}</Tag>
                                                    )}
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        {record.pollStatus?.lastRequestAt ? dayjs(record.pollStatus.lastRequestAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </Flex>
                                        <Flex vertical align="end" gap={2}>
                                            <Tag color={record.pollStatus?.overdue ? 'warning' : 'success'} style={{ margin: 0, minWidth: 60, textAlign: 'center' }}>
                                                {record.pollStatus?.overdue ? t('common:status.offline', 'Offline') : t('common:status.online', 'Online')}
                                            </Tag>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {record.description || ''}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                )}
                            />
                        ) : (
                            <Flex justify="center" align="center" style={{ height: 200 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>

                {/* Recent Actions */}
                <Col xs={24} lg={12}>
                    <ChartCard
                        title={t('recentActions.title', 'Recent Actions (24h)')}
                        $delay={10}
                        styles={{ body: { padding: '12px', minHeight: 280 } }}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 5 }} />
                        ) : recentActionsList.length > 0 ? (
                            <AirportSlideList
                                items={recentActionsList}
                                itemHeight={64}
                                visibleCount={5}
                                interval={3500}
                                renderItem={(record: MgmtAction) => {
                                    const displayStatus = getActionDisplayStatus(record);
                                    let targetId = record._links?.target?.href?.split('/').pop();
                                    if (!targetId && record._links?.self?.href) {
                                        const match = record._links.self.href.match(/targets\/([^/]+)\/actions/);
                                        if (match) targetId = match[1];
                                    }

                                    return (
                                        <Flex
                                            key={record.id}
                                            align="center"
                                            justify="space-between"
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: '1px solid rgba(0,0,0,0.04)',
                                                cursor: 'pointer',
                                                height: '100%',
                                                width: '100%',
                                                background: 'rgba(0,0,0,0.01)',
                                                borderRadius: 8,
                                            }}
                                            onClick={() => navigate(`/actions/${record.id}`)}
                                        >
                                            <Flex align="center" gap={16} style={{ flex: 1 }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 8,
                                                    background: '#f1f5f9',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Text strong style={{ fontSize: 16, color: '#64748b' }}>#{record.id}</Text>
                                                </div>
                                                <Flex vertical gap={2}>
                                                    <Text strong style={{ fontSize: 13 }}>
                                                        {targetId || t('common:unknownDevice')}
                                                    </Text>
                                                    <Flex gap={8} align="center">
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            {record.createdAt ? dayjs(record.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                                                        </Text>
                                                    </Flex>
                                                </Flex>
                                            </Flex>
                                            <Tag
                                                color={getActionStatusColor(displayStatus)}
                                                icon={getActionStatusIcon(displayStatus)}
                                                style={{ margin: 0, borderRadius: 12, padding: '4px 10px', fontSize: 12 }}
                                            >
                                                {getStatusLabel(displayStatus)}
                                            </Tag>
                                        </Flex>
                                    );
                                }}
                            />
                        ) : (
                            <Flex justify="center" align="center" style={{ height: 200 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>
            </Row>

            {/* Device Card Grid */}
            <DeviceCardGrid
                targets={targets}
                actions={actions}
                loading={isLoading}
                title={t('deviceGrid.title', 'Device Status Grid')}
                delay={11}
            />
        </PageContainer>
    );
};

export default Dashboard;
