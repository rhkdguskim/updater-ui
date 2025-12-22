import React from 'react';
import { Card, Row, Col, Typography, Statistic, Button, Flex, Skeleton, Table, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    QuestionCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { useGetTargets } from '@/api/generated/targets/targets';
import type { MgmtTarget } from '@/api/generated/model';
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

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: ${props => props.$accentColor || 'var(--gradient-primary)'};
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
    neverConnected: '#94a3b8',
    primary: '#6366f1',
};

const TargetsOverview: React.FC = () => {
    const { t } = useTranslation('targets');
    const navigate = useNavigate();

    // Fetch all targets for monitoring
    const { data: allTargets, isLoading, refetch } = useGetTargets({ limit: 500 });

    const targets = allTargets?.content || [];
    const totalCount = allTargets?.total ?? 0;

    // Client-side offline check: use nextExpectedRequestAt from system config
    const isOverdueByExpectedTime = (pollStatus?: { nextExpectedRequestAt?: number }) => {
        if (!pollStatus?.nextExpectedRequestAt) return false;
        return Date.now() > pollStatus.nextExpectedRequestAt;
    };

    // Calculate status counts with both server overdue flag AND expected time check
    const neverConnectedCount = targets.filter(t =>
        !t.pollStatus || t.pollStatus.lastRequestAt === undefined
    ).length;
    const onlineCount = targets.filter(t =>
        t.pollStatus?.lastRequestAt !== undefined &&
        !t.pollStatus?.overdue &&
        !isOverdueByExpectedTime(t.pollStatus)
    ).length;
    const offlineCount = targets.filter(t =>
        t.pollStatus?.lastRequestAt !== undefined &&
        (t.pollStatus?.overdue || isOverdueByExpectedTime(t.pollStatus))
    ).length;

    const onlinePercentage = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;

    const pieData = [
        { name: 'Online', value: onlineCount || 0, color: COLORS.online },
        { name: 'Offline', value: offlineCount || 0, color: COLORS.offline },
        { name: 'Never Connected', value: neverConnectedCount || 0, color: COLORS.neverConnected },
    ].filter(d => d.value > 0);

    // Get status label - uses nextExpectedRequestAt from polling config
    const getStatusTag = (target: MgmtTarget) => {
        if (!target.pollStatus || target.pollStatus.lastRequestAt === undefined) {
            return <Tag color="default">{t('status.neverConnected')}</Tag>;
        }
        if (target.pollStatus.overdue || isOverdueByExpectedTime(target.pollStatus)) {
            return <Tag color="red">{t('status.offline')}</Tag>;
        }
        return <Tag color="green">{t('status.online')}</Tag>;
    };

    // Recent activity - last 10 devices with activity
    const recentDevices = [...targets]
        .filter(t => t.pollStatus?.lastRequestAt)
        .sort((a, b) => (b.pollStatus?.lastRequestAt || 0) - (a.pollStatus?.lastRequestAt || 0))
        .slice(0, 8);

    const columns = [
        {
            title: t('table.name'),
            dataIndex: 'name',
            key: 'name',
            render: (_: string, record: MgmtTarget) => (
                <div>
                    <Text strong>{record.name || record.controllerId}</Text>
                    {record.ipAddress && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{record.ipAddress}</Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: t('table.status'),
            key: 'status',
            width: 120,
            render: (_: unknown, record: MgmtTarget) => getStatusTag(record),
        },
        {
            title: t('overview.lastPoll'),
            key: 'lastPoll',
            width: 150,
            render: (_: unknown, record: MgmtTarget) =>
                record.pollStatus?.lastRequestAt
                    ? dayjs(record.pollStatus.lastRequestAt).fromNow()
                    : <Text type="secondary">-</Text>,
        },
    ];

    return (
        <PageContainer>
            <PageHeader>
                <HeaderContent>
                    <GradientTitle level={2}>
                        {t('overview.title', 'Device Monitoring')}
                    </GradientTitle>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        {t('overview.subtitle', 'Real-time device status overview')}
                    </Text>
                </HeaderContent>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={() => refetch()}
                    loading={isLoading}
                >
                    {t('actions.refresh')}
                </Button>
            </PageHeader>

            {/* Status Overview Cards */}
            <Row gutter={[20, 20]}>
                <Col xs={24} sm={8}>
                    <StatsCard $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)" $delay={1}>
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
                                        {t('status.online')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.online }}>{onlineCount}</BigNumber>
                                    <Progress
                                        percent={onlinePercentage}
                                        size="small"
                                        strokeColor={COLORS.online}
                                        showInfo={false}
                                        style={{ width: 120 }}
                                    />
                                </div>
                                <CheckCircleOutlined style={{ fontSize: 48, color: COLORS.online, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={8}>
                    <StatsCard $accentColor="linear-gradient(135deg, #ef4444 0%, #f87171 100%)" $delay={2}>
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
                                        {t('status.offline')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.offline }}>{offlineCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {totalCount > 0 ? `${Math.round((offlineCount / totalCount) * 100)}% of devices` : '-'}
                                    </Text>
                                </div>
                                <CloseCircleOutlined style={{ fontSize: 48, color: COLORS.offline, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={8}>
                    <StatsCard $accentColor="linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" $delay={3}>
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
                                        {t('status.neverConnected')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.neverConnected }}>{neverConnectedCount}</BigNumber>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Awaiting first connection
                                    </Text>
                                </div>
                                <QuestionCircleOutlined style={{ fontSize: 48, color: COLORS.neverConnected, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
            </Row>

            {/* Charts and Table Row */}
            <Row gutter={[20, 20]} style={{ flex: 1, minHeight: 0 }}>
                <Col xs={24} lg={8} style={{ display: 'flex' }}>
                    <ChartCard
                        style={{ flex: 1 }}
                        title={
                            <Flex justify="space-between" align="center">
                                <span>{t('overview.deviceStatusDistribution')}</span>
                                <Statistic
                                    value={totalCount}
                                    suffix={t('table.devices', 'devices')}
                                    valueStyle={{ fontSize: 14, fontWeight: 600 }}
                                />
                            </Flex>
                        }
                        $delay={4}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={180} shape="circle" style={{ margin: '20px auto', display: 'block' }} />
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
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
                                    <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.online }}>{onlinePercentage}%</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>Online</div>
                                </div>
                                {/* Legend */}
                                <Flex justify="center" gap={16} style={{ marginTop: 8 }}>
                                    <Flex align="center" gap={6}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.online }} />
                                        <Text style={{ fontSize: 12 }}>{t('status.online')}</Text>
                                    </Flex>
                                    <Flex align="center" gap={6}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.offline }} />
                                        <Text style={{ fontSize: 12 }}>{t('status.offline')}</Text>
                                    </Flex>
                                    <Flex align="center" gap={6}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.neverConnected }} />
                                        <Text style={{ fontSize: 12 }}>{t('status.neverConnected')}</Text>
                                    </Flex>
                                </Flex>
                            </div>
                        )}
                    </ChartCard>
                </Col>
                <Col xs={24} lg={16} style={{ display: 'flex' }}>
                    <ChartCard title={t('overview.recentActivity')} $delay={5} style={{ flex: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                        <Table
                            dataSource={recentDevices}
                            columns={columns}
                            rowKey="controllerId"
                            size="small"
                            pagination={false}
                            loading={isLoading}
                            locale={{ emptyText: t('messages.noData', { ns: 'common' }) }}
                            onRow={(record) => ({
                                onClick: () => navigate(`/targets/${record.controllerId}`),
                                style: { cursor: 'pointer' }
                            })}
                        />
                    </ChartCard>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default TargetsOverview;
