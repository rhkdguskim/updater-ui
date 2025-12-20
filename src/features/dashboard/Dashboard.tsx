import React, { useState, useMemo } from 'react';
import { Row, Col, Button, Tooltip, Spin } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, CloudServerOutlined, CheckCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

// Components
import {
    KPICard,
    FailureChart,
    VersionTreemap,
    ActiveRolloutCard,
    LiveTicker
} from './components';

// API Hooks
import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetActions } from '@/api/generated/actions/actions';

const DashboardContainer = styled.div<{ $isFocusMode: boolean }>`
    height: ${(props) => (props.$isFocusMode ? '100vh' : 'calc(100vh - 64px)')};
    width: 100%;
    position: ${(props) => (props.$isFocusMode ? 'fixed' : 'relative')};
    top: 0;
    left: 0;
    z-index: ${(props) => (props.$isFocusMode ? 1000 : 1)};
    background: #f0f2f5;
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    gap: 16px;
`;

const TopRow = styled.div`
    flex: 0 0 100px;
`;

const MiddleRow = styled.div`
    flex: 1;
    min-height: 0;
`;

const BottomRow = styled.div`
    flex: 0 0 40px;
`;

const FloatingActionButton = styled(Button)`
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1001;
    opacity: 0.5;
    &:hover {
        opacity: 1;
    }
`;

const Dashboard: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const [isFocusMode, setIsFocusMode] = useState(false);

    // Fetch Base Data without complex sorting/filtering to avoid API errors
    const { data: targetsData, isLoading: targetsLoading } = useGetTargets({ limit: 100 });
    const { data: actionsData, isLoading: actionsLoading } = useGetActions({ limit: 100 });

    const toggleFocusMode = () => {
        setIsFocusMode(!isFocusMode);
        if (!isFocusMode) {
            document.documentElement.requestFullscreen().catch((e) => console.error(e));
        } else if (document.fullscreenElement) {
            document.exitFullscreen().catch((e) => console.error(e));
        }
    };

    // Calculate Metrics client-side
    const totalTargets = targetsData?.total || 0;
    const onlineTargets = useMemo(() => {
        if (!targetsData?.content) return 0;
        // If we have total > limit, this is just an estimate from the current page
        // But for many systems, 100 is a decent sample or the full set
        return targetsData.content.filter(t => t.pollStatus?.overdue === false).length;
    }, [targetsData]);

    // Adjust onlineTargets if total is larger - scaling the sample
    const estimatedOnlineTotal = totalTargets > 100
        ? Math.round((onlineTargets / 100) * totalTargets)
        : onlineTargets;

    const availability = totalTargets > 0 ? (estimatedOnlineTotal / totalTargets) * 100 : 0;

    const pendingActions = useMemo(() => {
        if (!actionsData?.content) return 0;
        return actionsData.content.filter(a => ['scheduled', 'pending'].includes(a.status?.toLowerCase() || '')).length;
    }, [actionsData]);

    const successRate = useMemo(() => {
        if (!actionsData?.content) return 0;
        const finished = actionsData.content.filter(a => a.status === 'finished').length;
        const error = actionsData.content.filter(a => a.status === 'error').length;
        const total = finished + error;
        return total > 0 ? (finished / total) * 100 : 0;
    }, [actionsData]);

    // Treemap Data from Target Types
    const treemapData = useMemo(() => {
        const types: Record<string, number> = {};
        targetsData?.content?.forEach(target => {
            const typeName = target.targetTypeName || 'Unknown';
            types[typeName] = (types[typeName] || 0) + 1;
        });
        const colors = ['#52c41a', '#1890ff', '#faad14', '#ff4d4f', '#722ed1'];
        return Object.entries(types).map(([name, size], index) => ({
            name,
            size,
            fill: colors[index % colors.length]
        }));
    }, [targetsData]);

    // Failure Data 
    const failureData = useMemo(() => {
        const errors = actionsData?.content?.filter(a => a.status === 'error') || [];
        // Distribution of errors (mocked buckets but based on real error count)
        const count = errors.length;
        return Array.from({ length: 6 }, (_, i) => ({
            time: `${i * 4}h`,
            timeout: i === 5 ? count : 0, // Put real count in the last bucket for visibility
            installError: 0,
            networkError: 0,
        }));
    }, [actionsData]);

    // Live Ticker Logs
    const liveLogs = useMemo(() => {
        return (actionsData?.content || [])
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .map(action => ({
                id: action.id!,
                time: action.createdAt ? new Date(action.createdAt).toLocaleTimeString() : '-',
                type: action.status === 'error' ? 'error' : action.status === 'finished' ? 'success' : 'info',
                message: `Action ${action.id} (${action.status}): Target ${action._links?.target?.href?.split('/').pop() || 'Unknown'}`
            }));
    }, [actionsData]);

    if (targetsLoading || actionsLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" tip="Loading Dashboard Data..." />
            </div>
        );
    }

    return (
        <DashboardContainer $isFocusMode={isFocusMode}>
            <Tooltip title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}>
                <FloatingActionButton
                    type="primary"
                    shape="circle"
                    icon={isFocusMode ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={toggleFocusMode}
                />
            </Tooltip>

            {/* Top Row: KPIs */}
            <TopRow>
                <Row gutter={16} style={{ height: '100%' }}>
                    <Col span={6} style={{ height: '100%' }}>
                        <KPICard
                            title={t('charts.availability')}
                            value={availability.toFixed(1)}
                            suffix="%"
                            icon={<CloudServerOutlined />}
                            color="#52c41a"
                        />
                    </Col>
                    <Col span={6} style={{ height: '100%' }}>
                        <KPICard
                            title={t('charts.successRate')}
                            value={successRate.toFixed(1)}
                            suffix="%"
                            icon={<CheckCircleOutlined />}
                            color="#1890ff"
                        />
                    </Col>
                    <Col span={6} style={{ height: '100%' }}>
                        <KPICard
                            title={t('charts.pendingActions')}
                            value={pendingActions}
                            icon={<ClockCircleOutlined />}
                            color="#faad14"
                        />
                    </Col>
                    <Col span={6} style={{ height: '100%' }}>
                        <KPICard
                            title={t('charts.totalTargets')}
                            value={totalTargets}
                            icon={<WarningOutlined />}
                            color="#722ed1"
                        />
                    </Col>
                </Row>
            </TopRow>

            {/* Middle Row: Charts */}
            <MiddleRow>
                <Row gutter={16} style={{ height: '100%' }}>
                    <Col span={8} style={{ height: '100%' }}>
                        <FailureChart data={failureData} />
                    </Col>
                    <Col span={8} style={{ height: '100%' }}>
                        <ActiveRolloutCard />
                    </Col>
                    <Col span={8} style={{ height: '100%' }}>
                        <VersionTreemap data={treemapData} />
                    </Col>
                </Row>
            </MiddleRow>

            {/* Bottom Row: Ticker */}
            <BottomRow>
                <LiveTicker logs={liveLogs} />
            </BottomRow>
        </DashboardContainer>
    );
};

export default Dashboard;