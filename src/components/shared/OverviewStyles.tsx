import styled, { keyframes, css } from 'styled-components';
import { Card, Typography } from 'antd';

// Animations
export const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

export const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

// Color Theme Definitions
export const OVERVIEW_THEMES = {
    targets: {
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        accentLight: 'rgba(16, 185, 129, 0.08)',
        accentBorder: 'rgba(16, 185, 129, 0.2)',
        iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'var(--ant-color-success, #10b981)',
    },
    distributions: {
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        accentLight: 'rgba(99, 102, 241, 0.08)',
        accentBorder: 'rgba(99, 102, 241, 0.2)',
        iconBg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'var(--ant-color-primary, #6366f1)',
    },
    actions: {
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        accentLight: 'rgba(59, 130, 246, 0.08)',
        accentBorder: 'rgba(59, 130, 246, 0.2)',
        iconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'var(--ant-color-info, #3b82f6)',
    },
    rollouts: {
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        accentLight: 'rgba(245, 158, 11, 0.08)',
        accentBorder: 'rgba(245, 158, 11, 0.2)',
        iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'var(--ant-color-warning, #f59e0b)',
    },
};

// Layout Components
export const OverviewPageContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    padding: 24px;
    animation: ${fadeInUp} 0.5s ease-out;
`;

export const OverviewScrollContent = styled.div`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
    
    /* Custom scrollbar for premium feel */
    &::-webkit-scrollbar {
        width: 6px;
    }
    &::-webkit-scrollbar-track {
        background: transparent;
    }
    &::-webkit-scrollbar-thumb {
        background: var(--ant-color-primary-bg-hover, rgba(99, 102, 241, 0.1));
        border-radius: 10px;
    }
`;

export const OverviewPageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 8px 0;
    flex-shrink: 0;
`;

export const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const GradientTitle = styled(Typography.Title) <{ $theme?: keyof typeof OVERVIEW_THEMES }>`
    && {
        margin: 0;
        background: ${props => {
        const theme = props.$theme ? OVERVIEW_THEMES[props.$theme] : null;
        return theme ? theme.gradient : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)';
    }};
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    [data-theme='dark'] &,
    .dark-mode & {
        background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
        -webkit-background-clip: text;
        background-clip: text;
    }
`;

export const TopRow = styled.div`
    display: flex;
    gap: 16px;
    min-height: 240px;
    flex-shrink: 0;
`;

export const BottomRow = styled.div`
    display: flex;
    gap: 16px;
    min-height: 300px;
    flex: 1;
`;

export const KPIGridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    flex: 0 0 260px;
    height: 100%;
`;

export const ChartsContainer = styled.div`
    display: flex;
    gap: 16px;
    flex: 1;
    min-width: 0;
`;

// Card Components
export const OverviewStatsCard = styled(Card) <{ $accentColor?: string; $delay?: number; $pulse?: boolean }>`
    border: none;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    cursor: pointer;
    height: 100%;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: ${props => props.$accentColor || 'var(--gradient-primary)'};
        ${props => props.$pulse && css`animation: ${pulse} 2s ease-in-out infinite;`}
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    }

    [data-theme='dark'] &,
    .dark-mode & {
        background: linear-gradient(145deg, rgba(24, 24, 27, 0.95) 0%, rgba(9, 9, 11, 0.9) 100%);
        border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .ant-card-body {
        padding: 12px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
`;

export const OverviewChartCard = styled(Card) <{ $delay?: number; $theme?: keyof typeof OVERVIEW_THEMES }>`
    border: none;
    border-radius: 16px;
    background: ${props => {
        const theme = props.$theme ? OVERVIEW_THEMES[props.$theme] : null;
        return theme
            ? `linear-gradient(145deg, ${theme.accentLight} 0%, rgba(255, 255, 255, 0.98) 30%, rgba(255, 255, 255, 0.95) 100%)`
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)';
    }};
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    height: 100%;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${props => {
        const theme = props.$theme ? OVERVIEW_THEMES[props.$theme] : null;
        return theme?.gradient || 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)';
    }};
        border-radius: 16px 0 0 16px;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    
    .ant-card-head {
        border-bottom: 1px solid ${props => {
        const theme = props.$theme ? OVERVIEW_THEMES[props.$theme] : null;
        return theme?.accentBorder || 'rgba(0, 0, 0, 0.04)';
    }};
        flex-shrink: 0;
        padding: 12px 16px;
        min-height: auto;
        background: transparent;
    }
    
    .ant-card-head-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--ant-color-text, #1e293b);
        padding: 4px 0;
    }
    
    .ant-card-body {
        flex: 1;
        padding: 12px 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    [data-theme='dark'] &,
    .dark-mode & {
        background: linear-gradient(145deg, rgba(24, 24, 27, 0.95) 0%, rgba(9, 9, 11, 0.9) 100%);
        border: 1px solid rgba(255, 255, 255, 0.04);
        
        .ant-card-head {
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .ant-card-head-title {
            color: #f8fafc;
        }
    }
`;

export const OverviewListCard = styled(OverviewChartCard)`
    /* ListCard inherits all styles from ChartCard */
    `;

export const IconBadge = styled.div<{ $theme?: keyof typeof OVERVIEW_THEMES; $color?: string }>`
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => {
        if (props.$color) return props.$color;
        const theme = props.$theme ? OVERVIEW_THEMES[props.$theme] : null;
        return theme?.iconBg || 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }};
    color: white;
    font-size: 18px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
`;

export const BigNumber = styled.div<{ $color?: string }>`
font-size: 32px;
font-weight: 700;
line-height: 1.2;
margin-bottom: 4px;
color: ${props => props.$color || 'var(--ant-color-primary, #3b82f6)'};
`;

export const LiveIndicator = styled.div<{ $color?: string; $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: ${props => props.$color || '#64748b'};
    font-weight: 500;
    
    &::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${props => props.$active ? (props.$color || '#10b981') : '#94a3b8'};
        ${props => props.$active && css`animation: ${pulse} 1.5s ease-in-out infinite;`}
    }
`;

export const ChartLegendItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(0, 0, 0, 0.04);
    
    &:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 0.9) 100%);
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    [data-theme='dark'] &,
    .dark-mode & {
        background: linear-gradient(135deg, rgba(24, 24, 27, 0.8) 0%, rgba(9, 9, 11, 0.6) 100%);
        border: 1px solid rgba(255, 255, 255, 0.03);
        
        span { color: #94a3b8 !important; }
    }
`;

export const ActivityItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    cursor: pointer;
    height: 100%;
    width: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.4) 100%);
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.03);
    transition: all 0.2s ease;

    &:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%);
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    [data-theme='dark'] &,
    .dark-mode & {
        background: linear-gradient(135deg, rgba(24, 24, 27, 0.8) 0%, rgba(9, 9, 11, 0.6) 100%);
        border: 1px solid rgba(255, 255, 255, 0.03);
    }
`;

export const StatusBadge = styled.div<{ $status?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    
    ${props => {
        const status = props.$status?.toLowerCase();
        if (status === 'online' || status === 'in_sync' || status === 'finished' || status === 'complete') return css`
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
        `;
        if (status === 'running' || status === 'pending') return css`
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
        `;
        if (status === 'offline' || status === 'incomplete') return css`
            background: rgba(245, 158, 11, 0.1);
            color: #d97706;
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

export const COLORS = {
    // Update Status Colors
    inSync: '#10b981',
    pending: '#3b82f6',
    error: '#ef4444',
    unknown: '#94a3b8',
    // Connectivity Colors
    online: '#10b981',
    offline: '#f59e0b',
    // General
    success: '#10b981',
    running: '#3b82f6',
    finished: '#10b981',
    canceled: '#94a3b8',
    // Theme
    targets: '#10b981',
    distributions: '#6366f1',
    actions: '#3b82f6',
    rollouts: '#f59e0b',
};
