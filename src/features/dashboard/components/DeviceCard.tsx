import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Typography, Flex, Tooltip } from 'antd';
import {
    WifiOutlined,
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
const DeviceCardWrapper = styled.div<{ $isOnline?: boolean; $updateStatus?: string }>`
    border-radius: 14px;
    background: ${props => {
        const status = props.$updateStatus?.toLowerCase();
        if (status === 'pending') return 'linear-gradient(145deg, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0.98) 30%)';
        if (status === 'error') return 'linear-gradient(145deg, rgba(239, 68, 68, 0.05) 0%, rgba(255, 255, 255, 0.98) 30%)';
        if (status === 'in_sync') return 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.98) 30%)';
        return 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)';
    }};
    border: 1px solid ${props => {
        const status = props.$updateStatus?.toLowerCase();
        if (status === 'pending') return 'rgba(59, 130, 246, 0.15)';
        if (status === 'error') return 'rgba(239, 68, 68, 0.15)';
        if (status === 'in_sync') return 'rgba(16, 185, 129, 0.15)';
        return 'rgba(0, 0, 0, 0.04)';
    }};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    animation: ${fadeIn} 0.3s ease-out;
    overflow: hidden;
    position: relative;
    padding: 14px 16px;

    /* Status bar on left */
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${props => {
        const status = props.$updateStatus?.toLowerCase();
        if (status === 'pending') return 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)';
        if (status === 'error') return 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)';
        if (status === 'in_sync') return 'linear-gradient(180deg, #10b981 0%, #059669 100%)';
        return 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)';
    }};
        border-radius: 14px 0 0 14px;
    }

    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        border-color: ${props => {
        const status = props.$updateStatus?.toLowerCase();
        if (status === 'pending') return 'rgba(59, 130, 246, 0.3)';
        if (status === 'error') return 'rgba(239, 68, 68, 0.3)';
        if (status === 'in_sync') return 'rgba(16, 185, 129, 0.3)';
        return 'rgba(0, 0, 0, 0.08)';
    }};
    }

    .dark-mode & {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%);
        border-color: rgba(255, 255, 255, 0.08);
    }
`;

const OnlineIndicator = styled.div<{ $isOnline: boolean }>`
    width: 24px;
    height: 24px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    background: ${props => props.$isOnline
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'};
    color: white;
    box-shadow: 0 2px 6px ${props => props.$isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'};
    flex-shrink: 0;
`;

const StatusBadge = styled.div<{ $status?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
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
    font-size: 10px;
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
    if (s === 'in_sync') return t('status.inSync', '동기화됨');
    if (s === 'pending') return t('status.pending', '대기중');
    if (s === 'error') return t('status.error', '오류');
    if (s === 'registered') return t('status.registered', '등록됨');
    return t('status.unknown', '알수없음');
};

const getActionIcon = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'finished') return <CheckCircleFilled />;
    if (s === 'running' || s === 'retrieving') return <SyncOutlined spin />;
    if (s === 'error' || s === 'failed') return <CloseCircleFilled />;
    return <ClockCircleFilled />;
};

const DeviceCard: React.FC<DeviceCardProps> = ({ target, recentAction }) => {
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
            onClick={() => navigate(`/targets/${target.controllerId}`)}
        >
            <Flex vertical gap={10}>
                {/* Header Row: Icon + Name + Online Badge */}
                <Flex align="center" gap={10}>
                    <OnlineIndicator $isOnline={isOnline}>
                        <WifiOutlined />
                    </OnlineIndicator>
                    <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis style={{ fontSize: 13, lineHeight: 1.2 }}>
                            {target.name || target.controllerId}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            {target.ipAddress || target.address || '-'}
                        </Text>
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
                    <Text type="secondary" style={{ fontSize: 10 }}>
                        {isOnline ? '활성' : ''} {lastSeen}
                    </Text>
                )}
            </Flex>
        </DeviceCardWrapper>
    );
};

export default DeviceCard;
