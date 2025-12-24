import React from 'react';
import { Card } from 'antd';
import { PageLayout, PageHeader } from '@/components/patterns';
import styled from 'styled-components';

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
    headerSubtitleExtra?: React.ReactNode;
    headerExtra?: React.ReactNode;
    searchBar?: React.ReactNode;
    bulkActionBar?: React.ReactNode;
    children: React.ReactNode;
    noCardPadding?: boolean;
}

export const StandardListLayout: React.FC<StandardListLayoutProps> = ({
    title,
    subtitle,
    headerSubtitleExtra,
    headerExtra,
    searchBar,
    bulkActionBar,
    children,
    noCardPadding = true,
}) => {
    return (
        <PageLayout>
            <PageHeader
                title={title}
                subtitle={subtitle}
                subtitleExtra={headerSubtitleExtra}
                actions={headerExtra}
            />

            {searchBar}

            {bulkActionBar}

            <ContentCard styles={{ body: { padding: noCardPadding ? 0 : 24 } }}>
                <TableWrapper>
                    {children}
                </TableWrapper>
            </ContentCard>
        </PageLayout>
    );
};

export default StandardListLayout;
