import React from 'react';
import { Skeleton, Flex, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ChartCard, IconBadge, ProgressBar } from '../DashboardStyles';

const { Text } = Typography;

interface DeploymentChartProps {
    isLoading: boolean;
    deploymentRate: number | null;
    deploymentRateLabel: string;
}

export const DeploymentChart: React.FC<DeploymentChartProps> = ({
    isLoading,
    deploymentRate,
    deploymentRateLabel
}) => {
    const { t } = useTranslation(['dashboard', 'common']);

    return (
        <ChartCard
            $theme="deployment"
            title={
                <Flex align="center" gap={10}>
                    <IconBadge $theme="deployment">
                        <ThunderboltOutlined />
                    </IconBadge>
                    <Flex vertical gap={0}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('chart.deploymentRate')}</span>
                        <Text type="secondary" style={{ fontSize: 11 }}>{t('chart.completionRate', 'Completion rate')}</Text>
                    </Flex>
                </Flex>
            }
            $delay={6}
        >
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
                <Flex vertical align="center" justify="center" gap={12} style={{ flex: 1, padding: '8px 0' }}>
                    <div style={{
                        fontSize: 48,
                        fontWeight: 800,
                        background: 'var(--ant-color-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1
                    }}>
                        {deploymentRate !== null ? `${deploymentRate}%` : '-'}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('chart.targetCompletion', 'Target completion')}
                    </Text>
                    <div style={{ width: '85%' }}>
                        <ProgressBar $progress={deploymentRate ?? 0} $color="var(--ant-color-primary)" />
                    </div>
                    <Text style={{ fontSize: 12, color: 'var(--ant-color-text-description)', marginTop: 4 }}>
                        {deploymentRateLabel}
                    </Text>
                </Flex>
            )}
        </ChartCard>
    );
};
