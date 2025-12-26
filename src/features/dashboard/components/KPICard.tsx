import React, { useMemo } from 'react';
import { Card, Typography, Flex, Tag, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const { Text } = Typography;

const countUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const EnterpriseCard = styled(Card) <{ $accentColor?: string; $variant?: string }>`
    height: 100%;
    position: relative;
    overflow: hidden;
    border: none;
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: ${props => props.$accentColor || 'var(--gradient-primary)'};
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
    }

    .ant-card-body {
        padding: 16px 20px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
`;

const ValueContainer = styled.div`
    animation: ${countUp} 0.5s ease-out;
`;

const ValueText = styled.span<{ $size?: string }>`
    font-size: ${props => props.$size === 'large' ? '36px' : '28px'};
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    .dark-mode &,
    [data-theme='dark'] & {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        -webkit-background-clip: text;
        background-clip: text;
    }
`;

const TrendBadge = styled.div<{ $isPositive?: boolean; $isNeutral?: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: ${props =>
        props.$isNeutral
            ? 'rgba(148, 163, 184, 0.15)'
            : props.$isPositive
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)'
    };
    color: ${props =>
        props.$isNeutral
            ? 'var(--status-neutral)'
            : props.$isPositive
                ? 'var(--status-success)'
                : 'var(--status-error)'
    };
    border: 1px solid ${props =>
        props.$isNeutral
            ? 'rgba(148, 163, 184, 0.3)'
            : props.$isPositive
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
    };
`;

const SparklineContainer = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    opacity: 0.6;
    pointer-events: none;
`;

const TitleText = styled(Text)`
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--status-neutral);
`;

const SkeletonValue = styled.div`
    width: 80px;
    height: 32px;
    background: linear-gradient(90deg, 
        rgba(99, 102, 241, 0.1) 0%, 
        rgba(99, 102, 241, 0.2) 50%, 
        rgba(99, 102, 241, 0.1) 100%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
    border-radius: 8px;
`;

type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

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
    sparklineData?: number[];
    loading?: boolean;
    variant?: StatusVariant;
    threshold?: { warning: number; critical: number };
    onClick?: () => void;
}

const variantColors: Record<StatusVariant, string> = {
    default: 'var(--gradient-primary)',
    success: 'var(--gradient-success)',
    warning: 'var(--gradient-warning)',
    danger: 'var(--gradient-danger)',
    info: 'var(--gradient-info)',
};

const variantSolidColors: Record<StatusVariant, string> = {
    default: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
};

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    trend,
    suffix,
    icon,
    badgeLabel,
    badgeColor,
    description,
    sparklineData,
    loading,
    variant = 'default',
    threshold,
    onClick,
}) => {
    const hasTrend = typeof trend === 'number' && !Number.isNaN(trend);
    const isPositive = hasTrend && trend! > 0;
    const isNeutral = hasTrend && trend === 0;

    // Auto-detect variant based on threshold
    const computedVariant = useMemo(() => {
        if (threshold && typeof value === 'number') {
            if (value <= threshold.critical) return 'danger';
            if (value <= threshold.warning) return 'warning';
        }
        return variant;
    }, [threshold, value, variant]);

    const accentColor = variantColors[computedVariant];
    const solidColor = variantSolidColors[computedVariant];

    // Format sparkline data for Recharts
    const chartData = useMemo(() => {
        if (!sparklineData || sparklineData.length === 0) return null;
        return sparklineData.map((val, idx) => ({ value: val, index: idx }));
    }, [sparklineData]);

    if (loading) {
        return (
            <EnterpriseCard $accentColor={accentColor}>
                <Flex vertical gap={8}>
                    <TitleText>{title}</TitleText>
                    <SkeletonValue />
                </Flex>
            </EnterpriseCard>
        );
    }

    return (
        <EnterpriseCard
            $accentColor={accentColor}
            hoverable={!!onClick}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <Flex justify="space-between" align="start">
                <div>
                    <Flex align="center" gap={8}>
                        {icon && <span style={{ fontSize: '16px', color: solidColor }}>{icon}</span>}
                        <TitleText>{title}</TitleText>
                    </Flex>
                    {description && (
                        <Tooltip title={description}>
                            <Text type="secondary" style={{ fontSize: '11px', marginTop: 2, display: 'block' }}>
                                {description.length > 30 ? `${description.slice(0, 30)}...` : description}
                            </Text>
                        </Tooltip>
                    )}
                </div>
                {badgeLabel && (
                    <Tag color={badgeColor || 'red'} style={{ margin: 0, fontWeight: 500 }}>
                        {badgeLabel}
                    </Tag>
                )}
            </Flex>

            <Flex align="baseline" gap={12} style={{ marginTop: 8 }}>
                <ValueContainer>
                    <ValueText>{value}</ValueText>
                    {suffix && <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b', marginLeft: 4 }}>{suffix}</span>}
                </ValueContainer>

                {hasTrend && (
                    <TrendBadge $isPositive={isPositive} $isNeutral={isNeutral}>
                        {isNeutral ? <MinusOutlined /> : isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {Math.abs(trend ?? 0).toFixed(1)}%
                    </TrendBadge>
                )}
            </Flex>

            {chartData && (
                <SparklineContainer>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id={`sparkGradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={solidColor} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={solidColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={solidColor}
                                strokeWidth={2}
                                fill={`url(#sparkGradient-${title.replace(/\s/g, '')})`}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </SparklineContainer>
            )}
        </EnterpriseCard>
    );
};

