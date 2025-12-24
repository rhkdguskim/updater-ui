import React from 'react';
import { Space, theme } from 'antd';
import styled from 'styled-components';

const { useToken } = theme;

const BarContainer = styled.div<{ $gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.$gap};
  width: 100%;
`;

export interface FilterBarProps {
    children: React.ReactNode;
    extra?: React.ReactNode;
}

/**
 * FilterBar Pattern
 * - Standardized spacing between filter elements
 * - Ensures vertical alignment and consistent height
 */
export const FilterBar: React.FC<FilterBarProps> = ({ children, extra }) => {
    const { token } = useToken();

    return (
        <BarContainer $gap={`${token.marginXS}px`}>
            <Space wrap size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space wrap size="middle">
                    {children}
                </Space>
                {extra && (
                    <Space wrap size="middle">
                        {extra}
                    </Space>
                )}
            </Space>
        </BarContainer>
    );
};
