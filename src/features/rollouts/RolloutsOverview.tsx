import React from 'react';
import { Card, Row, Col, Typography, Statistic, Button, Flex, Skeleton, Progress, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import {
    RocketOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import { useAuthStore } from '@/stores/useAuthStore';

const { Title, Text } = Typography;

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    overflow: auto;
    animation: ${fadeIn} 0.4s ease-out;
`;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
`;

const StatsCard = styled(Card) <{ $accentColor?: string }>`
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    transition: all 0.25s var(--ease-smooth);
    position: relative;
    overflow: hidden;
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
        box-shadow: var(--shadow-xl);
    }
`;

const ChartCard = styled(Card)`
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    
    .ant-card-head-title {
        font-size: 14px;
        font-weight: 600;
    }
`;

const RolloutPreviewCard = styled(Card)`
    border: none;
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        box-shadow: var(--shadow-md);
        transform: translateX(4px);
    }
`;

const IconWrapper = styled.div<{ $bg?: string }>`
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.$bg || 'rgba(99, 102, 241, 0.1)'};
    font-size: 20px;
`;

const COLORS = {
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

    // Fetch all rollouts
    const { data: allRollouts, isLoading } = useGetRollouts({ limit: 100 });

    // Calculate status counts
    const rollouts = allRollouts?.content || [];
    const totalCount = rollouts.length;

    const runningCount = rollouts.filter(r => r.status === 'running').length;
    const finishedCount = rollouts.filter(r => r.status === 'finished').length;
    const pausedCount = rollouts.filter(r => r.status === 'paused').length;
    const errorCount = rollouts.filter(r => r.status === 'error' || r.status === 'stopped').length;
    const scheduledCount = rollouts.filter(r => r.status === 'scheduled' || r.status === 'ready').length;

    // Active rollouts (running or paused)
    const activeRollouts = rollouts.filter(r => r.status === 'running' || r.status === 'paused');

    const getStatusLabel = (status?: string) => {
        if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
    };

    const pieData = [
        { name: t('overview.running', 'Running'), value: runningCount, color: COLORS.running },
        { name: t('overview.finished', 'Finished'), value: finishedCount, color: COLORS.finished },
        { name: t('common:status.paused', 'Paused'), value: pausedCount, color: COLORS.paused },
        { name: t('overview.errorStopped', 'Error'), value: errorCount, color: COLORS.error },
        { name: t('common:status.scheduled', 'Scheduled'), value: scheduledCount, color: COLORS.scheduled },
    ].filter(d => d.value > 0);

    const getRolloutProgress = (rollout: { totalTargets?: number; totalTargetsPerStatus?: Record<string, number> }) => {
        const total = rollout.totalTargets || 0;
        const finished = rollout.totalTargetsPerStatus?.finished || 0;
        if (!total) {
            return 0;
        }
        return Math.round((finished / total) * 100);
    };

    return (
        <PageContainer>
            <PageHeader>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        {t('overview.title', 'Rollout Management')}
                    </Title>
                    <Text type="secondary">
                        {t('overview.subtitle', 'Deployment rollout overview and monitoring')}
                    </Text>
                </div>
                <Flex gap={8}>
                    {isAdmin && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/rollouts/create')}
                        >
                            {t('overview.createRollout', 'Create Rollout')}
                        </Button>
                    )}
                    <Button
                        icon={<RocketOutlined />}
                        onClick={() => navigate('/rollouts/list')}
                    >
                        {t('overview.viewAll', 'View All Rollouts')}
                    </Button>
                </Flex>
            </PageHeader>

            {/* KPI Cards Row */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard $accentColor="var(--gradient-primary)" onClick={() => navigate('/rollouts/list')}>
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="start">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('overview.totalRollouts', 'Total Rollouts')}
                                    </Text>
                                    <Statistic
                                        value={totalCount}
                                        valueStyle={{ fontSize: 32, fontWeight: 700 }}
                                    />
                                </div>
                                <IconWrapper $bg="rgba(99, 102, 241, 0.1)">
                                    <RocketOutlined style={{ color: '#6366f1' }} />
                                </IconWrapper>
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard $accentColor="var(--gradient-info)" onClick={() => navigate('/rollouts/list?status=running')}>
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="start">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('overview.running', 'Running')}
                                    </Text>
                                    <Statistic
                                        value={runningCount}
                                        valueStyle={{ fontSize: 32, fontWeight: 700, color: COLORS.running }}
                                    />
                                </div>
                                <IconWrapper $bg="rgba(59, 130, 246, 0.1)">
                                    <PlayCircleOutlined style={{ color: COLORS.running }} />
                                </IconWrapper>
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard $accentColor="var(--gradient-success)" onClick={() => navigate('/rollouts/list?status=finished')}>
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="start">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('overview.finished', 'Finished')}
                                    </Text>
                                    <Statistic
                                        value={finishedCount}
                                        valueStyle={{ fontSize: 32, fontWeight: 700, color: COLORS.finished }}
                                    />
                                </div>
                                <IconWrapper $bg="rgba(34, 197, 94, 0.1)">
                                    <CheckCircleOutlined style={{ color: COLORS.finished }} />
                                </IconWrapper>
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard $accentColor="var(--gradient-danger)" onClick={() => navigate('/rollouts/list?status=error')}>
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="start">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('overview.errorStopped', 'Error/Stopped')}
                                    </Text>
                                    <Statistic
                                        value={errorCount}
                                        valueStyle={{ fontSize: 32, fontWeight: 700, color: COLORS.error }}
                                    />
                                </div>
                                <IconWrapper $bg="rgba(239, 68, 68, 0.1)">
                                    <CloseCircleOutlined style={{ color: COLORS.error }} />
                                </IconWrapper>
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
            </Row>

            {/* Charts and Active Rollouts Row */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <ChartCard title={t('overview.statusDistribution', 'Status Distribution')}>
                        {isLoading ? (
                            <Skeleton.Avatar active size={180} shape="circle" style={{ margin: '20px auto', display: 'block' }} />
                        ) : totalCount === 0 ? (
                            <Flex align="center" justify="center" style={{ height: 200 }}>
                                <Text type="secondary">{t('overview.noRollouts', 'No rollouts yet')}</Text>
                            </Flex>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 28, fontWeight: 700 }}>{totalCount}</div>
                                    <div style={{ fontSize: 12, color: 'var(--status-neutral)' }}>{t('overview.total')}</div>
                                </div>
                            </div>
                        )}
                    </ChartCard>
                </Col>
                <Col xs={24} lg={16}>
                    <ChartCard
                        title={t('overview.activeRollouts', 'Active Rollouts')}
                        extra={
                            <Button type="link" size="small" onClick={() => navigate('/rollouts/list')}>
                                {t('overview.viewAll', 'View All')}
                            </Button>
                        }
                    >
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 3 }} />
                        ) : activeRollouts.length === 0 ? (
                            <Flex align="center" justify="center" style={{ height: 180, flexDirection: 'column', gap: 8 }}>
                                <ClockCircleOutlined style={{ fontSize: 32, color: 'var(--status-neutral)' }} />
                                <Text type="secondary">{t('overview.noActiveRollouts', 'No active rollouts')}</Text>
                                {isAdmin && (
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => navigate('/rollouts/create')}
                                    >
                                        {t('overview.createFirst', 'Create First Rollout')}
                                    </Button>
                                )}
                            </Flex>
                        ) : (
                            <div style={{ maxHeight: 250, overflow: 'auto' }}>
                                {activeRollouts.slice(0, 4).map(rollout => (
                                    <RolloutPreviewCard
                                        key={rollout.id}
                                        size="small"
                                        onClick={() => navigate(`/rollouts/${rollout.id}`)}
                                    >
                                        <Flex justify="space-between" align="center">
                                            <div>
                                                <Flex align="center" gap={8}>
                                                    <Text strong>{rollout.name}</Text>
                                                    <Tag color={statusColorMap[rollout.status || ''] || 'default'}>
                                                        {getStatusLabel(rollout.status)}
                                                    </Tag>
                                                </Flex>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {rollout.targetFilterQuery || t('overview.allTargets', 'All targets')}
                                                </Text>
                                            </div>
                                            <Progress
                                                type="circle"
                                                percent={getRolloutProgress(rollout)}
                                                size={48}
                                                strokeColor={COLORS.running}
                                            />
                                        </Flex>
                                    </RolloutPreviewCard>
                                ))}
                            </div>
                        )}
                    </ChartCard>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default RolloutsOverview;


