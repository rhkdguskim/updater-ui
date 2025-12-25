import React from 'react';
import { theme } from 'antd';
import styled from 'styled-components';

const { useToken } = theme;

const StyledLayout = styled.div<{ $padding: string; $gap: string }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: ${props => props.$padding};
  gap: ${props => props.$gap};
  background-color: var(--ant-color-bg-container);
  overflow: hidden;
`;

export interface PageLayoutProps {
    children: React.ReactNode;
}

/**
 * PageLayout Pattern
 * - Consistent maximum width (inherits from parent)
 * - Standardized padding and spacing between sections
 * - Handles scroll at the page level
 */
export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
    const { token } = useToken();

    return (
        <StyledLayout
            $padding={`${token.marginLG}px`}
            $gap={`${token.marginMD}px`}
        >
            {children}
        </StyledLayout>
    );
};
