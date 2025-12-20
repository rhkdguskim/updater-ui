import React from 'react';
import { Card, Row, Col, Statistic, Skeleton, Empty, Typography } from 'antd';
import {
    DesktopOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetActions } from '@/api/generated/actions/actions';
import { useAuthStore } from '@/stores/useAuthStore';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const StyledCard = styled(Card)`
    height: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ChartCard = styled(Card)`
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-top: 24px;
`;

const COLORS = ['#52c41a', '#ff4d4f', '#1890ff', '#faad14'];

const Dashboard: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const { role } = useAuthStore();

    // Redirect if not authenticated
    if (!role) {
        return <Navigate to="/login" replace />;
    }

    // Fetch All Targets (calculate Online/Offline client-side) - 10s polling
    const { data: targetsData, isLoading: targetsLoading, isError: targetsError } = useGetTargets(
        { limit: 100 },
        { query: { refetchInterval: 10000 } }
    );

    // Fetch Actions for Success Rate and Chart - 10s polling
    const { data: actionsData, isLoading: actionsLoading, isError: actionsError } = useGetActions(
        { limit: 100 },
        { query: { refetchInterval: 10000 } }
    );

    // Calculate Online/Offline counts from targets list
    const totalTargets = targetsData?.total || 0;
    const onlineCount = targetsData?.content?.filter((t) => t.pollStatus?.overdue === false).length || 0;
    const offlineCount = targetsData?.content?.filter((t) => t.pollStatus?.overdue === true).length || 0;

    // Calculate Success Rate
    const calculateSuccessRate = () => {
        if (!actionsData?.content || actionsData.content.length === 0) return null;
        const actions = actionsData.content;
        const finished = actions.filter((a) => a.status === 'finished').length;
        const error = actions.filter((a) => a.status === 'error').length;
        if (finished + error === 0) return null;
        return Math.round((finished / (finished + error)) * 100);
    };

    const successRate = calculateSuccessRate();

    // Prepare Pie Chart Data
    const pieChartData = [
        { name: t('charts.online'), value: onlineCount },
        { name: t('charts.offline'), value: offlineCount },
    ];
    const hasPieData = onlineCount > 0 || offlineCount > 0;

    // Prepare Bar Chart Data (Action Status Distribution)
    const actionStatusCounts = {
        finished: actionsData?.content?.filter((a) => a.status === 'finished').length || 0,
        error: actionsData?.content?.filter((a) => a.status === 'error').length || 0,
        running: actionsData?.content?.filter((a) => a.status === 'running').length || 0,
        pending: actionsData?.content?.filter((a) => a.status === 'pending').length || 0,
    };
    const barChartData = [
        { name: t('charts.finished'), value: actionStatusCounts.finished },
        { name: t('charts.error'), value: actionStatusCounts.error },
        { name: t('charts.running'), value: actionStatusCounts.running },
        { name: t('charts.pending'), value: actionStatusCounts.pending },
    ];
    const hasBarData = Object.values(actionStatusCounts).some((v) => v > 0);

    return (
        <div style={{ padding: '24px' }}>
            <Title level={4} style={{ marginBottom: 24 }}>{t('pageTitle')}</Title>

            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <StyledCard>
                        {targetsLoading ? (
                            <Skeleton active paragraph={false} />
                        ) : targetsError ? (
                            <Empty description={t('errors.loadFailed')} />
                        ) : (
                            <Statistic
                                title={t('kpi.totalTargets')}
                                value={totalTargets}
                                prefix={<DesktopOutlined />}
                            />
                        )}
                    </StyledCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StyledCard>
                        {targetsLoading ? (
                            <Skeleton active paragraph={false} />
                        ) : targetsError ? (
                            <Empty description={t('errors.loadFailed')} />
                        ) : (
                            <Statistic
                                title={t('kpi.onlineTargets')}
                                value={onlineCount}
                                styles={{ content: { color: '#52c41a' } }}
                                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            />
                        )}
                    </StyledCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StyledCard>
                        {targetsLoading ? (
                            <Skeleton active paragraph={false} />
                        ) : targetsError ? (
                            <Empty description={t('errors.loadFailed')} />
                        ) : (
                            <Statistic
                                title={t('kpi.offlineTargets')}
                                value={offlineCount}
                                styles={{ content: { color: '#ff4d4f' } }}
                                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            />
                        )}
                    </StyledCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StyledCard>
                        {actionsLoading ? (
                            <Skeleton active paragraph={false} />
                        ) : actionsError ? (
                            <Empty description={t('errors.loadFailed')} />
                        ) : successRate === null ? (
                            <Statistic
                                title={t('kpi.successRate')}
                                value={t('kpi.notAvailable')}
                                prefix={<RiseOutlined />}
                            />
                        ) : (
                            <Statistic
                                title={t('kpi.successRate')}
                                value={successRate}
                                suffix="%"
                                styles={{ content: { color: successRate >= 80 ? '#52c41a' : '#faad14' } }}
                                prefix={<RiseOutlined style={{ color: successRate >= 80 ? '#52c41a' : '#faad14' }} />}
                            />
                        )}
                    </StyledCard>
                </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={12}>
                    <ChartCard title={t('charts.deviceStatus')}>
                        {targetsLoading ? (
                            <Skeleton active />
                        ) : targetsError ? (
                            <Empty description={t('errors.chartLoadFailed')} />
                        ) : !hasPieData ? (
                            <Empty description={t('empty.noDevices')} />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    >
                                        {pieChartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </Col>
                <Col xs={24} lg={12}>
                    <ChartCard title={t('charts.actionStatus')}>
                        {actionsLoading ? (
                            <Skeleton active />
                        ) : actionsError ? (
                            <Empty description={t('errors.chartLoadFailed')} />
                        ) : !hasBarData ? (
                            <Empty description={t('empty.noActions')} />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barChartData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" name={t('charts.count')}>
                                        {barChartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;

