import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Tag } from 'antd';

const scroll = keyframes`
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
`;

const TickerContainer = styled.div`
    background: #001529;
    color: #fff;
    height: 40px;
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    position: relative;
    padding: 0 16px;
`;

const TickerContent = styled.div`
    display: inline-block;
    animation: ${scroll} 30s linear infinite;
    &:hover {
        animation-play-state: paused;
    }
`;

const LogItem = styled.span`
    margin-right: 40px;
    font-family: 'Monaco', monospace;
    font-size: 13px;
    cursor: pointer;
    &:hover {
        text-decoration: underline;
        color: #1890ff;
    }
`;

export interface LiveTickerLog {
    id: number;
    time: string;
    type: string;
    message: string;
}

export interface LiveTickerProps {
    logs: LiveTickerLog[];
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ logs }) => {
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'error': return 'red';
            case 'warning': return 'gold';
            case 'success': return 'green';
            default: return 'blue';
        }
    };

    return (
        <TickerContainer>
            <div style={{ fontWeight: 'bold', marginRight: 16, color: '#1890ff' }}>LIVE FEED</div>
            <TickerContent>
                {logs.map((log) => (
                    <LogItem key={log.id}>
                        <Tag color={getTypeColor(log.type)} style={{ marginRight: 8 }}>{log.time}</Tag>
                        [{log.type.toUpperCase()}] {log.message}
                    </LogItem>
                ))}
            </TickerContent>
        </TickerContainer>
    );
};
