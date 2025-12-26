import React, { useMemo } from 'react';
import { Skeleton, Flex, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChartCard, ChartLegendItem, IconBadge } from '../DashboardStyles';

const { Text } = Typography;

interface RolloutStatusChartProps {
    isLoading: boolean;
    activeRolloutCount: number;
    finishedRolloutCount: number;
    errorRolloutCount: number;
}

export const RolloutStatusChart: React.FC<RolloutStatusChartProps> = ({
    isLoading,
    activeRolloutCount,
    finishedRolloutCount,
    errorRolloutCount
}) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const total = activeRolloutCount + finishedRolloutCount + errorRolloutCount;

    const rolloutStatusData = useMemo(() => [
        { name: t('common:status.running'), value: activeRolloutCount, color: 'var(--ant-color-primary)' },
        { name: t('common:status.finished'), value: finishedRolloutCount, color: 'var(--ant-color-success)' },
        { name: t('common:status.error'), value: errorRolloutCount, color: 'var(--ant-color-error)' },
    ].filter(d => d.value > 0), [activeRolloutCount, finishedRolloutCount, errorRolloutCount, t]);



    return (
        <ChartCard
            $theme="rollouts"
            title={
                <Flex align="center" gap={10}>
                    <IconBadge $theme="rollouts">
                        <PlayCircleOutlined />
                    </IconBadge>
                    <Flex vertical gap={0}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('chart.rolloutStatus')}</span>
                        <Text type="secondary" style={{ fontSize: 11 }}>{t('chart.totalRollouts', { count: total })}</Text>
                    </Flex>
                </Flex>
            }
            $delay={7}
        >
            {isLoading ? (
                <Skeleton.Avatar active size={80} shape="circle" style={{ margin: '12px auto', display: 'block' }} />
            ) : rolloutStatusData.length > 0 ? (
                <Flex gap={8} style={{ flex: 1 }} align="center">
                    <ResponsiveContainer width="45%" height={100}>
                        <PieChart>
                            <Pie
                                data={rolloutStatusData}
                                innerRadius={28}
                                outerRadius={42}
                                paddingAngle={4}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {rolloutStatusData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                                    />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{
                                    borderRadius: 8,
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
                        {rolloutStatusData.map(entry => (
                            <ChartLegendItem key={entry.name} style={{ padding: '6px 10px' }}>
                                <Flex align="center" gap={6}>
                                    <div style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 3,
                                        background: entry.color,
                                        flexShrink: 0
                                    }} />
                                    <Text style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{entry.name}</Text>
                                </Flex>
                                <Text strong style={{ fontSize: 12, color: entry.color }}>{entry.value}</Text>
                            </ChartLegendItem>
                        ))}
                    </Flex>
                </Flex>
            ) : (
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Text type="secondary">{t('common:messages.noData')}</Text>
                </Flex>
            )}
        </ChartCard>
    );
};
