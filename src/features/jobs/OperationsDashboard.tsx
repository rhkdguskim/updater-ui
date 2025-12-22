import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Button, Flex, Skeleton, Tag, Progress, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import {
    ThunderboltOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
    ReloadOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    WarningOutlined,
    RightOutlined,
    RocketOutlined,
    AimOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import { useGetActions } from '@/api/generated/actions/actions';
import type { MgmtAction } from '@/api/generated/model';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

// ============================================================================
// Polling Optimization: Fast when active, slow when idle
// ============================================================================
const POLLING_FAST = 5000;
const POLLING_SLOW = 30000;
const STALE_TIME = 5000;

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
    border-radius: 20px;
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
    min-height: 100px;

    .ant-card-body {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

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

const QuickAccessCard = styled(Card) <{ $delay?: number }>`
    border: none;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
    }
`;

const ChartCard = styled(Card) <{ $delay?: number }>`
    border: none;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    
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

const COLORS = {
    running: '#3b82f6',
    approval: '#8b5cf6',
    finished: '#10b981',
    error: '#ef4444',
    stopped: '#f59e0b',
};

const isActionErrored = (action: MgmtAction) => {
    const status = action.status?.toLowerCase() || '';
    const detail = action.detailStatus?.toLowerCase() || '';
    const hasErrorStatus = status === 'error' || status === 'failed';
    const hasErrorDetail = detail.includes('error') || detail.includes('failed');
    const hasErrorCode = typeof action.lastStatusCode === 'number' && action.lastStatusCode >= 400;
    return hasErrorStatus || hasErrorDetail || hasErrorCode;
};

const OperationsDashboard: React.FC = () => {
    const { t } = useTranslation('jobs');
    const navigate = useNavigate();

    // Adaptive Polling
    const { data: rolloutsData, isLoading: rolloutsLoading, refetch: refetchRollouts, dataUpdatedAt } = useGetRollouts(
        { limit: 100 },
        {
            query: {
                staleTime: STALE_TIME,
                refetchOnWindowFocus: true,
                refetchInterval: (query) => {
                    const rollouts = query.state.data?.content || [];
                    const hasActiveRollouts = rollouts.some(r =>
                        ['running', 'starting', 'waiting_for_approval'].includes(r.status?.toLowerCase() || '')
                    );
                    return hasActiveRollouts ? POLLING_FAST : POLLING_SLOW;
                },
            },
        }
    );

    const { data: actionsData, isLoading: actionsLoading, refetch: refetchActions } = useGetActions(
        { limit: 100 },
        {
            query: {
                staleTime: STALE_TIME,
                refetchOnWindowFocus: true,
                refetchInterval: (query) => {
                    const actions = query.state.data?.content || [];
                    const hasActiveActions = actions.some(a =>
                        ['running', 'retrieving', 'pending'].includes(a.status?.toLowerCase() || '')
                    );
                    return hasActiveActions ? POLLING_FAST : POLLING_SLOW;
                },
            },
        }
    );

    const isLoading = rolloutsLoading || actionsLoading;
    const refetch = () => { refetchRollouts(); refetchActions(); };
    const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).fromNow() : '-';

    // Rollouts stats
    const rollouts = rolloutsData?.content || [];
    const activeRolloutCount = rollouts.filter(r =>
        ['running', 'starting'].includes(r.status?.toLowerCase() || '')
    ).length;
    const waitingApprovalCount = rollouts.filter(r =>
        r.status?.toLowerCase() === 'waiting_for_approval'
    ).length;
    const criticalAlertCount = rollouts.filter(r =>
        ['error', 'stopped'].includes(r.status?.toLowerCase() || '')
    ).length;
    const finishedRolloutCount = rollouts.filter(r =>
        r.status?.toLowerCase() === 'finished'
    ).length;

    // Actions stats
    const actions = actionsData?.content || [];
    const recentActions = actions.filter(a =>
        a.createdAt && dayjs(a.createdAt).isAfter(dayjs().subtract(24, 'hour'))
    );
    const runningActionsCount = recentActions.filter(a =>
        ['running', 'retrieving'].includes(a.status?.toLowerCase() || '') && !isActionErrored(a)
    ).length;
    const errorActionsCount = recentActions.filter(isActionErrored).length;
    const finishedActionsCount = recentActions.filter(a =>
        a.status?.toLowerCase() === 'finished' && !isActionErrored(a)
    ).length;

    // Success Rate
    const totalRolloutTargets = rollouts.reduce((sum, r) => sum + (r.totalTargets || 0), 0);
    const finishedRolloutTargets = rollouts.reduce(
        (sum, r) => sum + (r.totalTargetsPerStatus?.finished || 0), 0
    );
    const successRate = totalRolloutTargets > 0
        ? Math.round((finishedRolloutTargets / totalRolloutTargets) * 100)
        : null;

    // Pie chart data
    const rolloutStatusData = useMemo(() => [
        { name: t('status.running', 'Running'), value: activeRolloutCount, color: COLORS.running },
        { name: t('status.waiting_for_approval', 'Waiting'), value: waitingApprovalCount, color: COLORS.approval },
        { name: t('status.finished', 'Finished'), value: finishedRolloutCount, color: COLORS.finished },
        { name: t('status.error', 'Error/Stopped'), value: criticalAlertCount, color: COLORS.error },
    ].filter(d => d.value > 0), [activeRolloutCount, waitingApprovalCount, finishedRolloutCount, criticalAlertCount, t]);

    const isActivePolling = activeRolloutCount > 0 || waitingApprovalCount > 0 || runningActionsCount > 0;

    return (
        <PageContainer>
            <PageHeader>
                <HeaderContent>
                    <GradientTitle level={2}>
                        {t('operationsTitle', 'Operations Dashboard')}
                    </GradientTitle>
                    <Flex align="center" gap={12}>
                        <Text type="secondary" style={{ fontSize: 15 }}>
                            {t('operationsSubtitle', 'Rollout monitoring & control center')}
                        </Text>
                        <LiveIndicator>
                            {isActivePolling ? t('polling.fast', 'Live (5s)') : t('polling.slow', 'Idle (30s)')}
                        </LiveIndicator>
                    </Flex>
                </HeaderContent>
                <Flex align="center" gap={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('lastUpdated', 'Updated')}: {lastUpdated}
                    </Text>
                    <Button icon={<ReloadOutlined />} onClick={refetch} loading={isLoading}>
                        {t('actions.refresh', 'Refresh')}
                    </Button>
                </Flex>
            </PageHeader>

            {/* KPI Cards - Rollout Focused */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                        $delay={1}
                        $pulse={activeRolloutCount > 0}
                        onClick={() => navigate('/rollouts/list?status=running')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('kpi.activeRollouts', 'Active Rollouts')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.running }}>{activeRolloutCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {runningActionsCount} {t('kpi.runningActions', 'running')}
                                        {errorActionsCount > 0 && (
                                            <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>
                                                {errorActionsCount} {t('kpi.errors', 'errors')}
                                            </Tag>
                                        )}
                                    </Text>
                                </div>
                                <PlayCircleOutlined style={{ fontSize: 32, color: COLORS.running, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)"
                        $delay={2}
                        $pulse={waitingApprovalCount > 0}
                        onClick={() => navigate('/rollouts/list?status=waiting_for_approval')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('kpi.waitingApproval', 'Waiting Approval')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.approval }}>{waitingApprovalCount}</BigNumber>
                                    {waitingApprovalCount > 0 && (
                                        <Tag color="purple" icon={<ClockCircleOutlined />}>
                                            {t('kpi.requiresReview', 'Requires review')}
                                        </Tag>
                                    )}
                                </div>
                                <PauseCircleOutlined style={{ fontSize: 32, color: COLORS.approval, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor={criticalAlertCount > 0
                            ? "linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
                            : "linear-gradient(135deg, #10b981 0%, #34d399 100%)"}
                        $delay={3}
                        $pulse={criticalAlertCount > 0}
                        onClick={() => navigate('/rollouts/list?status=error,stopped')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('kpi.criticalAlerts', 'Critical Alerts')}
                                    </Text>
                                    <BigNumber style={{ color: criticalAlertCount > 0 ? COLORS.error : COLORS.finished }}>
                                        {criticalAlertCount}
                                    </BigNumber>
                                    {criticalAlertCount > 0 ? (
                                        <Tag color="red" icon={<WarningOutlined />}>
                                            {t('kpi.immediateAttention', 'Needs attention')}
                                        </Tag>
                                    ) : (
                                        <Tag color="green" icon={<CheckCircleOutlined />}>
                                            {t('kpi.allClear', 'All clear')}
                                        </Tag>
                                    )}
                                </div>
                                <ExclamationCircleOutlined style={{ fontSize: 32, color: criticalAlertCount > 0 ? COLORS.error : COLORS.finished, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        $delay={4}
                        onClick={() => navigate('/rollouts')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('kpi.successRate', 'Success Rate')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.finished }}>
                                        {successRate !== null ? `${successRate}%` : '-'}
                                    </BigNumber>
                                    <Progress
                                        percent={successRate ?? 0}
                                        size="small"
                                        strokeColor={COLORS.finished}
                                        showInfo={false}
                                        style={{ width: 100 }}
                                    />
                                </div>
                                <ThunderboltOutlined style={{ fontSize: 32, color: COLORS.finished, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
            </Row>

            {/* Quick Access & Chart Row */}
            <Row gutter={[16, 16]}>
                {/* Rollout Status Chart */}
                <Col xs={24} lg={8}>
                    <ChartCard title={t('chart.rolloutStatus', 'Rollout Status')} $delay={5}>
                        {isLoading ? (
                            <Skeleton.Avatar active size={150} shape="circle" style={{ margin: '20px auto', display: 'block' }} />
                        ) : rolloutStatusData.length > 0 ? (
                            <div style={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={rolloutStatusData}
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {rolloutStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.running }}>{rollouts.length}</div>
                                    <div style={{ fontSize: 10, color: '#64748b' }}>{t('chart.total', 'total')}</div>
                                </div>
                                <Flex justify="center" wrap gap={10} style={{ marginTop: 4 }}>
                                    {rolloutStatusData.map((entry, index) => (
                                        <Flex key={index} align="center" gap={4}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
                                            <Text style={{ fontSize: 11 }}>{entry.name} ({entry.value})</Text>
                                        </Flex>
                                    ))}
                                </Flex>
                            </div>
                        ) : (
                            <Flex justify="center" align="center" style={{ height: 180 }}>
                                <Text type="secondary">{t('messages.noRollouts', 'No rollouts')}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>

                {/* Quick Access Cards */}
                <Col xs={24} lg={16}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <QuickAccessCard $delay={6} onClick={() => navigate('/rollouts')}>
                                <Flex justify="space-between" align="center">
                                    <Space direction="vertical" size={4}>
                                        <Flex align="center" gap={8}>
                                            <RocketOutlined style={{ fontSize: 24, color: COLORS.running }} />
                                            <Text strong style={{ fontSize: 16 }}>{t('quickAccess.rollouts', 'Rollouts')}</Text>
                                        </Flex>
                                        <Text type="secondary">{t('quickAccess.rolloutsDesc', 'Manage rollout deployments')}</Text>
                                        <Space style={{ marginTop: 8 }}>
                                            <Tag color="blue">{rollouts.length} {t('quickAccess.total', 'total')}</Tag>
                                            {activeRolloutCount > 0 && <Tag color="processing">{activeRolloutCount} {t('status.running', 'running')}</Tag>}
                                        </Space>
                                    </Space>
                                    <RightOutlined style={{ fontSize: 16, color: '#94a3b8' }} />
                                </Flex>
                            </QuickAccessCard>
                        </Col>
                        <Col xs={24} sm={12}>
                            <QuickAccessCard $delay={7} onClick={() => navigate('/actions')}>
                                <Flex justify="space-between" align="center">
                                    <Space direction="vertical" size={4}>
                                        <Flex align="center" gap={8}>
                                            <AimOutlined style={{ fontSize: 24, color: COLORS.approval }} />
                                            <Text strong style={{ fontSize: 16 }}>{t('quickAccess.actions', 'Actions')}</Text>
                                        </Flex>
                                        <Text type="secondary">{t('quickAccess.actionsDesc', 'Track device actions')}</Text>
                                        <Space style={{ marginTop: 8 }}>
                                            <Tag color="default">{recentActions.length} {t('quickAccess.last24h', 'last 24h')}</Tag>
                                            {runningActionsCount > 0 && <Tag color="processing"><SyncOutlined spin /> {runningActionsCount}</Tag>}
                                            {errorActionsCount > 0 && <Tag color="error">{errorActionsCount} {t('kpi.errors', 'errors')}</Tag>}
                                        </Space>
                                    </Space>
                                    <RightOutlined style={{ fontSize: 16, color: '#94a3b8' }} />
                                </Flex>
                            </QuickAccessCard>
                        </Col>
                        <Col xs={24}>
                            <ChartCard title={t('chart.actionSummary', 'Action Summary (24h)')} $delay={8}>
                                <Flex justify="space-around" align="center" style={{ padding: '16px 0' }}>
                                    <Flex vertical align="center" gap={4}>
                                        <Text style={{ fontSize: 28, fontWeight: 700, color: COLORS.running }}>{runningActionsCount}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{t('status.running', 'Running')}</Text>
                                    </Flex>
                                    <Flex vertical align="center" gap={4}>
                                        <Text style={{ fontSize: 28, fontWeight: 700, color: COLORS.finished }}>{finishedActionsCount}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{t('status.finished', 'Finished')}</Text>
                                    </Flex>
                                    <Flex vertical align="center" gap={4}>
                                        <Text style={{ fontSize: 28, fontWeight: 700, color: errorActionsCount > 0 ? COLORS.error : '#64748b' }}>{errorActionsCount}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{t('status.error', 'Errors')}</Text>
                                    </Flex>
                                    <Button type="primary" onClick={() => navigate('/actions')}>
                                        {t('quickAccess.viewAll', 'View All')} <RightOutlined />
                                    </Button>
                                </Flex>
                            </ChartCard>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default OperationsDashboard;
