import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Typography, Flex, Tooltip, Tag } from 'antd';
import {
    ApiOutlined,
    CheckCircleFilled,
    SyncOutlined,
    CloseCircleFilled,
    ClockCircleFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MgmtTarget, MgmtAction } from '@/api/generated/model';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const fadeIn = keyframes`
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
`;

// Compact premium device card
const DeviceCardWrapper = styled.div<{ $isOnline?: boolean; $updateStatus?: string; $targetTypeColor?: string }>`
    border-radius: 14px;
    background: ${props => {
        const status = props.$updateStatus?.toLowerCase();
        if (status === 'pending') return 'linear-gradient(145deg, rgba(var(--ant-color-info-rgb), 0.05) 0%, var(--ant-color-bg-container) 30%)';
        if (status === 'error') return 'linear-gradient(145deg, rgba(var(--ant-color-error-rgb), 0.05) 0%, var(--ant-color-bg-container) 30%)';
        if (status === 'in_sync') return 'linear-gradient(145deg, rgba(var(--ant-color-success-rgb), 0.05) 0%, var(--ant-color-bg-container) 30%)';
        return 'var(--ant-color-bg-container)';
    }};
    border: 1px solid ${props => {
        const status = props.$updateStatus?.toLowerCase();
        if (status === 'pending') return 'var(--ant-color-info-border)';
        if (status === 'error') return 'var(--ant-color-error-border)';
        if (status === 'in_sync') return 'var(--ant-color-success-border)';
        return 'var(--ant-color-border-secondary)';
    }};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    animation: ${fadeIn} 0.3s ease-out;
    overflow: hidden;
    position: relative;
    padding: 10px 12px;

    /* Status bar on left */
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 3px;
        height: 100%;
        background: ${props => {
        if (props.$targetTypeColor) {
            return props.$targetTypeColor;
        }
        const status = props.$updateStatus?.toLowerCase();
        if (status === 'pending') return 'var(--ant-color-info)';
        if (status === 'error') return 'var(--ant-color-error)';
        if (status === 'in_sync') return 'var(--ant-color-success)';
        return 'var(--ant-color-text-quaternary)';
    }};
        border-radius: 14px 0 0 14px;
    }

    [data-theme='dark'] &,
    .dark-mode & {
        background: ${props => {
        const status = props.$updateStatus?.toLowerCase();
        if (status === 'pending') return 'linear-gradient(145deg, rgba(var(--ant-color-info-rgb), 0.1) 0%, var(--ant-color-bg-container) 30%)';
        if (status === 'error') return 'linear-gradient(145deg, rgba(var(--ant-color-error-rgb), 0.1) 0%, var(--ant-color-bg-container) 30%)';
        if (status === 'in_sync') return 'linear-gradient(145deg, rgba(var(--ant-color-success-rgb), 0.1) 0%, var(--ant-color-bg-container) 30%)';
        return 'var(--ant-color-bg-container)';
    }};
        border: 1px solid var(--ant-color-border-secondary);
        
        &:hover {
            border-color: var(--ant-color-primary);
        }
    }
`;

const OnlineIndicator = styled.div<{ $isOnline: boolean; $typeColor?: string }>`
    width: 24px;
    height: 24px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ant-font-size-sm);
    background: ${props => {
        if (props.$typeColor) {
            return `linear-gradient(135deg, ${props.$typeColor} 0%, ${props.$typeColor}cc 100%)`;
        }
        return props.$isOnline
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    }};
    color: white;
    box-shadow: 0 2px 6px ${props => {
        if (props.$typeColor) return `${props.$typeColor}40`;
        return props.$isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)';
    }};
    flex-shrink: 0;
`;

const StatusBadge = styled.div<{ $status?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: var(--ant-font-size-sm);
    font-weight: 500;
    
    ${props => {
        const status = props.$status?.toLowerCase();
        if (status === 'in_sync') return css`
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
        `;
        if (status === 'pending') return css`
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
        `;
        if (status === 'error') return css`
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
        `;
        return css`
            background: rgba(148, 163, 184, 0.15);
            color: #64748b;
        `;
    }}
`;

const ActionBadge = styled.div<{ $status?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    
    ${props => {
        const s = props.$status?.toLowerCase();
        if (s === 'finished') return css`
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
        `;
        if (s === 'running' || s === 'retrieving') return css`
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
        `;
        if (s === 'error' || s === 'failed') return css`
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
        `;
        return css`
            background: rgba(148, 163, 184, 0.1);
            color: #64748b;
        `;
    }}
`;

interface DeviceCardProps {
    target: MgmtTarget;
    recentAction?: MgmtAction;
    delay?: number;
    targetTypeColor?: string;
}

const getStatusIcon = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'in_sync') return <CheckCircleFilled style={{ fontSize: 10 }} />;
    if (s === 'pending') return <SyncOutlined spin style={{ fontSize: 10 }} />;
    if (s === 'error') return <CloseCircleFilled style={{ fontSize: 10 }} />;
    return <ClockCircleFilled style={{ fontSize: 10 }} />;
};

const getStatusLabel = (status?: string, t?: any) => {
    const s = status?.toLowerCase();
    if (s === 'in_sync') return t('status.inSync');
    if (s === 'pending') return t('status.pending');
    if (s === 'error') return t('status.error');
    if (s === 'registered') return t('status.registered');
    return t('status.unknown');
};

const getActionIcon = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'finished') return <CheckCircleFilled />;
    if (s === 'running' || s === 'retrieving') return <SyncOutlined spin />;
    if (s === 'error' || s === 'failed') return <CloseCircleFilled />;
    return <ClockCircleFilled />;
};

const DeviceCard: React.FC<DeviceCardProps> = ({ target, recentAction, targetTypeColor }) => {
    const { t } = useTranslation(['targets', 'common']);
    const navigate = useNavigate();

    const isOnline = target.pollStatus?.lastRequestAt !== undefined &&
        !target.pollStatus?.overdue &&
        !(target.pollStatus?.nextExpectedRequestAt && Date.now() > target.pollStatus.nextExpectedRequestAt);

    const lastSeen = target.pollStatus?.lastRequestAt
        ? dayjs(target.pollStatus.lastRequestAt).fromNow()
        : '';

    return (
        <DeviceCardWrapper
            $isOnline={isOnline}
            $updateStatus={target.updateStatus}
            $targetTypeColor={targetTypeColor}
            onClick={() => navigate(`/targets/${target.controllerId}`)}
        >
            <Flex vertical gap={10}>
                {/* Header Row: Icon + Name + Online Badge */}
                <Flex align="center" gap={10}>
                    <OnlineIndicator $isOnline={isOnline} $typeColor={targetTypeColor}>
                        <ApiOutlined />
                    </OnlineIndicator>
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis style={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                            {target.name || target.controllerId}
                        </Text>
                        <Flex align="center" gap={4} wrap="wrap">
                            {target.targetTypeName && (
                                <Tag
                                    color={targetTypeColor}
                                    style={{
                                        margin: 0,
                                        fontSize: 10,
                                        padding: '0 4px',
                                        lineHeight: '16px',
                                        borderRadius: 4
                                    }}
                                >
                                    {target.targetTypeName}
                                </Tag>
                            )}
                            <Text type="secondary" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                {target.ipAddress || target.address || ''}
                            </Text>
                        </Flex>
                    </Flex>
                </Flex>

                {/* Status Row */}
                <Flex align="center" justify="space-between" gap={8}>
                    <StatusBadge $status={target.updateStatus}>
                        {getStatusIcon(target.updateStatus)}
                        {getStatusLabel(target.updateStatus, t)}
                    </StatusBadge>

                    {recentAction && (
                        <Tooltip title={`Action #${recentAction.id}`}>
                            <ActionBadge $status={recentAction.status}>
                                {getActionIcon(recentAction.status)}
                                {recentAction.status?.toUpperCase()}
                            </ActionBadge>
                        </Tooltip>
                    )}
                </Flex>

                {/* Footer: Last Seen */}
                {lastSeen && (
                    <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                        {isOnline ? t('common:status.active') : ''} {lastSeen}
                    </Text>
                )}
            </Flex>
        </DeviceCardWrapper>
    );
};

export default DeviceCard;
