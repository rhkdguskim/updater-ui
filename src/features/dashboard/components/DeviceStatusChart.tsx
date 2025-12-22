import React, { useMemo } from 'react';
import { Card, Empty, Typography, Flex, Skeleton } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

const { Text } = Typography;

interface DeviceStatusChartProps {
    total: number;
    onlineCount: number;
    offlineCount: number;
    loading?: boolean;
}

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
`;

const ChartCard = styled(Card)`
    height: 100%;
    border: none;
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    transition: all 0.25s var(--ease-smooth);
    
    &:hover {
        box-shadow: var(--shadow-lg);
    }
    
    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    
    .ant-card-head-title {
        font-size: 14px;
        font-weight: 600;
    }
`;

const ChartContainer = styled.div`
    position: relative;
    animation: ${fadeIn} 0.5s ease-out;
`;

const CenterLabel = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
`;

const TotalValue = styled.div`
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const TotalLabel = styled.div`
    font-size: 12px;
    color: var(--status-neutral);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
`;

const LegendContainer = styled.div`
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 16px;
`;

const LegendItem = styled.div<{ $clickable?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: ${props => props.$clickable ? 'pointer' : 'default'};
    transition: all var(--transition-fast) var(--ease-smooth);
    
    &:hover {
        background: rgba(0, 0, 0, 0.04);
    }
`;

const LegendDot = styled.div<{ $color: string }>`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$color};
    box-shadow: 0 0 8px ${props => props.$color}40;
`;

const COLORS = {
    Online: '#10b981',
    Offline: '#94a3b8'
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isOnline = data.name === 'Online';
        return (
            <div style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <Flex align="center" gap={8}>
                    {isOnline ? (
                        <CheckCircleFilled style={{ color: COLORS.Online, fontSize: 16 }} />
                    ) : (
                        <CloseCircleFilled style={{ color: COLORS.Offline, fontSize: 16 }} />
                    )}
                    <Text style={{ color: '#fff', fontWeight: 600 }}>
                        {data.name}: {data.value} devices
                    </Text>
                </Flex>
                <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    {data.percentage.toFixed(1)}% of total
                </div>
            </div>
        );
    }
    return null;
};

const DeviceStatusChart: React.FC<DeviceStatusChartProps> = ({
    total,
    onlineCount,
    offlineCount,
    loading
}) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const navigate = useNavigate();

    const data = useMemo(() => [
        {
            name: t('chart.online'),
            value: onlineCount,
            color: COLORS.Online,
            percentage: total > 0 ? (onlineCount / total) * 100 : 0
        },
        {
            name: t('chart.offline'),
            value: offlineCount,
            color: COLORS.Offline,
            percentage: total > 0 ? (offlineCount / total) * 100 : 0
        }
    ], [onlineCount, offlineCount, total, t]);

    const handleClick = () => {
        // Note: pollStatus.overdue is not a valid search parameter in hawkBit API
        // Navigate to targets list without filter
        navigate('/targets/list');
    };

    if (loading) {
        return (
            <ChartCard title={t('charts.deviceStatus')}>
                <Skeleton.Avatar active size={180} shape="circle" style={{ margin: '20px auto', display: 'block' }} />
            </ChartCard>
        );
    }

    return (
        <ChartCard title={t('charts.deviceStatus')}>
            {total === 0 ? (
                <Empty description={t('empty.noDevices')} />
            ) : (
                <ChartContainer>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <defs>
                                <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                                <linearGradient id="offlineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#94a3b8" />
                                    <stop offset="100%" stopColor="#64748b" />
                                </linearGradient>
                            </defs>
                            <Pie
                                data={data}
                                innerRadius={65}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                cursor="pointer"
                                onClick={() => handleClick()}
                                strokeWidth={0}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.name === t('chart.online') ? 'url(#onlineGradient)' : 'url(#offlineGradient)'}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    <CenterLabel>
                        <TotalValue>{total}</TotalValue>
                        <TotalLabel>{t('chart.deviceStatus')}</TotalLabel>
                    </CenterLabel>
                </ChartContainer>
            )}

            {total > 0 && (
                <LegendContainer>
                    <LegendItem $clickable onClick={() => handleClick()}>
                        <LegendDot $color={COLORS.Online} />
                        <Text>
                            <span style={{ fontWeight: 600 }}>{onlineCount}</span>
                            <span style={{ color: 'var(--status-neutral)', marginLeft: 4 }}>{t('chart.online')}</span>
                        </Text>
                    </LegendItem>
                    <LegendItem $clickable onClick={() => handleClick()}>
                        <LegendDot $color={COLORS.Offline} />
                        <Text>
                            <span style={{ fontWeight: 600 }}>{offlineCount}</span>
                            <span style={{ color: 'var(--status-neutral)', marginLeft: 4 }}>{t('chart.offline')}</span>
                        </Text>
                    </LegendItem>
                </LegendContainer>
            )}
        </ChartCard>
    );
};

export { DeviceStatusChart };

