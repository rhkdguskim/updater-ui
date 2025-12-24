import React from 'react';
import { Typography, Button, Flex, Skeleton, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useGetActions } from '@/api/generated/actions/actions';
import { AirportSlideList, ActiveUpdatesCard } from '@/components/common';
import { ActionTimeline } from '@/components/common/ActionTimeline';
import type { MgmtAction } from '@/api/generated/model';
import {
    OverviewPageContainer,
    OverviewPageHeader,
    HeaderContent,
    OverviewScrollContent,
    GradientTitle,
    TopRow,
    BottomRow,
    KPIGridContainer,
    ChartsContainer,
    OverviewStatsCard,
    OverviewChartCard,
    OverviewListCard,
    IconBadge,
    BigNumber,
    LiveIndicator,
    ChartLegendItem,
    ActivityItem,
    COLORS,
} from '@/components/shared/OverviewStyles';

dayjs.extend(relativeTime);

const { Text } = Typography;

const ACTION_COLORS = {
    finished: '#10b981',
    running: '#3b82f6',
    pending: '#f59e0b',
    error: '#ef4444',
    canceled: '#94a3b8',
};

const ActionsOverview: React.FC = () => {
    const { t } = useTranslation(['actions', 'common']);
    const navigate = useNavigate();

    const { data: actionsData, isLoading, refetch, dataUpdatedAt } = useGetActions(
        { limit: 500 },
        { query: { staleTime: 2000, refetchInterval: 2000 } }
    );

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
        { name: t('status.finished', 'Finished'), value: finishedCount, color: ACTION_COLORS.finished },
        { name: t('status.running', 'Running'), value: runningCount, color: ACTION_COLORS.running },
        { name: t('status.pending', 'Pending'), value: pendingCount, color: ACTION_COLORS.pending },
        { name: t('status.error', 'Error'), value: errorCount, color: ACTION_COLORS.error },
        { name: t('status.canceled', 'Canceled'), value: canceledCount, color: ACTION_COLORS.canceled },
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
            case 'finished': return <CheckCircleOutlined style={{ color: ACTION_COLORS.finished }} />;
            case 'running': return <SyncOutlined spin style={{ color: ACTION_COLORS.running }} />;
            case 'pending':
            case 'scheduled': return <ClockCircleOutlined style={{ color: ACTION_COLORS.pending }} />;
            case 'error': return <ExclamationCircleOutlined style={{ color: ACTION_COLORS.error }} />;
            default: return <HistoryOutlined style={{ color: ACTION_COLORS.canceled }} />;
        }
    };

    // Extract target ID from action links
    const getTargetId = (action: MgmtAction) => {
        let targetId = action._links?.target?.href?.split('/').pop();
        if (!targetId && action._links?.self?.href) {
            const match = action._links.self.href.match(/targets\/([^/]+)\/actions/);
            if (match) targetId = match[1];
        }
        return targetId || `#${action.id}`;
    };


    // Custom Legend Renderer
    const renderCustomLegend = (data: { name: string; value: number; color: string }[]) => (
        <Flex vertical gap={4} style={{ marginTop: 4 }}>
            {data.map(entry => (
                <ChartLegendItem key={entry.name}>
                    <Flex align="center" gap={6}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.color, boxShadow: `0 1px 3px ${entry.color}40` }} />
                        <Text style={{ fontSize: 11, color: '#475569' }}>{entry.name}</Text>
                    </Flex>
                    <Text strong style={{ fontSize: 12, color: entry.color }}>{entry.value}</Text>
                </ChartLegendItem>
            ))}
        </Flex>
    );

    return (
        <OverviewPageContainer>
            <OverviewPageHeader>
                <HeaderContent>
                    <GradientTitle level={3} $theme="actions">
                        {t('overview.title', 'Action Management')}
                    </GradientTitle>
                    <Flex align="center" gap={12}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {t('overview.subtitle', 'Deployment actions and status overview')}
                        </Text>
                        <LiveIndicator $active={runningCount > 0} $color={COLORS.actions}>
                            {runningCount > 0 ? t('common:status.active', 'Active') : t('common:status.idle', 'Idle')}
                        </LiveIndicator>
                    </Flex>
                </HeaderContent>
                <Flex align="center" gap={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('common:updated', 'Updated')}: {lastUpdated}
                    </Text>
                    <Button
                        type="primary"
                        onClick={() => navigate('/actions/list')}
                        size="small"
                    >
                        {t('overview.viewAllActions', 'View All Actions')}
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                        loading={isLoading}
                        size="small"
                    >
                        {t('common:actions.refresh', 'Refresh')}
                    </Button>
                </Flex>
            </OverviewPageHeader>

            <OverviewScrollContent>
                {/* Top Row: KPI Cards + 2 Charts */}
                <TopRow>
                    <KPIGridContainer>
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                            $delay={1}
                            onClick={() => navigate('/actions')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $theme="actions">
                                        <ThunderboltOutlined />
                                    </IconBadge>
                                    <BigNumber $color="#3b82f6">{totalActions}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('overview.totalActions', 'Total Actions')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                            $delay={2}
                            onClick={() => navigate('/actions')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
                                        <CheckCircleOutlined />
                                    </IconBadge>
                                    <BigNumber $color={ACTION_COLORS.finished}>
                                        {successRate !== null ? `${successRate}%` : '-'}
                                    </BigNumber>
                                    <Progress
                                        percent={successRate ?? 0}
                                        size="small"
                                        strokeColor={ACTION_COLORS.finished}
                                        showInfo={false}
                                        style={{ width: 60 }}
                                    />
                                </Flex>
                            )}
                        </OverviewStatsCard>
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                            $delay={3}
                            $pulse={runningCount > 0}
                            onClick={() => navigate('/actions')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
                                        <PlayCircleOutlined />
                                    </IconBadge>
                                    <BigNumber $color={ACTION_COLORS.running}>{runningCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('status.running', 'Running')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
                            $delay={4}
                            $pulse={errorCount > 0}
                            onClick={() => navigate('/actions')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
                                        <ExclamationCircleOutlined />
                                    </IconBadge>
                                    <BigNumber $color={errorCount > 0 ? ACTION_COLORS.error : '#64748b'}>{errorCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('status.error', 'Error')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>
                    </KPIGridContainer>

                    <ChartsContainer>
                        <OverviewChartCard
                            $theme="actions"
                            title={
                                <Flex align="center" gap={10}>
                                    <IconBadge $theme="actions">
                                        <ThunderboltOutlined />
                                    </IconBadge>
                                    <Flex vertical gap={0}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.statusDistribution', 'Status Distribution')}</span>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{totalActions} actions</Text>
                                    </Flex>
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
                                            <Pie data={statusDistribution} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {renderCustomLegend(statusDistribution.slice(0, 4))}
                                </Flex>
                            ) : (
                                <Flex justify="center" align="center" style={{ flex: 1 }}>
                                    <Text type="secondary">{t('common:messages.noData')}</Text>
                                </Flex>
                            )}
                        </OverviewChartCard>

                        <OverviewChartCard
                            $theme="actions"
                            title={
                                <Flex align="center" gap={10}>
                                    <IconBadge $color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
                                        <SyncOutlined spin={runningCount > 0} />
                                    </IconBadge>
                                    <Flex vertical gap={0}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.activeSummary', 'Active Summary')}</span>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{runningCount + pendingCount} active</Text>
                                    </Flex>
                                </Flex>
                            }
                            $delay={6}
                        >
                            {isLoading ? (
                                <Skeleton active paragraph={{ rows: 3 }} />
                            ) : (
                                <Flex vertical gap={8} style={{ flex: 1 }}>
                                    <Flex align="center" justify="space-between" style={{ padding: '8px 12px', background: `${ACTION_COLORS.running}10`, borderRadius: 8 }}>
                                        <Flex align="center" gap={8}>
                                            <SyncOutlined spin style={{ color: ACTION_COLORS.running }} />
                                            <Text style={{ fontSize: 12 }}>{t('status.running', 'Running')}</Text>
                                        </Flex>
                                        <Text strong style={{ fontSize: 16, color: ACTION_COLORS.running }}>{runningCount}</Text>
                                    </Flex>
                                    <Flex align="center" justify="space-between" style={{ padding: '8px 12px', background: `${ACTION_COLORS.pending}10`, borderRadius: 8 }}>
                                        <Flex align="center" gap={8}>
                                            <ClockCircleOutlined style={{ color: ACTION_COLORS.pending }} />
                                            <Text style={{ fontSize: 12 }}>{t('status.pending', 'Pending')}</Text>
                                        </Flex>
                                        <Text strong style={{ fontSize: 16, color: ACTION_COLORS.pending }}>{pendingCount}</Text>
                                    </Flex>
                                    <Flex align="center" justify="space-between" style={{ padding: '8px 12px', background: `${ACTION_COLORS.finished}10`, borderRadius: 8 }}>
                                        <Flex align="center" gap={8}>
                                            <CheckCircleOutlined style={{ color: ACTION_COLORS.finished }} />
                                            <Text style={{ fontSize: 12 }}>{t('status.finished', 'Finished')}</Text>
                                        </Flex>
                                        <Text strong style={{ fontSize: 16, color: ACTION_COLORS.finished }}>{finishedCount}</Text>
                                    </Flex>
                                </Flex>
                            )}
                        </OverviewChartCard>
                    </ChartsContainer>
                </TopRow>

                {/* Bottom Row: Active Actions + Recent Actions */}
                <BottomRow>
                    <OverviewListCard
                        $theme="actions"
                        title={
                            <Flex align="center" gap={10}>
                                <IconBadge $color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
                                    <PlayCircleOutlined />
                                </IconBadge>
                                <Flex vertical gap={0}>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.activeActions', 'Active Actions')}</span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{activeActions.length} active</Text>
                                </Flex>
                            </Flex>
                        }
                        $delay={7}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 5 }} />
                        ) : (
                            <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <ActiveUpdatesCard
                                    items={activeActions.map(action => ({
                                        action,
                                        controllerId: getTargetId(action),
                                    }))}
                                    isLoading={false}
                                    showHistory={true}
                                    emptyText={t('overview.noActiveActions', 'No active actions')}
                                />
                            </div>
                        )}
                    </OverviewListCard>

                    <OverviewListCard
                        $theme="actions"
                        title={
                            <Flex align="center" gap={10}>
                                <IconBadge $theme="actions">
                                    <HistoryOutlined />
                                </IconBadge>
                                <Flex vertical gap={0}>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.recentActions', 'Recent Actions (24h)')}</span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{recentActions.length} actions</Text>
                                </Flex>
                            </Flex>
                        }
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
                                        <ActivityItem
                                            key={record.id}
                                            onClick={() => navigate(`/actions/${record.id}`)}
                                        >
                                            <Flex align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 8,
                                                    background: record.status === 'finished' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)' :
                                                        record.status === 'error' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)' :
                                                            'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {getStatusIcon(record.status)}
                                                </div>
                                                <Flex vertical gap={0} style={{ minWidth: 0 }}>
                                                    <Text strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {getTargetId(record)}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                                        {record.createdAt ? dayjs(record.createdAt).fromNow() : '-'}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                            <ActionTimeline action={record} />
                                        </ActivityItem>
                                    )}
                                />
                            </div>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('overview.noRecentActions', 'No recent actions')}</Text>
                            </Flex>
                        )}
                    </OverviewListCard>
                </BottomRow>
            </OverviewScrollContent>
        </OverviewPageContainer>
    );
};

export default ActionsOverview;
