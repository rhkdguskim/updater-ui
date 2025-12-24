import React from 'react';
import { Typography, theme, Space } from 'antd';
import styled from 'styled-components';

const { Title } = Typography;
const { useToken } = theme;

const SectionContainer = styled.div<{ $marginBottom: string }>`
  margin-bottom: ${props => props.$marginBottom};
`;

const SectionHeader = styled.div<{ $marginBottom: string }>`
  margin-bottom: ${props => props.$marginBottom};
  border-bottom: 1px solid var(--ant-color-border-secondary);
  padding-bottom: 8px;
`;

export interface FormSectionProps {
    title?: string;
    children: React.ReactNode;
}

/**
 * FormSection Pattern
 * - Consistent spacing between form sections
 * - Standardized section headers
 */
export const FormSection: React.FC<FormSectionProps> = ({ title, children }) => {
    const { token } = useToken();

    return (
        <SectionContainer $marginBottom={`${token.marginLG}px`}>
            {title && (
                <SectionHeader $marginBottom={`${token.marginMD}px`}>
                    <Title level={4} style={{ margin: 0 }}>
                        {title}
                    </Title>
                </SectionHeader>
            )}
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {children}
            </Space>
        </SectionContainer>
    );
};
