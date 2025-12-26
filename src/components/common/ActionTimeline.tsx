import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    CheckCircleFilled,
    CloseCircleFilled,
    SyncOutlined,
    RocketOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import type { MgmtAction } from '@/api/generated/model';

// Animations
const pulse = keyframes`
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
`;

const glow = keyframes`
    0%, 100% { box-shadow: 0 0 4px rgba(59, 130, 246, 0.4); }
    50% { box-shadow: 0 0 12px rgba(59, 130, 246, 0.8); }
`;

const progressFlow = keyframes`
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
`;

// Styled Components
const TimelineContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0;
    padding: 4px 8px;
    background: rgba(0,0,0,0.02);
    border-radius: 20px;
`;

const TimelineStep = styled.div<{
    $status: 'pending' | 'active' | 'completed' | 'error';
}>`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
`;

const StepNode = styled.div<{
    $status: 'pending' | 'active' | 'completed' | 'error';
    $size?: 'small' | 'medium';
}>`
    width: ${props => props.$size === 'small' ? '24px' : '28px'};
    height: ${props => props.$size === 'small' ? '24px' : '28px'};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${props => props.$size === 'small' ? '11px' : '13px'};
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
    
    ${props => {
        switch (props.$status) {
            case 'completed':
                return css`
                    background: var(--ant-color-success);
                    color: white;
                    box-shadow: 0 2px 8px rgba(var(--ant-color-success-rgb), 0.4);
                `;
            case 'active':
                return css`
                    background: var(--ant-color-info);
                    color: white;
                    box-shadow: 0 2px 8px rgba(var(--ant-color-info-rgb), 0.4);
                    animation: ${pulse} 1.5s ease-in-out infinite, ${glow} 2s ease-in-out infinite;
                `;
            case 'error':
                return css`
                    background: var(--ant-color-error);
                    color: white;
                    box-shadow: 0 2px 8px rgba(var(--ant-color-error-rgb), 0.4);
                `;
            default:
                return css`
                    background: var(--ant-color-fill-secondary);
                    color: var(--ant-color-text-quaternary);
                    box-shadow: none;
                `;
        }
    }}
`;

const StepConnector = styled.div<{ $active?: boolean; $isAnimated?: boolean }>`
    width: 28px;
    height: 3px;
    border-radius: 2px;
    margin: 0 2px;
    position: relative;
    overflow: hidden;
    
    background: ${props => props.$active
        ? 'linear-gradient(90deg, var(--ant-color-success) 0%, var(--ant-color-info) 50%, var(--ant-color-success) 100%)'
        : 'var(--ant-color-fill-secondary)'};
    
    ${props => props.$isAnimated && css`
        background-size: 200% 100%;
        animation: ${progressFlow} 1.5s linear infinite;
    `}
`;

interface ActionTimelineProps {
    action: MgmtAction;
}

export const ActionTimeline: React.FC<ActionTimelineProps> = ({ action }) => {
    const { t } = useTranslation('dashboard');
    const status = action.status?.toLowerCase() || '';

    // Extract messages (often not in type definition but present in API response)
    const messages = (action as any).messages as string[] | undefined;
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : undefined;
    const detail = lastMessage || action.detailStatus || '';

    // Determine state based on status and detailStatus
    // If detailStatus has content like "다운로드 중", "업데이트 중", etc., treat as running
    type State = 'pending' | 'scheduled' | 'running' | 'finished' | 'error';
    let state: State = 'pending';

    // First check for error/finished states
    if (['error', 'failed', 'canceled'].includes(status)) {
        state = 'error';
    } else if (['finished'].includes(status)) {
        state = 'finished';
    } else if (['running', 'retrieving', 'retrieved', 'downloading', 'download'].includes(status)) {
        // Explicitly running states
        state = 'running';
    } else if (detail && detail.length > 0 && !['scheduled', 'wait_for_confirmation'].includes(status)) {
        // If there's a detailStatus message, it means activity is happening -> running
        // This handles cases where status is 'pending' but detailStatus shows real progress
        state = 'running';
    } else if (['scheduled', 'pending', 'wait_for_confirmation'].includes(status)) {
        // Waiting states without activity
        state = 'scheduled';
    }

    const getStepStatus = (step: number): 'pending' | 'active' | 'completed' | 'error' => {
        const stateOrder: Record<State, number> = {
            pending: 0,
            scheduled: 1,
            running: 2,
            finished: 3,
            error: 3
        };
        const currentStep = stateOrder[state];

        if (state === 'error' && step === 3) return 'error';
        if (step < currentStep) return 'completed';
        if (step === currentStep) return 'active';
        return 'pending';
    };

    const getTooltip = (step: number) => {
        switch (step) {
            case 1: return t('timeline.queued');
            case 2: {
                // Show the actual detailStatus message from the server directly
                // This contains messages like "Disabling service recovery", "업데이트 프로세스 시작", etc.
                if (state === 'running' && detail) {
                    return detail;
                }
                return t('timeline.processing');
            }
            case 3: return state === 'error' ? t('timeline.failed') : t('timeline.completed');
            default: return '';
        }
    };

    return (
        <TimelineContainer>
            {/* Step 1: Queued */}
            <Tooltip title={getTooltip(1)}>
                <TimelineStep $status={getStepStatus(1)}>
                    <StepNode $status={getStepStatus(1)} $size="small">
                        <RocketOutlined />
                    </StepNode>
                </TimelineStep>
            </Tooltip>

            <StepConnector
                $active={getStepStatus(1) === 'completed' || getStepStatus(2) !== 'pending'}
            />

            {/* Step 2: Processing */}
            <Tooltip title={getTooltip(2)}>
                <TimelineStep $status={getStepStatus(2)}>
                    <StepNode $status={getStepStatus(2)} $size="medium">
                        {getStepStatus(2) === 'active' ? (
                            <SyncOutlined spin />
                        ) : (
                            <ThunderboltOutlined />
                        )}
                    </StepNode>
                </TimelineStep>
            </Tooltip>

            <StepConnector
                $active={getStepStatus(2) === 'completed' || getStepStatus(3) !== 'pending'}
                $isAnimated={getStepStatus(2) === 'active'}
            />

            {/* Step 3: Completed/Error */}
            <Tooltip title={getTooltip(3)}>
                <TimelineStep $status={getStepStatus(3)}>
                    <StepNode $status={getStepStatus(3)} $size="small">
                        {getStepStatus(3) === 'error' ? (
                            <CloseCircleFilled />
                        ) : (
                            <CheckCircleFilled />
                        )}
                    </StepNode>
                </TimelineStep>
            </Tooltip>
        </TimelineContainer>
    );
};

export default ActionTimeline;
