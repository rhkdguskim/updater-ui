import React from 'react';
import { Card, Typography, Button, Flex, Skeleton, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import {
    ReloadOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
    ThunderboltOutlined,
    HistoryOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { useGetActions } from '@/api/generated/actions/actions';
import { AirportSlideList } from '@/components/common';
import type { MgmtAction } from '@/api/generated/model';
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
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex: 0 0 400px;
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
        align-items: center;
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

const BigNumber = styled.div`
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
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
        background: #3b82f6;
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
    finished: '#10b981',   // Green
    running: '#3b82f6',    // Blue
    pending: '#f59e0b',    // Orange
    error: '#ef4444',      // Red
    canceled: '#94a3b8',   // Gray
};

const ActionsOverview: React.FC = () => {
    const { t } = useTranslation(['actions', 'common']);
    const navigate = useNavigate();

    const { data: actionsData, isLoading, refetch, dataUpdatedAt } = useGetActions({ limit: 500 });

    const actions = actionsData?.content || [];
    const totalActions = actionsData?.total ?? 0;
    const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).fromNow() : '-';

    // Count by status
    const finishedCount = actions.filter(a => a.status === 'finished').length;
    const runningCount = actions.filter(a => a.status === 'running').length;
    const pendingCount = actions.filter(a => a.status === 'pending' || a.status === 'scheduled').length;
    const errorCount = actions.filter(a => a.status === 'error').length;
    const canceledCount = actions.filter(a => a.status === 'canceled' || a.status === 'canceling').length;

    // Success rate
    const completedActions = finishedCount + errorCount;
    const successRate = completedActions > 0 ? Math.round((finishedCount / completedActions) * 100) : null;

    // Status distribution for pie chart
    const statusDistribution = React.useMemo(() => [
        { name: t('status.finished', 'Finished'), value: finishedCount, color: COLORS.finished },
        { name: t('status.running', 'Running'), value: runningCount, color: COLORS.running },
        { name: t('status.pending', 'Pending'), value: pendingCount, color: COLORS.pending },
        { name: t('status.error', 'Error'), value: errorCount, color: COLORS.error },
        { name: t('status.canceled', 'Canceled'), value: canceledCount, color: COLORS.canceled },
    ].filter(d => d.value > 0), [finishedCount, runningCount, pendingCount, errorCount, canceledCount, t]);

    // Recent actions (last 24 hours)
    const recentActions = React.useMemo(() => {
        const yesterday = Date.now() - 24 * 60 * 60 * 1000;
        return actions
            .filter(a => (a.createdAt ?? 0) > yesterday)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 10);
    }, [actions]);

    // Running/Pending actions
    const activeActions = React.useMemo(() => {
        return actions
            .filter(a => a.status === 'running' || a.status === 'pending' || a.status === 'scheduled')
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 10);
    }, [actions]);

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'finished': return <CheckCircleOutlined style={{ color: COLORS.finished }} />;
            case 'running': return <SyncOutlined spin style={{ color: COLORS.running }} />;
            case 'pending':
            case 'scheduled': return <ClockCircleOutlined style={{ color: COLORS.pending }} />;
            case 'error': return <ExclamationCircleOutlined style={{ color: COLORS.error }} />;
            default: return <HistoryOutlined style={{ color: COLORS.canceled }} />;
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'finished': return 'green';
            case 'running': return 'blue';
            case 'pending':
            case 'scheduled': return 'orange';
            case 'error': return 'red';
            default: return 'default';
        }
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
                        {t('overview.title', 'Action Management')}
                    </GradientTitle>
                    <Flex align="center" gap={12}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {t('overview.subtitle', 'Deployment actions and status overview')}
                        </Text>
                        <LiveIndicator>
                            {runningCount > 0 ? t('common:status.active', 'Active') : t('common:status.idle', 'Idle')}
                        </LiveIndicator>
                    </Flex>
                </HeaderContent>
                <Flex align="center" gap={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('common:updated', 'Updated')}: {lastUpdated}
                    </Text>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                        loading={isLoading}
                        size="small"
                    >
                        {t('common:actions.refresh', 'Refresh')}
                    </Button>
                </Flex>
            </PageHeader>

            {/* Top Row: KPI Cards (4) + 2 Charts */}
            <TopRow>
                {/* KPI Cards */}
                <KPIGridContainer>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                        $delay={1}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <ThunderboltOutlined style={{ fontSize: 24, color: '#3b82f6' }} />
                                <BigNumber style={{ color: '#3b82f6' }}>{totalActions}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.totalActions', 'Total Actions')}
                                </Text>
                            </Flex>
                        )}
                    </StatsCard>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        $delay={2}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <CheckCircleOutlined style={{ fontSize: 24, color: COLORS.finished }} />
                                <BigNumber style={{ color: COLORS.finished }}>
                                    {successRate !== null ? `${successRate}%` : '-'}
                                </BigNumber>
                                <Progress
                                    percent={successRate ?? 0}
                                    size="small"
                                    strokeColor={COLORS.finished}
                                    showInfo={false}
                                    style={{ width: 60 }}
                                />
                            </Flex>
                        )}
                    </StatsCard>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        $delay={3}
                        $pulse={runningCount > 0}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <PlayCircleOutlined style={{ fontSize: 24, color: COLORS.running }} />
                                <BigNumber style={{ color: COLORS.running }}>{runningCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('status.running', 'Running')}
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
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <ExclamationCircleOutlined style={{ fontSize: 24, color: errorCount > 0 ? COLORS.error : '#64748b' }} />
                                <BigNumber style={{ color: errorCount > 0 ? COLORS.error : '#64748b' }}>{errorCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('status.error', 'Error')}
                                </Text>
                            </Flex>
                        )}
                    </StatsCard>
                </KPIGridContainer>

                {/* Charts Container */}
                <ChartsContainer>
                    {/* Status Distribution */}
                    <ChartCard
                        title={
                            <Flex align="center" gap={6}>
                                <ThunderboltOutlined style={{ color: COLORS.running, fontSize: 14 }} />
                                <span>{t('overview.statusDistribution', 'Status Distribution')}</span>
                            </Flex>
                        }
                        $delay={5}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                        ) : statusDistribution.length > 0 ? (
                            <Flex vertical style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height={100}>
                                    <PieChart>
                                        <Pie
                                            data={statusDistribution}
                                            innerRadius={28}
                                            outerRadius={42}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {renderCustomLegend(statusDistribution.slice(0, 4))}
                            </Flex>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>

                    {/* Active Summary */}
                    <ChartCard
                        title={
                            <Flex align="center" gap={6}>
                                <SyncOutlined spin={runningCount > 0} style={{ color: COLORS.running, fontSize: 14 }} />
                                <span>{t('overview.activeSummary', 'Active Summary')}</span>
                            </Flex>
                        }
                        $delay={6}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 3 }} />
                        ) : (
                            <Flex vertical gap={8} style={{ flex: 1 }}>
                                <Flex align="center" justify="space-between" style={{ padding: '6px 10px', background: `${COLORS.running}10`, borderRadius: 6 }}>
                                    <Flex align="center" gap={8}>
                                        <SyncOutlined spin style={{ color: COLORS.running }} />
                                        <Text style={{ fontSize: 12 }}>{t('status.running', 'Running')}</Text>
                                    </Flex>
                                    <Text strong style={{ fontSize: 16, color: COLORS.running }}>{runningCount}</Text>
                                </Flex>
                                <Flex align="center" justify="space-between" style={{ padding: '6px 10px', background: `${COLORS.pending}10`, borderRadius: 6 }}>
                                    <Flex align="center" gap={8}>
                                        <ClockCircleOutlined style={{ color: COLORS.pending }} />
                                        <Text style={{ fontSize: 12 }}>{t('status.pending', 'Pending')}</Text>
                                    </Flex>
                                    <Text strong style={{ fontSize: 16, color: COLORS.pending }}>{pendingCount}</Text>
                                </Flex>
                                <Flex align="center" justify="space-between" style={{ padding: '6px 10px', background: `${COLORS.finished}10`, borderRadius: 6 }}>
                                    <Flex align="center" gap={8}>
                                        <CheckCircleOutlined style={{ color: COLORS.finished }} />
                                        <Text style={{ fontSize: 12 }}>{t('status.finished', 'Finished')}</Text>
                                    </Flex>
                                    <Text strong style={{ fontSize: 16, color: COLORS.finished }}>{finishedCount}</Text>
                                </Flex>
                            </Flex>
                        )}
                    </ChartCard>
                </ChartsContainer>
            </TopRow>

            {/* Bottom Row: Active Actions + Recent Actions */}
            <BottomRow>
                {/* Active Actions */}
                <ListCard
                    title={t('overview.activeActions', 'Active Actions')}
                    $delay={7}
                >
                    {isLoading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                    ) : activeActions.length > 0 ? (
                        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <AirportSlideList
                                items={activeActions}
                                itemHeight={52}
                                visibleCount={5}
                                interval={3000}
                                fullHeight={true}
                                renderItem={(record: MgmtAction) => (
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
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: `${COLORS.running}15`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {getStatusIcon(record.status)}
                                            </div>
                                            <Flex vertical gap={0} style={{ minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    Action #{record.id}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 10 }}>
                                                    {record.createdAt ? dayjs(record.createdAt).format('HH:mm:ss') : '-'}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                        <Tag color={getStatusColor(record.status)} style={{ margin: 0, fontSize: 10 }}>
                                            {record.status}
                                        </Tag>
                                    </Flex>
                                )}
                            />
                        </div>
                    ) : (
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Text type="secondary">{t('overview.noActiveActions', 'No active actions')}</Text>
                        </Flex>
                    )}
                </ListCard>

                {/* Recent Actions */}
                <ListCard
                    title={t('overview.recentActions', 'Recent Actions (24h)')}
                    $delay={8}
                >
                    {isLoading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                    ) : recentActions.length > 0 ? (
                        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <AirportSlideList
                                items={recentActions}
                                itemHeight={52}
                                visibleCount={5}
                                interval={3500}
                                fullHeight={true}
                                renderItem={(record: MgmtAction) => (
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
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: record.status === 'finished' ? `${COLORS.finished}15` :
                                                    record.status === 'error' ? `${COLORS.error}15` : `${COLORS.pending}15`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {getStatusIcon(record.status)}
                                            </div>
                                            <Flex vertical gap={0} style={{ minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    Action #{record.id}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 10 }}>
                                                    {record.createdAt ? dayjs(record.createdAt).fromNow() : '-'}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                        <Tag color={getStatusColor(record.status)} style={{ margin: 0, fontSize: 10 }}>
                                            {record.status}
                                        </Tag>
                                    </Flex>
                                )}
                            />
                        </div>
                    ) : (
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Text type="secondary">{t('overview.noRecentActions', 'No recent actions')}</Text>
                        </Flex>
                    )}
                </ListCard>
            </BottomRow>
        </PageContainer>
    );
};

export default ActionsOverview;
