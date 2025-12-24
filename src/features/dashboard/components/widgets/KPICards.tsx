import React from 'react';
import { Flex, Skeleton, Tag, Progress, Typography } from 'antd';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatsCard, BigNumber, KPIGridContainer, COLORS } from '../DashboardStyles';

const { Text } = Typography;

interface KPICardsProps {
    isLoading: boolean;
    onlineCount: number;
    totalDevices: number;
    successRate: number | null;
    pendingCount: number;
    errorCount: number;
}

export const KPICards: React.FC<KPICardsProps> = ({
    isLoading,
    onlineCount,
    totalDevices,
    successRate,
    pendingCount,
    errorCount,
}) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const navigate = useNavigate();

    return (
        <KPIGridContainer>
            <StatsCard
                $accentColor="var(--ant-color-success, linear-gradient(135deg, #10b981 0%, #34d399 100%))"
                $delay={1}
                onClick={() => navigate('/targets')}
            >
                {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                    <Flex vertical gap={2}>
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                            {t('kpi.connectivity', 'Connectivity')}
                        </Text>
                        <BigNumber style={{ color: COLORS.online }}>{onlineCount}/{totalDevices}</BigNumber>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                            {t('kpi.onlineDevices', 'online devices')}
                        </Text>
                    </Flex>
                )}
            </StatsCard>
            <StatsCard
                $accentColor="var(--ant-color-primary, linear-gradient(135deg, #3b82f6 0%, #6366f1 100%))"
                $delay={2}
                onClick={() => navigate('/actions')}
            >
                {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                    <Flex vertical gap={2}>
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
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
                        />
                    </Flex>
                )}
            </StatsCard>
            <StatsCard
                $accentColor="var(--ant-color-warning, linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%))"
                $delay={3}
                $pulse={pendingCount > 0}
                onClick={() => navigate('/actions')}
            >
                {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                    <Flex vertical gap={2}>
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                            {t('kpi.pendingActions', 'Pending Actions')}
                        </Text>
                        <BigNumber style={{ color: COLORS.pending }}>{pendingCount}</BigNumber>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                            {t('kpi.last24h', 'Last 24 hours')}
                        </Text>
                    </Flex>
                )}
            </StatsCard>
            <StatsCard
                $accentColor="var(--ant-color-error, linear-gradient(135deg, #ef4444 0%, #f87171 100%))"
                $delay={4}
                $pulse={errorCount > 0}
                onClick={() => navigate('/actions')}
            >
                {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                    <Flex vertical gap={2}>
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                            {t('kpi.errors', 'Errors')}
                        </Text>
                        <BigNumber style={{ color: errorCount > 0 ? COLORS.error : '#64748b' }}>
                            {errorCount}
                        </BigNumber>
                        {errorCount > 0 ? (
                            <Tag color="red" icon={<WarningOutlined />} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>{t('kpi.requiresAttention')}</Tag>
                        ) : (
                            <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>{t('kpi.allClear')}</Tag>
                        )}
                    </Flex>
                )}
            </StatsCard>
        </KPIGridContainer>
    );
};
