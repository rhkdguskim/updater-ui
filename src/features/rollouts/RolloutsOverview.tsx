import React from 'react';
import { Typography, Button, Flex, Skeleton, Progress, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    RocketOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    PauseCircleOutlined,
    ThunderboltOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import { useGetActions } from '@/api/generated/actions/actions';
import { useAuthStore } from '@/stores/useAuthStore';
import { AirportSlideList, ActiveUpdatesCard } from '@/components/common';
import type { MgmtAction, MgmtRolloutResponseBody } from '@/api/generated/model';
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
import RolloutCreateModal from './RolloutCreateModal';

dayjs.extend(relativeTime);

const { Text } = Typography;

const ROLLOUT_COLORS = {
    running: '#3b82f6',
    ready: '#10b981',
    paused: '#f59e0b',
    finished: '#22c55e',
    error: '#ef4444',
    scheduled: '#8b5cf6',
};

const ACTION_COLORS = {
    finished: '#10b981',
    running: '#3b82f6',
    pending: '#f59e0b',
    error: '#ef4444',
    canceled: '#94a3b8',
};

const statusColorMap: Record<string, string> = {
    running: 'blue',
    ready: 'cyan',
    paused: 'orange',
    finished: 'green',
    error: 'red',
    scheduled: 'purple',
    creating: 'default',
    starting: 'processing',
    stopped: 'default',
    waiting_for_approval: 'gold',
    pending: 'orange',
    canceled: 'default',
};

const RolloutsOverview: React.FC = () => {
    const { t } = useTranslation(['rollouts', 'actions', 'common']);
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    // Fetch rollouts and actions
    const { data: allRollouts, isLoading: isRolloutsLoading, refetch: refetchRollouts, dataUpdatedAt } = useGetRollouts(
        { limit: 100 },
        { query: { staleTime: 2000, refetchInterval: 5000 } }
    );
    const { data: allActions, isLoading: isActionsLoading, refetch: refetchActions } = useGetActions(
        { limit: 200 },
        { query: { staleTime: 2000, refetchInterval: 3000 } }
    );

    const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).fromNow() : '-';
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const isLoading = isRolloutsLoading || isActionsLoading;

    // Rollout stats
    const rollouts = allRollouts?.content || [];
    const totalRollouts = rollouts.length;
    const runningRollouts = rollouts.filter(r => r.status === 'running').length;
    const finishedRollouts = rollouts.filter(r => r.status === 'finished').length;
    const pausedRollouts = rollouts.filter(r => r.status === 'paused').length;
    const errorRollouts = rollouts.filter(r => r.status === 'error' || r.status === 'stopped').length;
    const scheduledRollouts = rollouts.filter(r => r.status === 'scheduled' || r.status === 'ready').length;

    // Action stats
    const actions = allActions?.content || [];
    const totalActions = allActions?.total ?? actions.length;
    const runningActions = actions.filter(a => a.status === 'running').length;
    const finishedActions = actions.filter(a => a.status === 'finished').length;
    const pendingActions = actions.filter(a => a.status === 'pending' || a.status === 'scheduled').length;
    const errorActions = actions.filter(a => a.status === 'error').length;

    // Success rate
    const completedActions = finishedActions + errorActions;
    const successRate = completedActions > 0 ? Math.round((finishedActions / completedActions) * 100) : null;

    // Active rollouts for list
    const activeRollouts = React.useMemo(() => {
        return rollouts
            .filter(r => r.status === 'running' || r.status === 'paused' || r.status === 'scheduled' || r.status === 'ready')
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 10);
    }, [rollouts]);

    // Active actions for list
    const activeActions = React.useMemo(() => {
        return actions
            .filter(a => a.status === 'running' || a.status === 'pending' || a.status === 'scheduled')
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 10);
    }, [actions]);

    // Rollout pie data
    const rolloutPieData = [
        { name: t('common:status.running', 'Running'), value: runningRollouts, color: ROLLOUT_COLORS.running },
        { name: t('common:status.finished', 'Finished'), value: finishedRollouts, color: ROLLOUT_COLORS.finished },
        { name: t('common:status.paused', 'Paused'), value: pausedRollouts, color: ROLLOUT_COLORS.paused },
        { name: t('common:status.error', 'Error'), value: errorRollouts, color: ROLLOUT_COLORS.error },
        { name: t('common:status.scheduled', 'Scheduled'), value: scheduledRollouts, color: ROLLOUT_COLORS.scheduled },
    ].filter(d => d.value > 0);

    // Action pie data
    const actionPieData = [
        { name: t('common:status.running', 'Running'), value: runningActions, color: ACTION_COLORS.running },
        { name: t('common:status.finished', 'Finished'), value: finishedActions, color: ACTION_COLORS.finished },
        { name: t('common:status.pending', 'Pending'), value: pendingActions, color: ACTION_COLORS.pending },
        { name: t('common:status.error', 'Error'), value: errorActions, color: ACTION_COLORS.error },
    ].filter(d => d.value > 0);

    const getStatusLabel = (status?: string) => {
        if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
    };

    const getRolloutProgress = (rollout: MgmtRolloutResponseBody) => {
        if (rollout.status === 'finished') return 100;
        const total = rollout.totalTargets || 0;
        const finished = rollout.totalTargetsPerStatus?.finished || 0;
        if (!total) return 0;
        return Math.round((finished / total) * 100);
    };

    const getTargetId = (action: MgmtAction) => {
        let targetId = action._links?.target?.href?.split('/').pop();
        if (!targetId && action._links?.self?.href) {
            const match = action._links.self.href.match(/targets\/([^/]+)\/actions/);
            if (match) targetId = match[1];
        }
        return targetId || `#${action.id}`;
    };

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

    const totalActive = runningRollouts + runningActions;

    return (
        <OverviewPageContainer>
            <OverviewPageHeader>
                <HeaderContent>
                    <GradientTitle level={3} $theme="rollouts">
                        {t('overview.title', 'Rollout Management')}
                    </GradientTitle>
                    <Flex align="center" gap={12}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {t('overview.subtitle', 'Deployment rollout overview and monitoring')}
                        </Text>
                        <LiveIndicator $active={totalActive > 0} $color={COLORS.rollouts}>
                            {totalActive > 0 ? `${totalActive} ${t('common:status.active', 'Active')}` : t('common:status.idle', 'Idle')}
                        </LiveIndicator>
                    </Flex>
                </HeaderContent>
                <Flex align="center" gap={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('common:updated', 'Updated')}: {lastUpdated}
                    </Text>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => { refetchRollouts(); refetchActions(); }}
                        loading={isLoading}
                        size="small"
                    >
                        {t('common:actions.refresh', 'Refresh')}
                    </Button>
                    {isAdmin && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateModalOpen(true)}
                            size="small"
                        >
                            {t('overview.createRollout', 'Create')}
                        </Button>
                    )}
                </Flex>
            </OverviewPageHeader>

            <OverviewScrollContent>
                {/* Top Row: 2x2 KPI Grid + 2 Pie Charts */}
                <TopRow>
                    <KPIGridContainer>
                        {/* Total Rollouts */}
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            $delay={1}
                            onClick={() => navigate('/rollouts/list')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $theme="rollouts">
                                        <RocketOutlined />
                                    </IconBadge>
                                    <BigNumber $color={COLORS.rollouts}>{totalRollouts}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('overview.totalRollouts', 'Rollouts')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>

                        {/* Active Rollouts */}
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                            $delay={2}
                            $pulse={runningRollouts > 0}
                            onClick={() => navigate('/rollouts/list?status=running')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
                                        <PlayCircleOutlined />
                                    </IconBadge>
                                    <BigNumber $color={ROLLOUT_COLORS.running}>{runningRollouts}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('actions:status.running', 'Running')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>

                        {/* Total Actions */}
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                            $delay={3}
                            onClick={() => navigate('/actions')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)">
                                        <ThunderboltOutlined />
                                    </IconBadge>
                                    <BigNumber $color="#6366f1">{totalActions}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('common:nav.actions', 'Actions')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>

                        {/* Success Rate */}
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            $delay={4}
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
                    </KPIGridContainer>

                    <ChartsContainer>
                        {/* Rollout Status Distribution */}
                        <OverviewChartCard
                            $theme="rollouts"
                            title={
                                <Flex align="center" gap={10}>
                                    <IconBadge $theme="rollouts">
                                        <RocketOutlined />
                                    </IconBadge>
                                    <Flex vertical gap={0}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.statusDistribution', 'Rollout Status')}</span>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{totalRollouts} total</Text>
                                    </Flex>
                                </Flex>
                            }
                            $delay={5}
                        >
                            {isLoading ? (
                                <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                            ) : rolloutPieData.length > 0 ? (
                                <Flex vertical style={{ flex: 1 }}>
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart>
                                            <Pie data={rolloutPieData} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                {rolloutPieData.map((entry, index) => (
                                                    <Cell key={`rollout-cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {renderCustomLegend(rolloutPieData.slice(0, 4))}
                                </Flex>
                            ) : (
                                <Flex justify="center" align="center" style={{ flex: 1 }}>
                                    <Text type="secondary">{t('overview.noRollouts', 'No rollouts')}</Text>
                                </Flex>
                            )}
                        </OverviewChartCard>

                        {/* Action Status Distribution */}
                        <OverviewChartCard
                            $theme="actions"
                            title={
                                <Flex align="center" gap={10}>
                                    <IconBadge $color="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)">
                                        <ThunderboltOutlined />
                                    </IconBadge>
                                    <Flex vertical gap={0}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('actions:overview.statusDistribution', 'Action Status')}</span>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{totalActions} total</Text>
                                    </Flex>
                                </Flex>
                            }
                            $delay={6}
                        >
                            {isLoading ? (
                                <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                            ) : actionPieData.length > 0 ? (
                                <Flex vertical style={{ flex: 1 }}>
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart>
                                            <Pie data={actionPieData} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                {actionPieData.map((entry, index) => (
                                                    <Cell key={`action-cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {renderCustomLegend(actionPieData.slice(0, 4))}
                                </Flex>
                            ) : (
                                <Flex justify="center" align="center" style={{ flex: 1 }}>
                                    <Text type="secondary">{t('actions:empty', 'No actions')}</Text>
                                </Flex>
                            )}
                        </OverviewChartCard>
                    </ChartsContainer>
                </TopRow>

                {/* Bottom Row: Active Rollouts + Active Actions */}
                <BottomRow>
                    {/* Active Rollouts List */}
                    <OverviewListCard
                        $theme="rollouts"
                        title={
                            <Flex align="center" gap={10}>
                                <IconBadge $theme="rollouts">
                                    <RocketOutlined />
                                </IconBadge>
                                <Flex vertical gap={0}>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.activeRollouts', 'Active Rollouts')}</span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{activeRollouts.length} active</Text>
                                </Flex>
                            </Flex>
                        }
                        extra={
                            <Button type="link" size="small" onClick={() => navigate('/rollouts/list')}>
                                {t('overview.viewAll', 'View All')}
                            </Button>
                        }
                        $delay={7}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 5 }} />
                        ) : activeRollouts.length > 0 ? (
                            <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <AirportSlideList
                                    items={activeRollouts}
                                    itemHeight={56}
                                    visibleCount={5}
                                    interval={4000}
                                    fullHeight={true}
                                    renderItem={(rollout: MgmtRolloutResponseBody) => (
                                        <ActivityItem
                                            key={rollout.id}
                                            onClick={() => navigate(`/rollouts/${rollout.id}`)}
                                        >
                                            <Flex align="center" gap={12} style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 8,
                                                    background: rollout.status === 'running'
                                                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)'
                                                        : rollout.status === 'paused'
                                                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                                                            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {rollout.status === 'running' ? (
                                                        <SyncOutlined spin style={{ fontSize: 18, color: ROLLOUT_COLORS.running }} />
                                                    ) : rollout.status === 'paused' ? (
                                                        <PauseCircleOutlined style={{ fontSize: 18, color: ROLLOUT_COLORS.paused }} />
                                                    ) : (
                                                        <ClockCircleOutlined style={{ fontSize: 18, color: ROLLOUT_COLORS.scheduled }} />
                                                    )}
                                                </div>
                                                <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                                                    <Flex align="center" gap={8}>
                                                        <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {rollout.name}
                                                        </Text>
                                                        <Tag color={statusColorMap[rollout.status || ''] || 'default'} style={{ margin: 0, fontSize: 10, borderRadius: 999 }}>
                                                            {getStatusLabel(rollout.status)}
                                                        </Tag>
                                                    </Flex>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        {rollout.totalTargets || 0} targets
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                            <Progress
                                                type="circle"
                                                percent={getRolloutProgress(rollout)}
                                                size={40}
                                                strokeColor={
                                                    rollout.status === 'running' ? ROLLOUT_COLORS.running :
                                                        rollout.status === 'paused' ? ROLLOUT_COLORS.paused :
                                                            '#cbd5e1'
                                                }
                                                strokeWidth={8}
                                            />
                                        </ActivityItem>
                                    )}
                                />
                            </div>
                        ) : (
                            <Flex vertical justify="center" align="center" gap={12} style={{ flex: 1 }}>
                                <RocketOutlined style={{ fontSize: 40, color: '#94a3b8' }} />
                                <Text type="secondary">{t('overview.noActiveRollouts', 'No active rollouts')}</Text>
                                {isAdmin && (
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => setIsCreateModalOpen(true)}
                                    >
                                        {t('overview.createFirst', 'Create First Rollout')}
                                    </Button>
                                )}
                            </Flex>
                        )}
                    </OverviewListCard>

                    {/* Active Actions List */}
                    <OverviewListCard
                        $theme="actions"
                        title={
                            <Flex align="center" gap={10}>
                                <IconBadge $color="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)">
                                    <ThunderboltOutlined />
                                </IconBadge>
                                <Flex vertical gap={0}>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t('actions:overview.activeActions', 'Active Actions')}</span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{activeActions.length} active</Text>
                                </Flex>
                            </Flex>
                        }
                        extra={
                            <Button type="link" size="small" onClick={() => navigate('/actions')}>
                                {t('overview.viewAll', 'View All')}
                            </Button>
                        }
                        $delay={8}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 5 }} />
                        ) : activeActions.length > 0 ? (
                            <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <ActiveUpdatesCard
                                    items={activeActions.map(action => ({
                                        action,
                                        controllerId: getTargetId(action),
                                    }))}
                                    isLoading={false}
                                    showHistory={true}
                                    emptyText={t('actions:overview.noActiveActions', 'No active actions')}
                                />
                            </div>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('actions:overview.noActiveActions', 'No active actions')}</Text>
                            </Flex>
                        )}
                    </OverviewListCard>
                </BottomRow>
            </OverviewScrollContent>
            <RolloutCreateModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={(id) => {
                    setIsCreateModalOpen(false);
                    navigate(`/rollouts/${id}`);
                }}
            />
        </OverviewPageContainer>
    );
};

export default RolloutsOverview;
