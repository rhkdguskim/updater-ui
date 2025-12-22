import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { Card, Typography, Flex, Skeleton, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import DeviceCard from './DeviceCard';
import type { MgmtTarget, MgmtAction } from '@/api/generated/model';

const { Text } = Typography;

const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const GridContainer = styled(Card) <{ $delay?: number }>`
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    overflow: hidden;

    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }

    .ant-card-head-title {
        font-size: 15px;
        font-weight: 600;
        color: #334155;
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);

        .ant-card-head {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .ant-card-head-title {
            color: #e2e8f0;
        }
    }
`;

const SlideWrapper = styled.div<{ $offsetLine: number; $rowHeight: number; $gap: number; $isAnimating: boolean }>`
    transform: translateY(-${props => props.$offsetLine * (props.$rowHeight + props.$gap)}px);
    transition: ${props => props.$isAnimating ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'};
`;

const Viewport = styled.div<{ $height: number }>`
    height: ${props => props.$height}px;
    overflow: hidden;
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
}

const DeviceCardGrid: React.FC<DeviceCardGridProps> = ({
    targets,
    actions,
    loading = false,
    title,
    delay = 0,
    cols = 4,
    rows = 2,
    gap = 12,
    rowHeight = 120, // Approximate height of DeviceCard
}) => {
    const { t } = useTranslation('dashboard');
    const [offsetLine, setOffsetLine] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Build a map of controllerId to most recent action
    const actionMap = useMemo(() => {
        const map = new Map<string, MgmtAction>();
        actions.forEach(action => {
            let targetId = action._links?.target?.href?.split('/').pop();
            // Fallback for when link structure differs
            if (!targetId && action._links?.self?.href) {
                const match = action._links.self.href.match(/targets\/([^/]+)\/actions/);
                if (match) targetId = match[1];
            }
            if (targetId) {
                const existing = map.get(targetId);
                // Keep the latest action
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

    // Virtual items for seamless looping (duplicate visible rows)
    const displayRows = useMemo(() => {
        if (gridRows.length <= rows) return gridRows;
        return [...gridRows, ...gridRows.slice(0, rows)];
    }, [gridRows, rows]);

    // Animation Logic
    useEffect(() => {
        if (gridRows.length <= rows) return;

        const interval = setInterval(() => {
            setIsAnimating(true);
            setOffsetLine(prev => prev + 1);
        }, 3000); // Slide every 3 seconds

        return () => clearInterval(interval);
    }, [gridRows.length, rows]);

    useEffect(() => {
        if (offsetLine >= gridRows.length) {
            const resetTimer = setTimeout(() => {
                setIsAnimating(false);
                setOffsetLine(0);
            }, 600); // Wait for transition to finish
            return () => clearTimeout(resetTimer);
        }
    }, [offsetLine, gridRows.length]);

    // Responsive column adjustment could be improved with ResizeObserver, 
    // but using CSS Grid media queries for now via simple props or styled-components

    // Calculate viewport height based on rows and gap
    const viewPortHeight = (rowHeight * rows) + (gap * (rows - 1));

    const resolvedTitle = title || t('deviceGrid.title', 'Device Status Grid');

    return (
        <GridContainer title={resolvedTitle} $delay={delay}>
            {loading ? (
                <Flex wrap gap={gap}>
                    {[...Array(cols * rows)].map((_, i) => (
                        <Skeleton.Button key={i} active style={{ width: '100%', height: rowHeight, flex: `1 1 calc(${100 / cols}% - ${gap}px)` }} />
                    ))}
                </Flex>
            ) : sortedTargets.length > 0 ? (
                <Viewport $height={viewPortHeight}>
                    <SlideWrapper
                        $offsetLine={offsetLine}
                        $rowHeight={rowHeight}
                        $gap={gap}
                        $isAnimating={isAnimating}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: gap }}>
                            {displayRows.map((rowItems, rowIndex) => (
                                <div key={`row-${rowIndex}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: gap }}>
                                    {rowItems.map((target, colIndex) => (
                                        <DeviceCard
                                            key={`${target.controllerId}-${rowIndex}-${colIndex}`}
                                            target={target}
                                            recentAction={actionMap.get(target.controllerId || '')}
                                        />
                                    ))}
                                    {/* Fill empty cells if last row is incomplete */}
                                    {rowItems.length < cols && [...Array(cols - rowItems.length)].map((_, i) => (
                                        <div key={`empty-${rowIndex}-${i}`} />
                                    ))}
                                </div>
                            ))}
                        </div>
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
        </GridContainer>
    );
};

export default DeviceCardGrid;
