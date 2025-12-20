import React from 'react';
import { Card, Statistic, Typography, Flex, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Text } = Typography;

const CompactCard = styled(Card)`
    height: 100%;
    .ant-card-body {
        padding: 12px 16px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
`;

interface KPICardProps {
    title: string;
    value: number | string;
    trend?: number;
    suffix?: string;
    color?: string;
    icon?: React.ReactNode;
    badgeLabel?: string;
    badgeColor?: string;
    description?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    trend,
    suffix,
    color,
    icon,
    badgeLabel,
    badgeColor,
    description,
}) => {
    const hasTrend = typeof trend === 'number' && !Number.isNaN(trend);
    const isPositive = hasTrend && trend! >= 0;
    const trendColor = isPositive ? '#52c41a' : '#ff4d4f';

    return (
        <CompactCard variant="borderless" style={{ borderLeft: `4px solid ${color || '#1890ff'}` }}>
            <Flex justify="space-between" align="start">
                <div>
                    <Text type="secondary" style={{ fontSize: '13px', textTransform: 'uppercase' }}>{title}</Text>
                    {description && (
                        <div>
                            <Text type="secondary" style={{ fontSize: '11px' }}>{description}</Text>
                        </div>
                    )}
                </div>
                <Flex align="center" gap={8}>
                    {badgeLabel && <Tag color={badgeColor || 'red'} style={{ margin: 0 }}>{badgeLabel}</Tag>}
                    {icon && <span style={{ fontSize: '16px', color: color }}>{icon}</span>}
                </Flex>
            </Flex>
            <Flex align="baseline" gap={8} style={{ marginTop: 4 }}>
                <Statistic
                    value={value}
                    styles={{ content: { fontSize: '24px', fontWeight: 600 } }}
                    suffix={suffix ? <span style={{ fontSize: '14px' }}>{suffix}</span> : undefined}
                />
                {hasTrend && (
                    <Text style={{ color: trendColor, fontSize: '12px' }}>
                        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {Math.abs(trend ?? 0).toFixed(1)}%
                    </Text>
                )}
            </Flex>
        </CompactCard>
    );
};
