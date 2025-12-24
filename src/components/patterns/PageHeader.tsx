import React from 'react';
import { Typography, Space, theme } from 'antd';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { useToken } = theme;

const HeaderContainer = styled.div<{ $paddingBottom: string }>`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: ${props => props.$paddingBottom};
  flex-wrap: wrap;
  gap: 16px;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    subtitleExtra?: React.ReactNode;
    actions?: React.ReactNode;
}

/**
 * PageHeader Pattern
 * - Standardized Title (level 2)
 * - Optional Subtitle/Description
 * - Actions area on the right
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, subtitleExtra, actions }) => {
    const { token } = useToken();

    return (
        <HeaderContainer $paddingBottom={`${token.marginXS}px`}>
            <TitleSection>
                {typeof title === 'string' ? (
                    <Title level={2} style={{ margin: 0 }}>
                        {title}
                    </Title>
                ) : (
                    title
                )}
                {(subtitle || subtitleExtra) && (
                    <Space size={8} align="center">
                        {subtitle && (
                            <Text type="secondary" style={{ fontSize: token.fontSize }}>
                                {subtitle}
                            </Text>
                        )}
                        {subtitleExtra}
                    </Space>
                )}
            </TitleSection>
            {actions && (
                <Space size="middle">
                    {actions}
                </Space>
            )}
        </HeaderContainer>
    );
};
