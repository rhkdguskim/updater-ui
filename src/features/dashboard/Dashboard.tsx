import React from 'react';
import { Card, Row, Col, Typography, Statistic, Button, Flex, Skeleton, Table, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import {
    CloudServerOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    ReloadOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetActions } from '@/api/generated/actions/actions';
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

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
`;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
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

const StatsCard = styled(Card) <{ $accentColor?: string; $delay?: number }>`
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

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: ${props => props.$accentColor || 'var(--gradient-primary)'};
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
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 8px;
`;

const COLORS = {
    online: '#10b981',
    offline: '#ef4444',
    pending: '#f59e0b',
    success: '#3b82f6',
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

const getDistributionLink = (record: MgmtAction) => {
    const dsLink = record._links?.distributionset || record._links?.distributionSet;
    const smLink = record._links?.softwaremodule || record._links?.softwareModule;
    const link = dsLink || smLink;
    const href = link?.href;
    const id = href?.split('/').pop();
    const label = link?.name || link?.title || id;
    const basePath = dsLink ? '/distributions/sets' : smLink ? '/distributions/modules' : '';
    return id && basePath ? { id, label, href: `${basePath}/${id}` } : null;
};

const Dashboard: React.FC = () => {
    const { t } = useTranslation(['dashboard', 'common']);
    const navigate = useNavigate();

    const { data: targetsData, isLoading: targetsLoading, refetch: refetchTargets } = useGetTargets(
        { limit: 100 },
        { query: { staleTime: 30000 } }
    );
    const { data: actionsData, isLoading: actionsLoading, refetch: refetchActions } = useGetActions(
        { limit: 50 },
        { query: { staleTime: 15000 } }
    );

    const isLoading = targetsLoading || actionsLoading;
    const refetch = () => { refetchTargets(); refetchActions(); };

    const targets = targetsData?.content || [];
    const totalDevices = targetsData?.total ?? 0;

    // Device status calculation with nextExpectedRequestAt
    const isOverdueByExpectedTime = (pollStatus?: { nextExpectedRequestAt?: number }) => {
        if (!pollStatus?.nextExpectedRequestAt) return false;
        return Date.now() > pollStatus.nextExpectedRequestAt;
    };

    const onlineCount = targets.filter(t =>
        t.pollStatus?.lastRequestAt !== undefined &&
        !t.pollStatus?.overdue &&
        !isOverdueByExpectedTime(t.pollStatus)
    ).length;
    const offlineCount = targets.filter(t =>
        t.pollStatus?.lastRequestAt !== undefined &&
        (t.pollStatus?.overdue || isOverdueByExpectedTime(t.pollStatus))
    ).length;

    const availability = totalDevices > 0 ? Math.round((onlineCount / totalDevices) * 100) : 0;

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
        : null; // null when no data

    const pieData = [
        { name: 'Online', value: onlineCount, color: COLORS.online },
        { name: 'Offline', value: offlineCount, color: COLORS.offline },
    ].filter(d => d.value > 0);

    // Create a map of controllerId to target info for quick lookup
    const targetMap = React.useMemo(() => {
        const map = new Map<string, { name?: string; ipAddress?: string }>();
        targets.forEach(t => {
            if (t.controllerId) {
                map.set(t.controllerId, { name: t.name, ipAddress: t.ipAddress });
            }
        });
        return map;
    }, [targets]);

    const getTargetIdFromAction = (record: MgmtAction) => {
        // Try to get from direct link first, then parse from self link
        // Format: .../targets/{controllerId}/actions/{actionId}
        let targetId = record._links?.target?.href?.split('/').pop();
        if (!targetId && record._links?.self?.href) {
            const match = record._links.self.href.match(/targets\/([^/]+)\/actions/);
            if (match) targetId = match[1];
        }
        return targetId;
    };

    // Recent actions table
    const recentActionsTable = [...recentActions]
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 8);

    const getStatusLabel = (status?: string) => {
        if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (id: number) => <Text strong>#{id}</Text>,
        },
        {
            title: t('recentActions.target', 'Target'),
            key: 'target',
            render: (_: unknown, record: MgmtAction) => {
                const targetId = getTargetIdFromAction(record);
                if (!targetId) return '-';

                const targetInfo = targetMap.get(targetId);
                const displayName = targetInfo?.name || targetId;
                const ipAddress = targetInfo?.ipAddress;

                return (
                    <a onClick={() => navigate(`/targets/${targetId}`)} style={{ cursor: 'pointer' }}>
                        <div>
                            <Text strong>{displayName}</Text>
                            {ipAddress && (
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{ipAddress}</Text>
                                </div>
                            )}
                        </div>
                    </a>
                );
            },
        },
        {
            title: t('recentActions.distribution', 'Distribution'),
            key: 'distribution',
            render: (_: unknown, record: MgmtAction) => {
                const link = getDistributionLink(record);
                if (!link) {
                    // Try to get DS name from rollout or action info if available
                    const rolloutName = (record as unknown as { rolloutName?: string }).rolloutName;
                    if (rolloutName) {
                        return <Text type="secondary">{rolloutName}</Text>;
                    }
                    return <Text type="secondary">-</Text>;
                }
                return (
                    <a onClick={() => navigate(link.href)} style={{ cursor: 'pointer' }}>
                        {link.label}
                    </a>
                );
            },
        },
        {
            title: t('recentActions.status', 'Status'),
            key: 'status',
            width: 120,
            render: (_: unknown, record: MgmtAction) => {
                const displayStatus = getActionDisplayStatus(record);
                return (
                    <Tag color={getActionStatusColor(displayStatus)} icon={getActionStatusIcon(displayStatus)}>
                        {getStatusLabel(displayStatus)}
                    </Tag>
                );
            },
        },
        {
            title: t('recentActions.time', 'Time'),
            key: 'time',
            width: 120,
            render: (_: unknown, record: MgmtAction) =>
                record.createdAt ? dayjs(record.createdAt).fromNow() : '-',
        },
    ];

    return (
        <PageContainer>
            <PageHeader>
                <HeaderContent>
                    <GradientTitle level={2}>
                        {t('title', 'Operations Dashboard')}
                    </GradientTitle>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        {t('subtitle', 'Real-time system monitoring')}
                    </Text>
                </HeaderContent>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={refetch}
                    loading={isLoading}
                >
                    {t('refresh', 'Refresh')}
                </Button>
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
                                        {t('kpi.availability', 'Availability')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.online }}>{availability}%</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {onlineCount} / {totalDevices} {t('kpi.devices', 'devices')}
                                    </Text>
                                </div>
                                <CloudServerOutlined style={{ fontSize: 40, color: COLORS.online, opacity: 0.3 }} />
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
                                <CheckCircleOutlined style={{ fontSize: 40, color: COLORS.success, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        $delay={3}
                        onClick={() => navigate('/jobs')}
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
                                <ClockCircleOutlined style={{ fontSize: 40, color: COLORS.pending, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
                        $delay={4}
                        onClick={() => navigate('/actions')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('kpi.errors', 'Errors')}
                                    </Text>
                                    <BigNumber style={{ color: errorCount > 0 ? COLORS.offline : '#64748b' }}>
                                        {errorCount}
                                    </BigNumber>
                                    {errorCount > 0 ? (
                                        <Tag color="red" icon={<WarningOutlined />}>Requires attention</Tag>
                                    ) : (
                                        <Tag color="green" icon={<CheckCircleOutlined />}>All clear</Tag>
                                    )}
                                </div>
                                <WarningOutlined style={{ fontSize: 40, color: COLORS.offline, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]} style={{ flex: 1, minHeight: 0 }}>
                <Col xs={24} lg={8} style={{ display: 'flex' }}>
                    <ChartCard
                        style={{ flex: 1 }}
                        title={
                            <Flex justify="space-between" align="center">
                                <span>{t('chart.deviceStatus', 'Device Status')}</span>
                                <Statistic
                                    value={totalDevices}
                                    suffix={t('chart.total', 'total')}
                                    valueStyle={{ fontSize: 14, fontWeight: 600 }}
                                />
                            </Flex>
                        }
                        $delay={5}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={150} shape="circle" style={{ margin: '20px auto', display: 'block' }} />
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {pieData.map((entry, index) => (
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
                                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.online }}>{availability}%</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>{t('chart.online', 'Online')}</div>
                                </div>
                                <Flex justify="center" gap={20} style={{ marginTop: 8 }}>
                                    <Flex align="center" gap={6}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.online }} />
                                        <Text style={{ fontSize: 12 }}>{t('chart.online', 'Online')} ({onlineCount})</Text>
                                    </Flex>
                                    <Flex align="center" gap={6}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.offline }} />
                                        <Text style={{ fontSize: 12 }}>{t('chart.offline', 'Offline')} ({offlineCount})</Text>
                                    </Flex>
                                </Flex>
                            </div>
                        )}
                    </ChartCard>
                </Col>
                <Col xs={24} lg={16} style={{ display: 'flex' }}>
                    <ChartCard
                        title={t('recentActions.title', 'Recent Actions (24h)')}
                        $delay={6}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, overflow: 'auto', padding: '12px' }}
                    >
                        <Table
                            dataSource={recentActionsTable}
                            columns={columns}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            loading={isLoading}
                            locale={{ emptyText: t('recentActions.empty', 'No recent actions') }}
                            onRow={(record) => ({
                                onClick: () => navigate(`/actions?q=id==${record.id}`),
                                style: { cursor: 'pointer' }
                            })}
                        />
                    </ChartCard>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default Dashboard;
