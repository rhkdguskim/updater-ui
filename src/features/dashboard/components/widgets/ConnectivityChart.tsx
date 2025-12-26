import React, { useMemo } from 'react';
import { Skeleton, Flex, Typography } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChartCard, ChartLegendItem, COLORS, IconBadge } from '../DashboardStyles';

const { Text } = Typography;

interface ConnectivityChartProps {
    isLoading: boolean;
    onlineCount: number;
    offlineCount: number;
}

export const ConnectivityChart: React.FC<ConnectivityChartProps> = ({ isLoading, onlineCount, offlineCount }) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const total = onlineCount + offlineCount;
    const onlinePercent = total > 0 ? Math.round((onlineCount / total) * 100) : 0;

    const connectivityPieData = useMemo(() => [
        { name: t('chart.online'), value: onlineCount, color: COLORS.online },
        { name: t('chart.offline'), value: offlineCount, color: COLORS.offline },
    ].filter(d => d.value > 0), [onlineCount, offlineCount, t]);



    return (
        <ChartCard
            $theme="connectivity"
            title={
                <Flex align="center" gap={10}>
                    <IconBadge $theme="connectivity">
                        <ApiOutlined />
                    </IconBadge>
                    <Flex vertical gap={0}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t('chart.connectivityStatus')}</span>
                        <Text type="secondary" style={{ fontSize: 11 }}>{t('overview.percentOnline', { percent: onlinePercent })}</Text>
                    </Flex>
                </Flex>
            }
            $delay={5}
        >
            {isLoading ? (
                <Skeleton.Avatar active size={80} shape="circle" style={{ margin: '12px auto', display: 'block' }} />
            ) : connectivityPieData.length > 0 ? (
                <Flex gap={8} style={{ flex: 1 }} align="center">
                    <ResponsiveContainer width="45%" height={100}>
                        <PieChart>
                            <Pie
                                data={connectivityPieData}
                                innerRadius={28}
                                outerRadius={42}
                                paddingAngle={4}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {connectivityPieData.map((entry, index) => (
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
                        {connectivityPieData.map(entry => (
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
