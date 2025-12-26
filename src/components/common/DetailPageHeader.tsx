import React from 'react';
import { Typography, Button, Space, Skeleton } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { StatusTag } from './StatusTag';

const { Title, Text } = Typography;

const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
    padding: 8px 0;
`;

const TitleSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const TitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
`;

const StyledTitle = styled(Title)`
    && {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        line-height: 1.3;
    }
`;

const BackButton = styled(Button)`
    && {
        padding: 4px 12px;
        height: 32px;
        font-size: 13px;
    }
`;

const Description = styled(Text)`
    && {
        margin-left: 0;
        font-size: 14px;
        max-width: 600px;
    }
`;

const ActionsContainer = styled(Space)`
    && {
        .ant-btn {
            height: 36px;
            padding: 4px 16px;
            font-size: 14px;
        }
    }
`;

export interface DetailPageHeaderProps {
    /** Title of the page */
    title?: string;
    /** Optional description shown below title */
    description?: string;
    /** Status string for StatusTag component */
    status?: string;
    /** Back button label */
    backLabel: string;
    /** Callback when back button is clicked */
    onBack: () => void;
    /** Show loading skeleton for title */
    loading?: boolean;
    /** Action buttons to show on the right side */
    actions?: React.ReactNode;
    /** Additional content to show after status tag */
    extra?: React.ReactNode;
}

/**
 * Standardized header component for all detail pages.
 * Provides consistent layout for back button, title, status, and actions.
 */
export const DetailPageHeader: React.FC<DetailPageHeaderProps> = ({
    title,
    description,
    status,
    backLabel,
    onBack,
    loading = false,
    actions,
    extra,
}) => {
    return (
        <HeaderContainer>
            <TitleSection>
                <TitleRow>
                    <BackButton icon={<ArrowLeftOutlined />} onClick={onBack}>
                        {backLabel}
                    </BackButton>
                    {loading ? (
                        <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
                    ) : (
                        <StyledTitle level={3}>
                            {title}
                        </StyledTitle>
                    )}
                    {status && (
                        <StatusTag
                            status={status}
                            style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 12 }}
                        />
                    )}
                    {extra}
                </TitleRow>
                {description && (
                    <Description type="secondary">
                        {description}
                    </Description>
                )}
            </TitleSection>
            {actions && <ActionsContainer wrap>{actions}</ActionsContainer>}
        </HeaderContainer>
    );
};

export default DetailPageHeader;
