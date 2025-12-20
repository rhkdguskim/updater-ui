import React from 'react';
import { Row, Col, Typography } from 'antd';
import {
    DesktopOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetActions } from '@/api/generated/actions/actions';
import { useAuthStore } from '@/stores/useAuthStore';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTrendData } from './hooks/useTrendData';

// Components
import { KPICard } from './components/KPICard';
import { ActiveRolloutCard } from './components/ActiveRolloutCard';
import { FailureChart } from './components/FailureChart';
import { VersionTreemap } from './components/VersionTreemap';

const { Title } = Typography;

const Dashboard: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const { role } = useAuthStore();

    // Redirect if not authenticated
    if (!role) {
        return <Navigate to="/login" replace />;
    }

    // Fetch All Targets (client-side calc for now) - 10s polling
    const { data: targetsData, isLoading: targetsLoading } = useGetTargets(
        { limit: 100 },
        { query: { refetchInterval: 10000 } }
    );

    // Fetch Actions for Success Rate and FailureChart
    const { data: actionsData, isLoading: actionsLoading } = useGetActions(
        { limit: 100 },
        { query: { refetchInterval: 10000 } }
    );

    // KPI Calculations
    const totalTargets = targetsData?.total || 0;
    const onlineCount = targetsData?.content?.filter((t) => t.pollStatus?.overdue === false).length || 0;
    const offlineCount = targetsData?.content?.filter((t) => t.pollStatus?.overdue === true).length || 0;

    // Calculate Success Rate
    const calculateSuccessRate = () => {
        if (!actionsData?.content || actionsData.content.length === 0) return 0;
        const actions = actionsData.content;
        const finished = actions.filter((a) => a.status === 'finished').length;
        const error = actions.filter((a) => a.status === 'error').length;
        if (finished + error === 0) return 0;
        return Math.round((finished / (finished + error)) * 100);
    };

    const successRate = calculateSuccessRate();
    const successColor = successRate >= 90 ? '#52c41a' : successRate >= 80 ? '#faad14' : '#ff4d4f';

    // Real Trend Data (Client-side persistence)
    const trends = useTrendData({
        totalTargets,
        onlineCount,
        offlineCount,
        successRate
    }, targetsLoading || actionsLoading);

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <Title level={3} style={{ marginBottom: 24, fontWeight: 700 }}>
                {t('pageTitle')}
            </Title>

            {/* Row 1: KPI Cards */}
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title={t('kpi.totalTargets')}
                        value={totalTargets}
                        loading={targetsLoading}
                        trend={trends.totalTargets ?? undefined}
                        prefixIcon={<DesktopOutlined />}
                        color="#1890ff"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title={t('kpi.onlineTargets')}
                        value={onlineCount}
                        loading={targetsLoading}
                        trend={trends.onlineCount ?? undefined}
                        prefixIcon={<CheckCircleOutlined />}
                        color="#52c41a"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title={t('kpi.offlineTargets')}
                        value={offlineCount}
                        loading={targetsLoading}
                        trend={trends.offlineCount ?? undefined}
                        prefixIcon={<CloseCircleOutlined />}
                        color="#ff4d4f"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title={t('kpi.successRate')}
                        value={successRate}
                        suffix="%"
                        loading={actionsLoading}
                        trend={trends.successRate ?? undefined}
                        prefixIcon={<RiseOutlined />}
                        color={successColor}
                    />
                </Col>
            </Row>

            {/* Row 2: Active Rollout & Failure Analysis */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={10} xl={8}>
                    <ActiveRolloutCard />
                </Col>
                <Col xs={24} lg={14} xl={16}>
                    <FailureChart
                        actions={actionsData?.content || []}
                        loading={actionsLoading}
                    />
                </Col>
            </Row>

            {/* Row 3: Version/Status Map */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <VersionTreemap
                        targets={targetsData?.content || []}
                        loading={targetsLoading}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
