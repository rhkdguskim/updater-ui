import React, { useMemo } from 'react';
import { Skeleton, Flex, Typography } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChartCard, ChartLegendItem, IconBadge } from '../DashboardStyles';

const { Text } = Typography;

interface ActionStatusChartProps {
    isLoading: boolean;
    pendingCount: number;
    finishedCount: number;
    errorCount: number;
}

export const ActionStatusChart: React.FC<ActionStatusChartProps> = ({
    isLoading,
    pendingCount,
    finishedCount,
    errorCount
}) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const total = pendingCount + finishedCount + errorCount;

    const actionStatusData = useMemo(() => [
        { name: t('common:status.running'), value: pendingCount, color: 'var(--ant-color-warning)' },
        { name: t('common:status.finished'), value: finishedCount, color: 'var(--ant-color-success)' },
        { name: t('common:status.error'), value: errorCount, color: 'var(--ant-color-error)' },
    ].filter(d => d.value > 0), [pendingCount, finishedCount, errorCount, t]);

    const renderCustomLegend = (data: { name: string; value: number; color: string }[]) => (
        <Flex vertical gap={4} style={{ marginTop: 4 }}>
            {data.map(entry => (
                <ChartLegendItem key={entry.name}>
                    <Flex align="center" gap={6}>
                        <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: entry.color,
                            boxShadow: `0 1px 3px ${entry.color}40`
                        }} />
                        <Text style={{ fontSize: 11, color: 'var(--ant-color-text-description)' }}>{entry.name}</Text>
                    </Flex>
                    <Text strong style={{ fontSize: 12, color: entry.color }}>{entry.value}</Text>
                </ChartLegendItem>
            ))}
        </Flex>
    );

    return (
        <ChartCard
            $theme="actions"
            title={
                <Flex align="center" gap={10}>
                    <IconBadge $theme="actions">
                        <SyncOutlined />
                    </IconBadge>
                    <Flex vertical gap={0}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('chart.actionStatus')}</span>
                        <Text type="secondary" style={{ fontSize: 11 }}>{t('chart.recentActions', { count: total })}</Text>
                    </Flex>
                </Flex>
            }
            $delay={8}
        >
            {isLoading ? (
                <Skeleton.Avatar active size={80} shape="circle" style={{ margin: '12px auto', display: 'block' }} />
            ) : actionStatusData.length > 0 ? (
                <Flex vertical style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height={110}>
                        <PieChart>
                            <Pie
                                data={actionStatusData}
                                innerRadius={32}
                                outerRadius={48}
                                paddingAngle={4}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {actionStatusData.map((entry, index) => (
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
                    {renderCustomLegend(actionStatusData)}
                </Flex>
            ) : (
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Text type="secondary">{t('common:messages.noData')}</Text>
                </Flex>
            )}
        </ChartCard>
    );
};
