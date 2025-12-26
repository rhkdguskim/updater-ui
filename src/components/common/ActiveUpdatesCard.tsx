import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Typography, Flex, Empty, Skeleton, Timeline, Progress, Tag, Popover } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    SyncOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DownOutlined,
    UpOutlined,
} from '@ant-design/icons';
import { useGetAction1 } from '@/api/generated/actions/actions';
import { useGetActionStatus } from '@/hooks/useActionStatus';
import type { MgmtAction } from '@/api/generated/model';
import { ActionTimeline } from './ActionTimeline';

dayjs.extend(relativeTime);

const { Text } = Typography;

// Animations
const fadeInSlide = keyframes`
    from {
        opacity: 0;
        transform: translateX(-8px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
`;

const fadeOutSlide = keyframes`
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(20px);
        height: 0;
        padding: 0;
        margin: 0;
    }
`;

const pulse = keyframes`
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
`;

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
`;

const ListContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.02);
    }
    &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
    }
`;

const UpdateRow = styled.div<{ $isCompleting?: boolean; $isExpanded?: boolean }>`
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
    animation: ${props => props.$isCompleting
        ? css`${fadeOutSlide} 0.5s ease-out forwards`
        : css`${fadeInSlide} 0.3s ease-out`};
    cursor: pointer;

    ${props => props.$isExpanded && `
        background: rgba(59, 130, 246, 0.04);
    `}

    &:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(255, 255, 255, 0) 100%);
    }
`;

const MainContent = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

const IconBadge = styled.div<{ $status?: string }>`
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: ${props => {
        switch (props.$status) {
            case 'finished':
                return 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)';
            case 'error':
            case 'canceled':
                return 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)';
            default:
                return 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)';
        }
    }};
    color: ${props => {
        switch (props.$status) {
            case 'finished':
                return '#10b981';
            case 'error':
            case 'canceled':
                return '#ef4444';
            default:
                return '#3b82f6';
        }
    }};
    font-size: 16px;

    ${props => ['running', 'pending', 'scheduled', 'retrieving', 'downloading'].includes(props.$status || '') && css`
        animation: ${pulse} 2s ease-in-out infinite;
    `}
`;

const ExpandButton = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    font-size: 11px;
    color: #6b7280;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.04);
        color: #3b82f6;
    }
`;

const HistoryPanel = styled.div`
    margin-top: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
`;

const ProgressBar = styled.div`
    margin-top: 8px;
    padding: 0 4px;
`;

// Types
interface ActiveUpdateItem {
    action: MgmtAction;
    targetName?: string;
    controllerId?: string;
}

interface ActiveUpdatesCardProps {
    items: ActiveUpdateItem[];
    isLoading?: boolean;
    onNavigate?: (actionId: number) => void;
    showHistory?: boolean;
    emptyText?: string;
}

// Individual Row Component with real-time updates
const ActiveUpdateRowComponent: React.FC<{
    item: ActiveUpdateItem;
    onNavigate?: (actionId: number) => void;
    showHistory?: boolean;
    onComplete?: (actionId: number) => void;
}> = ({ item, onNavigate, showHistory = true, onComplete }) => {
    const { t } = useTranslation(['dashboard', 'actions', 'common']);
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const prevStatusRef = useRef<string | undefined>(item.action.status);

    // Real-time action data polling for active actions
    const isActive = ['running', 'pending', 'scheduled', 'retrieving', 'retrieved', 'downloading'].includes(
        item.action.status?.toLowerCase() || ''
    );

    const { data: fetchedAction } = useGetAction1(
        item.action.id!,
        {
            query: {
                enabled: !!item.action.id && isActive,
                refetchInterval: 2000,
                staleTime: 0
            }
        }
    );

    // Fetch granular status history on hover
    const { data: statusData } = useGetActionStatus(
        item.action.id!,
        {
            query: {
                enabled: !!item.action.id && isHovered,
                staleTime: 5000 // Cache for 5s
            }
        }
    );

    const displayAction = fetchedAction || item.action;
    const status = displayAction.status?.toLowerCase() || '';

    // Prioritize messages fetched from status endpoint, fallback to action messages if any
    const messages = (statusData?.messages || (displayAction as any).messages) as string[] | undefined;
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : undefined;
    const displayStatus = lastMessage || displayAction.detailStatus || status;

    // Handle completion animation
    useEffect(() => {
        const prevStatus = prevStatusRef.current?.toLowerCase();
        const currentStatus = displayAction.status?.toLowerCase();

        // If status changed from active to finished
        if (
            prevStatus &&
            ['running', 'pending', 'scheduled', 'retrieving', 'downloading'].includes(prevStatus) &&
            ['finished', 'error', 'canceled'].includes(currentStatus || '')
        ) {
            // Wait 1 second, then fade out
            const timer = setTimeout(() => {
                setIsCompleting(true);
                // After fade animation, notify parent
                setTimeout(() => {
                    onComplete?.(item.action.id!);
                }, 500);
            }, 1000);
            return () => clearTimeout(timer);
        }

        prevStatusRef.current = displayAction.status;
    }, [displayAction.status, item.action.id, onComplete]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onNavigate && item.action.id) {
            onNavigate(item.action.id);
        } else if (item.action.id) {
            navigate(`/actions/${item.action.id}`);
        }
    };

    const handleExpandClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'finished':
                return <CheckCircleOutlined />;
            case 'error':
            case 'canceled':
                return <CloseCircleOutlined />;
            case 'running':
            case 'downloading':
            case 'retrieving':
                return <SyncOutlined spin />;
            default:
                return <ThunderboltOutlined />;
        }
    };

    // Calculate progress if available
    const progress = (displayAction as any).progress as number | undefined;

    // Popover content for hover - show detailed status history
    const popoverContent = messages && messages.length > 0 ? (
        <div style={{ maxWidth: 320, maxHeight: 300, overflow: 'auto' }}>
            <Flex vertical gap={4}>
                <Text strong style={{ fontSize: 12, marginBottom: 4 }}>
                    {t('activeUpdates.statusHistory', 'Status History')}
                </Text>
                {messages.slice().reverse().slice(0, 8).map((msg: string, idx: number) => (
                    <Flex key={idx} gap={8} align="flex-start" style={{ padding: '4px 0', borderBottom: idx < 7 && idx < messages.length - 1 ? '1px solid var(--ant-color-border-secondary, rgba(0,0,0,0.06))' : 'none' }}>
                        <Tag color={idx === 0 ? 'blue' : 'default'} style={{ fontSize: 10, margin: 0, flexShrink: 0 }}>
                            {idx === 0 ? t('common:status.current', 'Current') : `#${messages.length - idx}`}
                        </Tag>
                        <Text style={{ fontSize: 11, wordBreak: 'break-word' }} type={idx === 0 ? undefined : 'secondary'}>
                            {msg}
                        </Text>
                    </Flex>
                ))}
                {messages.length > 8 && (
                    <Text type="secondary" style={{ fontSize: 10, textAlign: 'center', marginTop: 4 }}>
                        +{messages.length - 8} {t('common:more', 'more')}...
                    </Text>
                )}
            </Flex>
        </div>
    ) : (
        // Loading state or empty state if no messages
        <div style={{ padding: 8, textAlign: 'center' }}>
            {isHovered && !messages ? <SyncOutlined spin /> : <Text type="secondary">{t('common:messages.noData')}</Text>}
        </div>
    );

    // Show popover for running actions
    // We want to show it even if fetching, to show the loading spinner logic above if needed,
    // but the original logic restricted it. Let's be broader to allow fetching feedback.
    const showPopover = ['running', 'pending', 'scheduled', 'retrieving', 'retrieved', 'downloading'].includes(status);

    const rowContent = (
        <UpdateRow $isCompleting={isCompleting} $isExpanded={isExpanded}>
            <MainContent onClick={handleClick}>
                <Flex align="center" gap={12} style={{ flex: 1, minWidth: 0 }}>
                    <div
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <IconBadge $status={status}>
                            {getStatusIcon()}
                        </IconBadge>
                    </div>
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Flex justify="space-between" align="center">
                            <Text strong style={{ fontSize: 13 }}>
                                {item.targetName || item.controllerId || `Action #${item.action.id}`}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {item.action.createdAt ? dayjs(item.action.createdAt).fromNow(true) : ''}
                            </Text>
                        </Flex>
                        <Flex align="center" gap={6}>
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: 11,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 200
                                }}
                            >
                                {displayStatus}
                            </Text>
                        </Flex>
                    </Flex>
                </Flex>

                <Flex align="center" gap={8}>
                    <ActionTimeline action={displayAction} />
                    {showHistory && messages && messages.length > 1 && (
                        <ExpandButton onClick={handleExpandClick}>
                            {isExpanded ? <UpOutlined /> : <DownOutlined />}
                        </ExpandButton>
                    )}
                </Flex>
            </MainContent>

            {/* Progress bar if available */}
            {progress !== undefined && progress > 0 && progress < 100 && (
                <ProgressBar>
                    <Progress percent={progress} size="small" strokeColor="#3b82f6" />
                </ProgressBar>
            )}

            {/* Expandable Status History - uses messages from action */}
            {isExpanded && showHistory && messages && messages.length > 0 && (
                <HistoryPanel onClick={(e) => e.stopPropagation()}>
                    <Timeline
                        items={messages.slice().reverse().slice(0, 10).map((msg: string, idx: number) => ({
                            color: idx === 0 ? 'blue' : 'gray',
                            children: (
                                <Flex vertical gap={2}>
                                    <Flex align="center" gap={8}>
                                        <Tag style={{ fontSize: 10, margin: 0 }}>
                                            {idx === 0 ? t('common:status.current', 'Current') : `Step ${messages.length - idx}`}
                                        </Tag>
                                    </Flex>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {msg}
                                    </Text>
                                </Flex>
                            ),
                        }))}
                    />
                </HistoryPanel>
            )}
        </UpdateRow>
    );

    // Wrap with Popover for hover effect on active actions
    if (showPopover) {
        return (
            <Popover
                content={popoverContent}
                title={null}
                placement="right" // Changed to right for better visibility usually, or auto
                trigger="hover"
                mouseEnterDelay={0.2} // Slightly faster to feel responsive
                overlayStyle={{ maxWidth: 350 }}
            >
                {rowContent}
            </Popover>
        );
    }

    return rowContent;
};

// Main Component
export const ActiveUpdatesCard: React.FC<ActiveUpdatesCardProps> = ({
    items,
    isLoading = false,
    onNavigate,
    showHistory = true,
    emptyText,
}) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const [visibleItems, setVisibleItems] = useState<ActiveUpdateItem[]>(items);

    // Update visible items when props change
    useEffect(() => {
        setVisibleItems(items);
    }, [items]);

    // Handle item completion (remove from list after animation)
    const handleComplete = useCallback((actionId: number) => {
        setVisibleItems(prev => prev.filter(item => item.action.id !== actionId));
    }, []);

    if (isLoading) {
        return (
            <Container>
                <Skeleton active paragraph={{ rows: 4 }} />
            </Container>
        );
    }

    if (visibleItems.length === 0) {
        return (
            <Container>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Text type="secondary">
                                {emptyText || t('activeUpdates.empty', 'No active updates')}
                            </Text>
                        }
                    />
                </Flex>
            </Container>
        );
    }

    return (
        <Container>
            <ListContainer>
                {visibleItems.map((item) => (
                    <ActiveUpdateRowComponent
                        key={item.action.id}
                        item={item}
                        onNavigate={onNavigate}
                        showHistory={showHistory}
                        onComplete={handleComplete}
                    />
                ))}
            </ListContainer>
        </Container>
    );
};

export default ActiveUpdatesCard;
