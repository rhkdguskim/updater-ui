import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Tag } from 'antd';

const scroll = keyframes`
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
`;

const TickerContainer = styled.div<{ $isCompact?: boolean }>`
    background: #001529;
    color: #fff;
    height: ${(props) => (props.$isCompact ? '32px' : '40px')};
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    position: relative;
    padding: 0 16px;
`;

const TickerTitle = styled.div`
    font-weight: bold;
    margin-right: 16px;
    color: #40a9ff;
`;

const TickerContent = styled.div<{ $isPaused: boolean }>`
    display: inline-block;
    animation: ${(props) => (props.$isPaused ? 'none' : css`${scroll} 30s linear infinite`)};
    animation-play-state: ${(props) => (props.$isPaused ? 'paused' : 'running')};
    min-width: 100%;
`;

const LogItem = styled.span<{ $clickable: boolean }>`
    margin-right: 40px;
    font-family: 'Monaco', monospace;
    font-size: 13px;
    ${(props) =>
        props.$clickable
            ? css`
                  cursor: pointer;
                  &:hover {
                      text-decoration: underline;
                      color: #1890ff;
                  }
                  &:focus-visible {
                      outline: 1px dashed #40a9ff;
                      outline-offset: 2px;
                  }
              `
            : ''}
`;

const EmptyTickerMessage = styled.span`
    color: #94a3b8;
    font-size: 13px;
`;

export interface LiveTickerLog {
    id: number;
    time: string;
    type: string;
    message: string;
    link?: string;
}

export interface LiveTickerProps {
    logs: LiveTickerLog[];
    title?: string;
    emptyText?: string;
    onLogClick?: (log: LiveTickerLog) => void;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ logs, title = 'LIVE FEED', emptyText, onLogClick }) => {
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'error': return 'red';
            case 'warning': return 'gold';
            case 'success': return 'green';
            default: return 'blue';
        }
    };

    const handleLogInteraction = (log: LiveTickerLog) => {
        if (onLogClick) {
            onLogClick(log);
        }
    };

    return (
        <TickerContainer role="region" aria-label={title}>
            <TickerTitle>{title}</TickerTitle>
            <TickerContent $isPaused={logs.length === 0}>
                {logs.length === 0 && <EmptyTickerMessage>{emptyText}</EmptyTickerMessage>}
                {logs.map((log) => (
                    <LogItem
                        key={log.id}
                        $clickable={!!onLogClick}
                        role={onLogClick ? 'button' : undefined}
                        tabIndex={onLogClick ? 0 : undefined}
                        onClick={() => handleLogInteraction(log)}
                        onKeyDown={(event) => {
                            if ((event.key === 'Enter' || event.key === ' ') && onLogClick) {
                                event.preventDefault();
                                handleLogInteraction(log);
                            }
                        }}
                    >
                        <Tag color={getTypeColor(log.type)} style={{ marginRight: 8 }}>{log.time}</Tag>
                        [{log.type.toUpperCase()}] {log.message}
                    </LogItem>
                ))}
            </TickerContent>
        </TickerContainer>
    );
};
