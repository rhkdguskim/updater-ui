import React, { useState } from 'react';
import { Typography, Button, Flex, Skeleton, Progress, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    RocketOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    PauseCircleOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import { useAuthStore } from '@/stores/useAuthStore';
import {
    OverviewPageContainer,
    OverviewPageHeader,
    HeaderContent,
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
};

const RolloutsOverview: React.FC = () => {
    const { t } = useTranslation(['rollouts', 'common']);
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    const { data: allRollouts, isLoading, refetch, dataUpdatedAt } = useGetRollouts({ limit: 100 });
    const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).fromNow() : '-';
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const rollouts = allRollouts?.content || [];
    const totalCount = rollouts.length;

    const runningCount = rollouts.filter(r => r.status === 'running').length;
    const finishedCount = rollouts.filter(r => r.status === 'finished').length;
    const pausedCount = rollouts.filter(r => r.status === 'paused').length;
    const errorCount = rollouts.filter(r => r.status === 'error' || r.status === 'stopped').length;
    const scheduledCount = rollouts.filter(r => r.status === 'scheduled' || r.status === 'ready').length;

    const getStatusLabel = (status?: string) => {
        if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
    };

    const pieData = [
        { name: t('overview.running', 'Running'), value: runningCount, color: ROLLOUT_COLORS.running },
        { name: t('overview.finished', 'Finished'), value: finishedCount, color: ROLLOUT_COLORS.finished },
        { name: t('common:status.paused', 'Paused'), value: pausedCount, color: ROLLOUT_COLORS.paused },
        { name: t('overview.errorStopped', 'Error'), value: errorCount, color: ROLLOUT_COLORS.error },
        { name: t('common:status.scheduled', 'Scheduled'), value: scheduledCount, color: ROLLOUT_COLORS.scheduled },
    ].filter(d => d.value > 0);

    const getRolloutProgress = (rollout: { status?: string; totalTargets?: number; totalTargetsPerStatus?: Record<string, number> }) => {
        // If rollout is finished, always return 100%
        if (rollout.status === 'finished') return 100;
        const total = rollout.totalTargets || 0;
        const finished = rollout.totalTargetsPerStatus?.finished || 0;
        if (!total) return 0;
        return Math.round((finished / total) * 100);
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
                        <LiveIndicator $active={runningCount > 0} $color={COLORS.rollouts}>
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

            {/* Top Row: KPI Cards + Charts */}
            <TopRow>
                <KPIGridContainer>
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
                                <BigNumber $color={COLORS.rollouts}>{totalCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.totalRollouts', 'Total Rollouts')}
                                </Text>
                            </Flex>
                        )}
                    </OverviewStatsCard>
                    <OverviewStatsCard
                        $accentColor="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                        $delay={2}
                        $pulse={runningCount > 0}
                        onClick={() => navigate('/rollouts/list?status=running')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <IconBadge $color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
                                    <PlayCircleOutlined />
                                </IconBadge>
                                <BigNumber $color={ROLLOUT_COLORS.running}>{runningCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.running', 'Running')}
                                </Text>
                            </Flex>
                        )}
                    </OverviewStatsCard>
                    <OverviewStatsCard
                        $accentColor="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        $delay={3}
                        onClick={() => navigate('/rollouts/list?status=finished')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <IconBadge $color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
                                    <CheckCircleOutlined />
                                </IconBadge>
                                <BigNumber $color={ROLLOUT_COLORS.finished}>{finishedCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.finished', 'Finished')}
                                </Text>
                            </Flex>
                        )}
                    </OverviewStatsCard>
                    <OverviewStatsCard
                        $accentColor="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                        $delay={4}
                        $pulse={errorCount > 0}
                        onClick={() => navigate('/rollouts/list?status=stopped')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <IconBadge $color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
                                    <CloseCircleOutlined />
                                </IconBadge>
                                <BigNumber $color={errorCount > 0 ? ROLLOUT_COLORS.error : '#64748b'}>{errorCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.errorStopped', 'Error')}
                                </Text>
                            </Flex>
                        )}
                    </OverviewStatsCard>
                </KPIGridContainer>

                <ChartsContainer>
                    <OverviewChartCard
                        $theme="rollouts"
                        title={
                            <Flex align="center" gap={10}>
                                <IconBadge $theme="rollouts">
                                    <RocketOutlined />
                                </IconBadge>
                                <Flex vertical gap={0}>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.statusDistribution', 'Status Distribution')}</span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{t('overview.rolloutsCount', { count: totalCount })}</Text>
                                </Flex>
                            </Flex>
                        }
                        $delay={5}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                        ) : pieData.length > 0 ? (
                            <Flex vertical style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height={100}>
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {renderCustomLegend(pieData.slice(0, 4))}
                            </Flex>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('overview.noRollouts', 'No rollouts')}</Text>
                            </Flex>
                        )}
                    </OverviewChartCard>

                    <OverviewChartCard
                        $theme="rollouts"
                        title={
                            <Flex align="center" gap={10}>
                                <IconBadge $color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)">
                                    <ClockCircleOutlined />
                                </IconBadge>
                                <Flex vertical gap={0}>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.summaryStatus', 'Status Summary')}</span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{t('overview.activeCount', { count: runningCount + pausedCount })}</Text>
                                </Flex>
                            </Flex>
                        }
                        $delay={6}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 3 }} />
                        ) : (
                            <Flex vertical gap={8} style={{ flex: 1 }}>
                                <Flex align="center" justify="space-between" style={{ padding: '8px 12px', background: `${ROLLOUT_COLORS.running}10`, borderRadius: 8 }}>
                                    <Flex align="center" gap={8}>
                                        <PlayCircleOutlined style={{ color: ROLLOUT_COLORS.running }} />
                                        <Text style={{ fontSize: 12 }}>{t('overview.running', 'Running')}</Text>
                                    </Flex>
                                    <Text strong style={{ fontSize: 16, color: ROLLOUT_COLORS.running }}>{runningCount}</Text>
                                </Flex>
                                <Flex align="center" justify="space-between" style={{ padding: '8px 12px', background: `${ROLLOUT_COLORS.paused}10`, borderRadius: 8 }}>
                                    <Flex align="center" gap={8}>
                                        <PauseCircleOutlined style={{ color: ROLLOUT_COLORS.paused }} />
                                        <Text style={{ fontSize: 12 }}>{t('common:status.paused', 'Paused')}</Text>
                                    </Flex>
                                    <Text strong style={{ fontSize: 16, color: ROLLOUT_COLORS.paused }}>{pausedCount}</Text>
                                </Flex>
                                <Flex align="center" justify="space-between" style={{ padding: '8px 12px', background: `${ROLLOUT_COLORS.scheduled}10`, borderRadius: 8 }}>
                                    <Flex align="center" gap={8}>
                                        <ClockCircleOutlined style={{ color: ROLLOUT_COLORS.scheduled }} />
                                        <Text style={{ fontSize: 12 }}>{t('common:status.scheduled', 'Scheduled')}</Text>
                                    </Flex>
                                    <Text strong style={{ fontSize: 16, color: ROLLOUT_COLORS.scheduled }}>{scheduledCount}</Text>
                                </Flex>
                            </Flex>
                        )}
                    </OverviewChartCard>
                </ChartsContainer>
            </TopRow>

            {/* Bottom Row: Recent Rollouts */}
            <BottomRow>
                <OverviewListCard
                    $theme="rollouts"
                    title={
                        <Flex align="center" gap={10}>
                            <IconBadge $theme="rollouts">
                                <RocketOutlined />
                            </IconBadge>
                            <Flex vertical gap={0}>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>{t('pageTitle', 'Rollouts')}</span>
                                <Text type="secondary" style={{ fontSize: 11 }}>{t('overview.rolloutsCount', { count: totalCount })}</Text>
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
                    ) : rollouts.length > 0 ? (
                        <Flex vertical gap={8} style={{ flex: 1, overflow: 'auto' }}>
                            {rollouts.slice(0, 10).map(rollout => (
                                <ActivityItem
                                    key={rollout.id}
                                    onClick={() => navigate(`/rollouts/${rollout.id}`)}
                                >
                                    <Flex align="center" gap={12} style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 8,
                                            background: rollout.status === 'running'
                                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)'
                                                : rollout.status === 'finished'
                                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                                                    : 'linear-gradient(135deg, rgba(100, 116, 139, 0.15) 0%, rgba(71, 85, 105, 0.1) 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {rollout.status === 'running' ? (
                                                <PlayCircleOutlined style={{ fontSize: 18, color: ROLLOUT_COLORS.running }} />
                                            ) : rollout.status === 'finished' ? (
                                                <CheckCircleOutlined style={{ fontSize: 18, color: ROLLOUT_COLORS.finished }} />
                                            ) : (
                                                <RocketOutlined style={{ fontSize: 18, color: '#64748b' }} />
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
                                            <Text type="secondary" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {rollout.targetFilterQuery || t('overview.allTargets', 'All targets')}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Progress
                                        type="circle"
                                        percent={getRolloutProgress(rollout)}
                                        size={44}
                                        strokeColor={
                                            rollout.status === 'running' ? ROLLOUT_COLORS.running :
                                                rollout.status === 'finished' ? ROLLOUT_COLORS.finished :
                                                    rollout.status === 'error' ? ROLLOUT_COLORS.error :
                                                        '#cbd5e1'
                                        }
                                        strokeWidth={8}
                                    />
                                </ActivityItem>
                            ))}
                        </Flex>
                    ) : (
                        <Flex vertical justify="center" align="center" gap={12} style={{ flex: 1 }}>
                            <RocketOutlined style={{ fontSize: 40, color: '#94a3b8' }} />
                            <Text type="secondary">{t('overview.noRollouts', 'No rollouts yet')}</Text>
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

                <OverviewListCard
                    $theme="rollouts"
                    title={
                        <Flex align="center" gap={10}>
                            <IconBadge $color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
                                <CheckCircleOutlined />
                            </IconBadge>
                            <Flex vertical gap={0}>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.recentFinished', 'Recent Finished')}</span>
                                <Text type="secondary" style={{ fontSize: 11 }}>{t('overview.completedCount', { count: finishedCount })}</Text>
                            </Flex>
                        </Flex>
                    }
                    $delay={8}
                >
                    {isLoading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                    ) : finishedCount > 0 ? (
                        <Flex vertical gap={8} style={{ flex: 1, overflow: 'auto' }}>
                            {rollouts
                                .filter(r => r.status === 'finished')
                                .slice(0, 6)
                                .map(rollout => (
                                    <ActivityItem
                                        key={rollout.id}
                                        onClick={() => navigate(`/rollouts/${rollout.id}`)}
                                    >
                                        <Flex align="center" gap={12} style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 8,
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <CheckCircleOutlined style={{ fontSize: 18, color: ROLLOUT_COLORS.finished }} />
                                            </div>
                                            <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {rollout.name}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {rollout.lastModifiedAt ? dayjs(rollout.lastModifiedAt).format('YYYY-MM-DD') : rollout.createdAt ? dayjs(rollout.createdAt).format('YYYY-MM-DD') : '-'}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                        <Tag color="green" style={{ margin: 0, fontSize: 10, borderRadius: 999 }}>
                                            100%
                                        </Tag>
                                    </ActivityItem>
                                ))}
                        </Flex>
                    ) : (
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Text type="secondary">{t('overview.noFinishedRollouts', 'No finished rollouts')}</Text>
                        </Flex>
                    )}
                </OverviewListCard>
            </BottomRow>
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
