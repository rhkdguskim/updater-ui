import React, { useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Typography, Flex, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { CloudServerOutlined } from '@ant-design/icons';
import DeviceCard from './DeviceCard';
import { IconBadge, ChartCard } from './DashboardStyles';
import type { MgmtTarget, MgmtAction } from '@/api/generated/model';

const { Text } = Typography;

const scrollAnimation = keyframes`
    0% {
        transform: translateY(0);
    }
    100% {
        transform: translateY(-50%);
    }
`;

const SlideWrapper = styled.div<{ $duration: number; $shouldAnimate: boolean }>`
    width: 100%;
    ${props => props.$shouldAnimate && css`
        animation: ${scrollAnimation} ${props.$duration}s linear infinite;
    `}
`;

const Viewport = styled.div`
    flex: 1;
    min-height: 0;
    overflow: hidden;

    &:hover .slide-wrapper {
        animation-play-state: paused;
    }
`;

const GridRow = styled.div<{ $cols: number; $gap: number }>`
    display: grid;
    grid-template-columns: repeat(${props => props.$cols}, 1fr);
    gap: ${props => props.$gap}px;
`;

interface DeviceCardGridProps {
    targets: MgmtTarget[];
    actions: MgmtAction[];
    loading?: boolean;
    title?: string;
    delay?: number;
    cols?: number;
    rows?: number;
    gap?: number;
    rowHeight?: number;
    targetTypeColorMap?: Map<string, string>;
    scrollSpeed?: number; // pixels per second
}

const DeviceCardGrid: React.FC<DeviceCardGridProps> = ({
    targets,
    actions,
    loading = false,
    title,
    delay = 10,
    cols = 4,
    rows = 2,
    gap = 8,
    rowHeight = 90,
    targetTypeColorMap,
    scrollSpeed = 30,
}) => {
    const { t } = useTranslation('dashboard');

    // Build a map of controllerId to most recent action
    const actionMap = useMemo(() => {
        const map = new Map<string, MgmtAction>();
        actions.forEach(action => {
            let targetId = action._links?.target?.href?.split('/').pop();
            if (!targetId && action._links?.self?.href) {
                const match = action._links.self.href.match(/targets\/([^/]+)\/actions/);
                if (match) targetId = match[1];
            }
            if (targetId) {
                const existing = map.get(targetId);
                if (!existing || (action.createdAt && existing.createdAt && action.createdAt > existing.createdAt)) {
                    map.set(targetId, action);
                }
            }
        });
        return map;
    }, [actions]);

    // Sort targets by recent activity
    const sortedTargets = useMemo(() => {
        return [...targets].sort((a, b) => {
            const aTime = a.pollStatus?.lastRequestAt || 0;
            const bTime = b.pollStatus?.lastRequestAt || 0;
            return bTime - aTime;
        });
    }, [targets]);

    // Prepare grid items (rows of items)
    const gridRows = useMemo(() => {
        const rowsArr: MgmtTarget[][] = [];
        for (let i = 0; i < sortedTargets.length; i += cols) {
            rowsArr.push(sortedTargets.slice(i, i + cols));
        }
        return rowsArr;
    }, [sortedTargets, cols]);

    const shouldAnimate = gridRows.length > rows;

    // Seamless looping rows
    const displayRows = useMemo(() => {
        if (!shouldAnimate) return gridRows;
        return [...gridRows, ...gridRows];
    }, [gridRows, shouldAnimate]);

    // Calculate animation duration based on scroll speed
    // Total distance to scroll = gridRows.length * (rowHeight + gap)
    const totalScrollDistance = gridRows.length * (rowHeight + gap);
    const animationDuration = totalScrollDistance / scrollSpeed;

    const viewPortHeight = (rowHeight * rows) + (gap * (rows - 1));
    const resolvedTitle = title || t('deviceGrid.title');

    return (
        <ChartCard
            $theme="connectivity"
            title={
                <Flex align="center" gap={10}>
                    <IconBadge $theme="connectivity">
                        <CloudServerOutlined />
                    </IconBadge>
                    <Flex vertical gap={0}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{resolvedTitle}</span>
                        <Text type="secondary" style={{ fontSize: 11 }}>{targets.length} devices</Text>
                    </Flex>
                </Flex>
            }
            $delay={delay}
        >
            {loading ? (
                <Flex wrap gap={gap} style={{ height: viewPortHeight }}>
                    {[...Array(cols * rows)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                flex: `1 1 calc(${100 / cols}% - ${gap}px)`,
                                height: rowHeight,
                                background: 'rgba(0,0,0,0.04)',
                                borderRadius: 12,
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }}
                        />
                    ))}
                </Flex>
            ) : sortedTargets.length > 0 ? (
                <Viewport>
                    <SlideWrapper
                        className="slide-wrapper"
                        $duration={animationDuration}
                        $shouldAnimate={shouldAnimate}
                    >
                        <Flex vertical gap={gap}>
                            {displayRows.map((rowItems, rowIndex) => (
                                <GridRow key={`row-${rowIndex}`} $cols={cols} $gap={gap} style={{ height: rowHeight }}>
                                    {rowItems.map((target, colIndex) => (
                                        <DeviceCard
                                            key={`${target.controllerId}-${rowIndex}-${colIndex}`}
                                            target={target}
                                            recentAction={actionMap.get(target.controllerId || '')}
                                            targetTypeColor={target.targetTypeName ? targetTypeColorMap?.get(target.targetTypeName) : undefined}
                                        />
                                    ))}
                                    {/* Fill empty cells */}
                                    {rowItems.length < cols && [...Array(cols - rowItems.length)].map((_, i) => (
                                        <div key={`empty-${rowIndex}-${i}`} />
                                    ))}
                                </GridRow>
                            ))}
                        </Flex>
                    </SlideWrapper>
                </Viewport>
            ) : (
                <Flex justify="center" align="center" style={{ height: viewPortHeight }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">{t('deviceGrid.empty', 'No devices')}</Text>}
                    />
                </Flex>
            )}
        </ChartCard>
    );
};

export default DeviceCardGrid;
