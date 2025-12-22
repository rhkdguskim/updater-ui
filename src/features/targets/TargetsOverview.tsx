import React from 'react';
import { Card, Row, Col, Typography, Button, Flex, Skeleton, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import {
    ReloadOutlined,
    SyncOutlined,
    WifiOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { useGetTargets } from '@/api/generated/targets/targets';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { AirportSlideList } from '@/components/common';

const { Title, Text } = Typography;

// Animations
const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
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
    display: flex;
    flex-direction: column;
    
    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
    
    .ant-card-head-title {
        font-size: 15px;
        font-weight: 600;
        color: #334155;
    }
    
    .ant-card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
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

const ChartLegendItem = styled(Flex)`
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
`;

const COLORS = {
    // Update Status Colors
    inSync: '#10b981',   // Green - 동기화됨
    pending: '#3b82f6',  // Blue - 대기 중
    error: '#ef4444',    // Red - 오류
    unknown: '#94a3b8',  // Gray - 알 수 없음
    // Connectivity Colors
    online: '#10b981',   // Green - 온라인
    offline: '#f59e0b',  // Orange - 오프라인
};

const TargetsOverview: React.FC = () => {
    const { t } = useTranslation('targets');
    const navigate = useNavigate();

    const { data: allTargets, isLoading, refetch } = useGetTargets({ limit: 500 });

    const targets = allTargets?.content || [];

    // Offline check
    const isOverdueByExpectedTime = (pollStatus?: { nextExpectedRequestAt?: number }) => {
        if (!pollStatus?.nextExpectedRequestAt) return false;
        return Date.now() > pollStatus.nextExpectedRequestAt;
    };

    // --- Update Status (Provisioning) ---
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

    // Recent activity
    const recentDevices = [...targets]
        .filter(t => t.pollStatus?.lastRequestAt)
        .sort((a, b) => (b.pollStatus?.lastRequestAt || 0) - (a.pollStatus?.lastRequestAt || 0))
        .slice(0, 8);

    // Custom Legend Renderer for Pie Chart
    const renderCustomLegend = (data: { name: string; value: number; color: string }[]) => (
        <Flex vertical gap={6} style={{ marginTop: 12 }}>
            {data.map(entry => (
                <ChartLegendItem key={entry.name} align="center" justify="space-between">
                    <Flex align="center" gap={8}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: entry.color }} />
                        <Text style={{ fontSize: 13 }}>{entry.name}</Text>
                    </Flex>
                    <Text strong style={{ fontSize: 14, color: entry.color }}>{entry.value}</Text>
                </ChartLegendItem>
            ))}
        </Flex>
    );

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

            {/* Row 1: Connectivity + Update Status Charts */}
            <Row gutter={[16, 16]}>
                {/* Connectivity Distribution */}
                <Col xs={24} md={12}>
                    <ChartCard
                        title={
                            <Flex align="center" gap={8}>
                                <WifiOutlined style={{ color: COLORS.online }} />
                                <span>{t('overview.connectivityStatus', 'Connectivity Status')}</span>
                            </Flex>
                        }
                        $delay={1}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={150} shape="circle" style={{ margin: '20px auto', display: 'block' }} />
                        ) : (
                            <div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={connectivityPieData}
                                            innerRadius={55}
                                            outerRadius={75}
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
                        )}
                    </ChartCard>
                </Col>

                {/* Update Status Distribution */}
                <Col xs={24} md={12}>
                    <ChartCard
                        title={
                            <Flex align="center" gap={8}>
                                <SyncOutlined style={{ color: COLORS.pending }} />
                                <span>{t('overview.updateStatusDistribution', 'Update Status')}</span>
                            </Flex>
                        }
                        $delay={2}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={150} shape="circle" style={{ margin: '20px auto', display: 'block' }} />
                        ) : (
                            <div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={updateStatusPieData}
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {updateStatusPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {renderCustomLegend(updateStatusPieData)}
                            </div>
                        )}
                    </ChartCard>
                </Col>
            </Row>

            {/* Row 2: Recent Activity (Airport-style sliding) */}
            <Row gutter={[16, 16]} style={{ flex: 1 }}>
                <Col xs={24}>
                    <ChartCard
                        title={t('overview.recentActivity', 'Recent Device Activity')}
                        $delay={3}
                        style={{ height: '100%' }}
                        styles={{ body: { padding: '12px', flex: 1, overflow: 'hidden' } }}
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 6 }} />
                        ) : recentDevices.length > 0 ? (
                            <AirportSlideList
                                items={recentDevices}
                                itemHeight={52}
                                visibleCount={6}
                                interval={3000}
                                renderItem={(record) => (
                                    <Flex
                                        key={record.controllerId}
                                        align="center"
                                        justify="space-between"
                                        style={{
                                            padding: '10px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                                            cursor: 'pointer',
                                            height: '100%',
                                            background: 'rgba(0,0,0,0.01)',
                                            borderRadius: 6,
                                            marginBottom: 4,
                                        }}
                                        onClick={() => navigate(`/targets/${record.controllerId}`)}
                                    >
                                        <Flex align="center" gap={16} style={{ flex: 1 }}>
                                            <WifiOutlined style={{
                                                fontSize: 16,
                                                color: record.pollStatus?.overdue ? COLORS.offline : COLORS.online
                                            }} />
                                            <Text strong style={{ fontSize: 14 }}>
                                                {record.name || record.controllerId}
                                            </Text>
                                            {record.ipAddress && (
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {record.ipAddress}
                                                </Text>
                                            )}
                                        </Flex>
                                        <Tag color={record.pollStatus?.overdue ? 'red' : 'green'} style={{ margin: 0 }}>
                                            {record.pollStatus?.overdue ? t('status.offline', 'Offline') : t('status.online', 'Online')}
                                        </Tag>
                                    </Flex>
                                )}
                            />
                        ) : (
                            <Flex justify="center" align="center" style={{ height: '100%' }}>
                                <Text type="secondary">{t('messages.noData', { ns: 'common' })}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default TargetsOverview;
