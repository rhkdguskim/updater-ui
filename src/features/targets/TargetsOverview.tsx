import React, { useMemo } from 'react';
import { Typography, Button, Flex, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ReloadOutlined,
    SyncOutlined,
    ApiOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    AppstoreOutlined,
    TagsOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetActions } from '@/api/generated/actions/actions';
import { useGetTargetTypes } from '@/api/generated/target-types/target-types';
import DeviceCardGrid from '@/features/dashboard/components/DeviceCardGrid';
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
    IconBadge,
    BigNumber,
    LiveIndicator,
    ChartLegendItem,
    COLORS,
} from '@/components/shared/OverviewStyles';

dayjs.extend(relativeTime);

const { Text } = Typography;

const TargetsOverview: React.FC = () => {
    const { t } = useTranslation('targets');
    const navigate = useNavigate();

    const { data: allTargets, isLoading: targetsLoading, refetch: refetchTargets, dataUpdatedAt } = useGetTargets(
        { limit: 500 },
        { query: { staleTime: 2000, refetchInterval: 2000 } }
    );
    const { data: actionsData, isLoading: actionsLoading, refetch: refetchActions } = useGetActions(
        { limit: 100 },
        { query: { staleTime: 2000, refetchInterval: 2000 } }
    );
    const { data: targetTypesData } = useGetTargetTypes(
        { limit: 100 },
        { query: { staleTime: 30000 } }
    );

    const targets = allTargets?.content || [];
    const actions = actionsData?.content || [];
    const totalDevices = allTargets?.total ?? 0;
    const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).fromNow() : '-';
    const isLoading = targetsLoading || actionsLoading;

    // Build target type name to color map
    const targetTypeColorMap = useMemo(() => {
        const map = new Map<string, string>();
        targetTypesData?.content?.forEach(tt => {
            if (tt.name && tt.colour) {
                map.set(tt.name, tt.colour);
            }
        });
        return map;
    }, [targetTypesData]);
    const refetch = () => { refetchTargets(); refetchActions(); };

    // Offline check
    const isOverdueByExpectedTime = (pollStatus?: { nextExpectedRequestAt?: number }) => {
        if (!pollStatus?.nextExpectedRequestAt) return false;
        return Date.now() > pollStatus.nextExpectedRequestAt;
    };

    // --- Update Status ---
    const inSyncCount = targets.filter(t => t.updateStatus === 'in_sync').length;
    const pendingCount = targets.filter(t => t.updateStatus === 'pending').length;
    const errorCount = targets.filter(t => t.updateStatus === 'error').length;
    const unknownCount = targets.filter(t => !t.updateStatus || t.updateStatus === 'unknown' || t.updateStatus === 'registered').length;

    // --- Connectivity Status ---
    const onlineCount = targets.filter(t =>
        t.pollStatus?.lastRequestAt !== undefined &&
        !t.pollStatus?.overdue &&
        !isOverdueByExpectedTime(t.pollStatus)
    ).length;
    const offlineCount = targets.filter(t =>
        t.pollStatus?.lastRequestAt !== undefined &&
        (t.pollStatus?.overdue || isOverdueByExpectedTime(t.pollStatus))
    ).length;
    const neverConnectedCount = targets.filter(t =>
        !t.pollStatus || t.pollStatus.lastRequestAt === undefined
    ).length;

    const onlinePercent = totalDevices > 0 ? Math.round((onlineCount / totalDevices) * 100) : 0;

    // Pie Data for Connectivity
    const connectivityPieData = [
        { name: t('status.online', 'Online'), value: onlineCount, color: COLORS.online },
        { name: t('status.offline', 'Offline'), value: offlineCount, color: COLORS.offline },
        { name: t('status.neverConnected', 'Never Connected'), value: neverConnectedCount, color: COLORS.unknown },
    ].filter(d => d.value > 0);

    // Pie Data for Update Status
    const updateStatusPieData = [
        { name: t('status.inSync', 'In Sync'), value: inSyncCount, color: COLORS.inSync },
        { name: t('status.pending', 'Pending'), value: pendingCount, color: COLORS.pending },
        { name: t('status.error', 'Error'), value: errorCount, color: COLORS.error },
        { name: t('status.unknown', 'Unknown'), value: unknownCount, color: COLORS.unknown },
    ].filter(d => d.value > 0);

    // Pie Data for Target Types
    const targetTypePieData = useMemo(() => {
        const typeCounts = new Map<string, { count: number; color: string }>();
        targets.forEach(target => {
            const typeName = target.targetTypeName || t('status.unknown', 'Unknown');
            const existing = typeCounts.get(typeName);
            const typeColor = targetTypeColorMap.get(target.targetTypeName || '') || '#94a3b8';
            if (existing) {
                existing.count++;
            } else {
                typeCounts.set(typeName, { count: 1, color: typeColor });
            }
        });
        return Array.from(typeCounts.entries()).map(([name, { count, color }]) => ({
            name,
            value: count,
            color,
        }));
    }, [targets, targetTypeColorMap, t]);



    // Custom Legend Renderer
    const renderCustomLegend = (data: { name: string; value: number; color: string }[]) => (
        <Flex vertical gap={4} style={{ marginTop: 4 }}>
            {data.map(entry => (
                <ChartLegendItem key={entry.name}>
                    <Flex align="center" gap={6}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.color, boxShadow: `0 1px 3px ${entry.color}40` }} />
                        <Text style={{ fontSize: 11 }}>{entry.name}</Text>
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
                    <GradientTitle level={3} $theme="targets">
                        {t('overview.title', 'Device Monitoring')}
                    </GradientTitle>
                    <Flex align="center" gap={12}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {t('overview.subtitle', 'Real-time device status overview')}
                        </Text>
                        <LiveIndicator $active={onlineCount > 0} $color={COLORS.targets}>
                            {onlineCount > 0 ? t('common:status.live', 'Live') : t('common:status.idle', 'Idle')}
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
                        {t('actions.refresh')}
                    </Button>
                </Flex>
            </OverviewPageHeader>

            <OverviewScrollContent>
                {/* Top Row: KPI Cards + 3 Pie Charts */}
                <TopRow>
                    <KPIGridContainer>
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                            $delay={1}
                            onClick={() => navigate('/targets/list')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)">
                                        <AppstoreOutlined />
                                    </IconBadge>
                                    <BigNumber $color="#3b82f6">{totalDevices}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('overview.totalDevices', 'Total Devices')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                            $delay={2}
                            onClick={() => navigate('/targets/list')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
                                        <CheckCircleOutlined />
                                    </IconBadge>
                                    <BigNumber $color={COLORS.inSync}>{inSyncCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('status.inSync', 'In Sync')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                            $delay={3}
                            $pulse={pendingCount > 0}
                            onClick={() => navigate('/targets/list')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
                                        <ClockCircleOutlined />
                                    </IconBadge>
                                    <BigNumber $color={COLORS.pending}>{pendingCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('status.pending', 'Pending')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>
                        <OverviewStatsCard
                            $accentColor="linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
                            $delay={4}
                            $pulse={errorCount > 0}
                            onClick={() => navigate('/targets/list')}
                        >
                            {isLoading ? <Skeleton.Avatar active size={40} /> : (
                                <Flex vertical align="center" gap={4}>
                                    <IconBadge $color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
                                        <ExclamationCircleOutlined />
                                    </IconBadge>
                                    <BigNumber $color={errorCount > 0 ? COLORS.error : '#64748b'}>{errorCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                        {t('status.error', 'Error')}
                                    </Text>
                                </Flex>
                            )}
                        </OverviewStatsCard>
                    </KPIGridContainer>

                    <ChartsContainer>
                        <OverviewChartCard
                            $theme="targets"
                            title={
                                <Flex align="center" gap={10}>
                                    <IconBadge $theme="targets">
                                        <ApiOutlined />
                                    </IconBadge>
                                    <Flex vertical gap={0}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.connectivityStatus', 'Connectivity')}</span>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{onlinePercent}% online</Text>
                                    </Flex>
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
                                            <Pie data={connectivityPieData} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                {connectivityPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {renderCustomLegend(connectivityPieData)}
                                </Flex>
                            ) : (
                                <Flex justify="center" align="center" style={{ flex: 1 }}>
                                    <Text type="secondary">{t('common:messages.noData')}</Text>
                                </Flex>
                            )}
                        </OverviewChartCard>

                        <OverviewChartCard
                            $theme="targets"
                            title={
                                <Flex align="center" gap={10}>
                                    <IconBadge $color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)">
                                        <TagsOutlined />
                                    </IconBadge>
                                    <Flex vertical gap={0}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.targetTypeDistribution', 'Target Types')}</span>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{targetTypePieData.length} types</Text>
                                    </Flex>
                                </Flex>
                            }
                            $delay={6}
                        >
                            {isLoading ? (
                                <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                            ) : targetTypePieData.length > 0 ? (
                                <Flex vertical style={{ flex: 1 }}>
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart>
                                            <Pie data={targetTypePieData} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                {targetTypePieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {renderCustomLegend(targetTypePieData)}
                                </Flex>
                            ) : (
                                <Flex justify="center" align="center" style={{ flex: 1 }}>
                                    <Text type="secondary">{t('common:messages.noData')}</Text>
                                </Flex>
                            )}
                        </OverviewChartCard>

                        <OverviewChartCard
                            $theme="targets"
                            title={
                                <Flex align="center" gap={10}>
                                    <IconBadge $color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
                                        <SyncOutlined />
                                    </IconBadge>
                                    <Flex vertical gap={0}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('overview.updateStatusDistribution', 'Update Status')}</span>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{targets.length} devices</Text>
                                    </Flex>
                                </Flex>
                            }
                            $delay={6}
                        >
                            {isLoading ? (
                                <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                            ) : updateStatusPieData.length > 0 ? (
                                <Flex vertical style={{ flex: 1 }}>
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart>
                                            <Pie data={updateStatusPieData} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                {updateStatusPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {renderCustomLegend(updateStatusPieData)}
                                </Flex>
                            ) : (
                                <Flex justify="center" align="center" style={{ flex: 1 }}>
                                    <Text type="secondary">{t('common:messages.noData')}</Text>
                                </Flex>
                            )}
                        </OverviewChartCard>
                    </ChartsContainer>
                </TopRow>

                {/* Bottom Row: Device Grid (Full Width) */}
                <BottomRow style={{ display: 'block' }}>
                    <DeviceCardGrid
                        targets={targets}
                        actions={actions}
                        loading={isLoading}
                        title={t('overview.deviceGrid', 'Device Status Grid')}
                        delay={7}
                        cols={5}
                        rows={4}
                        gap={8}
                        rowHeight={90}
                        targetTypeColorMap={targetTypeColorMap}
                    />
                </BottomRow>
            </OverviewScrollContent>
        </OverviewPageContainer>
    );
};

export default TargetsOverview;
