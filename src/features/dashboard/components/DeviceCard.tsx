import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Card, Tag, Typography, Flex, Tooltip } from 'antd';
import {
    WifiOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
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

const DeviceCardWrapper = styled(Card) <{ $isOnline?: boolean; $delay?: number }>`
    border: none;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    transition: all 0.25s ease;
    cursor: pointer;
    animation: ${fadeIn} 0.3s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.05}s;
    animation-fill-mode: both;
    overflow: hidden;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${props => props.$isOnline ? '#10b981' : '#f59e0b'};
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .ant-card-body {
        padding: 12px 16px;
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
    }
`;

const StatusDot = styled.div<{ $color: string }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$color};
`;

interface DeviceCardProps {
    target: MgmtTarget;
    recentAction?: MgmtAction;
    delay?: number;
}

const getActionStatusColor = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'finished') return 'success';
    if (s === 'error' || s === 'failed') return 'error';
    if (s === 'running' || s === 'retrieving') return 'processing';
    if (s === 'pending' || s === 'scheduled') return 'default';
    return 'default';
};

const getActionStatusIcon = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'finished') return <CheckCircleOutlined />;
    if (s === 'error' || s === 'failed') return <CloseCircleOutlined />;
    if (s === 'running' || s === 'retrieving') return <SyncOutlined spin />;
    return <ClockCircleOutlined />;
};

const DeviceCard: React.FC<DeviceCardProps> = ({ target, recentAction, delay = 0 }) => {
    const { t } = useTranslation(['targets', 'common']);
    const navigate = useNavigate();

    const isOnline = target.pollStatus?.lastRequestAt !== undefined &&
        !target.pollStatus?.overdue &&
        !(target.pollStatus?.nextExpectedRequestAt && Date.now() > target.pollStatus.nextExpectedRequestAt);

    const updateStatusColor = (() => {
        switch (target.updateStatus) {
            case 'in_sync': return '#10b981';
            case 'pending': return '#3b82f6';
            case 'error': return '#ef4444';
            default: return '#94a3b8';
        }
    })();

    const updateStatusLabel = (() => {
        switch (target.updateStatus) {
            case 'in_sync': return t('status.inSync');
            case 'pending': return t('status.pending');
            case 'error': return t('status.error');
            default: return t('status.unknown', { ns: 'common' });
        }
    })();

    return (
        <DeviceCardWrapper
            $isOnline={isOnline}
            $delay={delay}
            onClick={() => navigate(`/targets/${target.controllerId}`)}
        >
            <Flex vertical gap={8}>
                {/* Header: Device Name & Status */}
                <Flex justify="space-between" align="center">
                    <Flex align="center" gap={8}>
                        <WifiOutlined style={{
                            fontSize: 16,
                            color: isOnline ? '#10b981' : '#f59e0b'
                        }} />
                        <Text strong style={{ fontSize: 14 }}>
                            {target.name || target.controllerId}
                        </Text>
                    </Flex>
                    <Tag color={isOnline ? 'success' : 'warning'} style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>
                        {isOnline ? t('status.online') : t('status.offline')}
                    </Tag>
                </Flex>

                {/* IP Address */}
                {target.ipAddress && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {target.ipAddress}
                    </Text>
                )}

                {/* Update Status */}
                <Flex align="center" gap={6}>
                    <StatusDot $color={updateStatusColor} />
                    <Text style={{ fontSize: 12 }}>{updateStatusLabel}</Text>
                </Flex>

                {/* Recent Action */}
                {recentAction && (
                    <Tooltip title={`Action #${recentAction.id} - ${recentAction.createdAt ? dayjs(recentAction.createdAt).format('YYYY-MM-DD HH:mm') : ''}`}>
                        <Flex align="center" gap={6} style={{ marginTop: 4 }}>
                            <Tag
                                color={getActionStatusColor(recentAction.status)}
                                icon={getActionStatusIcon(recentAction.status)}
                                style={{ margin: 0, borderRadius: 8, fontSize: 11 }}
                            >
                                {recentAction.status?.toUpperCase()}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {recentAction.createdAt ? dayjs(recentAction.createdAt).fromNow() : ''}
                            </Text>
                        </Flex>
                    </Tooltip>
                )}
            </Flex>
        </DeviceCardWrapper>
    );
};

export default DeviceCard;
