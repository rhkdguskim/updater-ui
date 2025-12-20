import React from 'react';
import { Card, Statistic, Typography, Skeleton } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Text } = Typography;

interface KPICardProps {
    title: string;
    value: string | number;
    prefixIcon?: React.ReactNode;
    color?: string; // Main color for icon/value if needed
    loading?: boolean;
    trend?: number; // percent change, e.g., 5.2 or -1.2
    suffix?: string;
}

const StyledCard = styled(Card)`
    height: 100%;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .ant-card-body {
        padding: 20px 24px;
    }
`;

const IconWrapper = styled.div<{ $color?: string }>`
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background-color: ${props => props.$color ? `${props.$color}15` : 'rgba(0, 0, 0, 0.04)'};
    color: ${props => props.$color || 'inherit'};
    margin-bottom: 16px;
`;

const TrendBadge = styled.div<{ $trend: number }>`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 500;
    color: ${props => {
        if (props.$trend > 0) return '#52c41a';
        if (props.$trend < 0) return '#ff4d4f';
        return '#8c8c8c';
    }};
    background-color: ${props => {
        if (props.$trend > 0) return '#52c41a15';
        if (props.$trend < 0) return '#ff4d4f15';
        return '#f0f0f0';
    }};
    padding: 2px 8px;
    border-radius: 100px;
    margin-top: 8px;
    width: fit-content;
`;

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    prefixIcon,
    color,
    loading = false,
    trend,
    suffix
}) => {
    if (loading) {
        return (
            <StyledCard>
                <Skeleton active avatar paragraph={{ rows: 2 }} />
            </StyledCard>
        );
    }

    const renderTrend = () => {
        if (trend === undefined || trend === null) return null;

        const isPositive = trend > 0;
        const isNegative = trend < 0;
        const absValue = Math.abs(trend);

        return (
            <TrendBadge $trend={trend}>
                {isPositive && <ArrowUpOutlined />}
                {isNegative && <ArrowDownOutlined />}
                {!isPositive && !isNegative && <MinusOutlined />}
                {absValue}%
                <span style={{ fontSize: '12px', opacity: 0.8, fontWeight: 400, marginLeft: 2 }}>
                    vs yesterday
                </span>
            </TrendBadge>
        );
    };

    return (
        <StyledCard bordered={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
                        {title}
                    </Text>
                    <Statistic
                        value={value}
                        precision={typeof value === 'number' && !Number.isInteger(value) ? 1 : 0}
                        valueStyle={{
                            fontSize: '28px',
                            fontWeight: 700,
                            marginTop: '4px',
                            color: '#1f1f1f' // Default dark for value
                        }}
                        suffix={suffix && <span style={{ fontSize: '16px', fontWeight: 600, color: '#8c8c8c' }}>{suffix}</span>}
                    />
                    {renderTrend()}
                </div>
                {prefixIcon && (
                    <IconWrapper $color={color}>
                        {prefixIcon}
                    </IconWrapper>
                )}
            </div>
        </StyledCard>
    );
};
