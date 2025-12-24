import styled, { keyframes, css } from 'styled-components';
import { Card } from 'antd';

// Animations
export const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

export const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

export const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

// Layout Components
export const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    padding: 24px;
    animation: ${fadeInUp} 0.5s ease-out;
`;

export const DashboardScrollContent = styled.div`
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

export const KPIGridContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    flex: 0 0 280px;
`;

export const ChartsContainer = styled.div`
    display: flex;
    gap: 16px;
    flex: 1;
    min-width: 0;
`;

// Color Theme Definitions for different chart types
export const CHART_THEMES = {
    connectivity: {
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        accentLight: 'rgba(16, 185, 129, 0.08)',
        accentBorder: 'rgba(16, 185, 129, 0.2)',
        iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    deployment: {
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        accentLight: 'rgba(59, 130, 246, 0.08)',
        accentBorder: 'rgba(59, 130, 246, 0.2)',
        iconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    rollout: {
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        accentLight: 'rgba(139, 92, 246, 0.08)',
        accentBorder: 'rgba(139, 92, 246, 0.2)',
        iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
    action: {
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        accentLight: 'rgba(245, 158, 11, 0.08)',
        accentBorder: 'rgba(245, 158, 11, 0.2)',
        iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    fragmentation: {
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        accentLight: 'rgba(236, 72, 153, 0.08)',
        accentBorder: 'rgba(236, 72, 153, 0.2)',
        iconBg: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    },
    activity: {
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        accentLight: 'rgba(6, 182, 212, 0.08)',
        accentBorder: 'rgba(6, 182, 212, 0.2)',
        iconBg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    },
};

// Card Components
export const StatsCard = styled(Card) <{ $accentColor?: string; $delay?: number; $pulse?: boolean }>`
border: none;
    border-radius: 16px;
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    cursor: pointer;
    min-height: 120px;

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
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .dark-mode & {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%);
    }

    .ant-card-body {
        padding: 16px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
`;

// Themed Chart Card with unique styling per chart type
export const ChartCard = styled(Card) <{ $delay?: number; $theme?: keyof typeof CHART_THEMES }>`
    border: none;
    border-radius: 16px;
    background: ${props => {
        const theme = props.$theme ? CHART_THEMES[props.$theme] : null;
        return theme
            ? `linear-gradient(145deg, ${theme.accentLight} 0%, rgba(255, 255, 255, 0.98) 30%, rgba(255, 255, 255, 0.95) 100%)`
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)';
    }};
    backdrop-filter: blur(20px);
    box-shadow: var(--ant-box-shadow-tertiary, 0 4px 24px rgba(0, 0, 0, 0.06));
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

    /* Accent border on left side */
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${props => {
        const theme = props.$theme ? CHART_THEMES[props.$theme] : null;
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
        const theme = props.$theme ? CHART_THEMES[props.$theme] : null;
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
        color: #1e293b;
        padding: 4px 0;
    }
    
    .ant-card-body {
        flex: 1;
        padding: 12px 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .dark-mode & {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%);
        
        .ant-card-head {
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .ant-card-head-title {
            color: #e2e8f0;
        }
    }
`;

export const ListCard = styled(ChartCard)`
    /* ListCard inherits all styles from ChartCard */
    `;

// Icon Badge for chart headers
export const IconBadge = styled.div<{ $theme?: keyof typeof CHART_THEMES }>`
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => {
        const theme = props.$theme ? CHART_THEMES[props.$theme] : null;
        return theme?.iconBg || 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }};
    color: white;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

export const BigNumber = styled.div`
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 4px;
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

export const LiveIndicator = styled.div<{ $active?: boolean; $color?: string }>`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: ${props => props.$active ? (props.$color || 'var(--ant-color-success)') : 'var(--ant-color-text-quaternary)'};
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
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(0, 0, 0, 0.04);
    
    &:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 0.9) 100%);
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
`;

export const ProgressBar = styled.div<{ $progress: number; $color?: string }>`
    width: 100%;
    height: 6px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
    overflow: hidden;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: ${props => props.$progress}%;
        background: ${props => props.$color || 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'};
        border-radius: 3px;
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
`;

export const COLORS = {
    online: '#10b981',
    offline: '#f59e0b',
    pending: '#f59e0b',
    success: '#3b82f6',
    running: '#3b82f6',
    finished: '#10b981',
    error: '#ef4444',
    approval: '#8b5cf6',
    inSync: '#10b981',
    registered: '#6366f1',
    unknown: '#94a3b8',
};
