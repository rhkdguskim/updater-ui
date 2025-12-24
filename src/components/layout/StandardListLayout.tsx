import React from 'react';
import { Card, Typography, Space } from 'antd';
import { PageContainer, HeaderRow } from './PageLayout';
import styled from 'styled-components';

const { Title, Text } = Typography;

const ContentCard = styled(Card)`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    
    .ant-card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 0;
        min-height: 0;
    }
`;

const TableWrapper = styled.div`
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

interface StandardListLayoutProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    headerExtra?: React.ReactNode;
    headerSubtitleExtra?: React.ReactNode;
    searchBar?: React.ReactNode;
    bulkActionBar?: React.ReactNode;
    children: React.ReactNode;
    noCardPadding?: boolean;
}

export const StandardListLayout: React.FC<StandardListLayoutProps> = ({
    title,
    subtitle,
    headerExtra,
    headerSubtitleExtra,
    searchBar,
    bulkActionBar,
    children,
    noCardPadding = true,
}) => {
    return (
        <PageContainer>
            <HeaderRow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {typeof title === 'string' ? (
                        <Title level={2} style={{ margin: 0 }}>{title}</Title>
                    ) : (
                        title
                    )}
                    <Space size={12}>
                        {typeof subtitle === 'string' ? (
                            <Text type="secondary">{subtitle}</Text>
                        ) : (
                            subtitle
                        )}
                        {headerSubtitleExtra}
                    </Space>
                </div>
                {headerExtra && <Space>{headerExtra}</Space>}
            </HeaderRow>

            {searchBar}

            {bulkActionBar}

            <ContentCard styles={{ body: { padding: noCardPadding ? 0 : 24 } }}>
                <TableWrapper>
                    {children}
                </TableWrapper>
            </ContentCard>
        </PageContainer>
    );
};

export default StandardListLayout;
