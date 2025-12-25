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
    overflow: auto;

    /* Table should not stretch rows - only use content height */
    .ant-table-wrapper {
        /* Don't use flex: 1 here - let table size naturally */
    }

    .ant-table-thead > tr > th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: var(--ant-color-bg-container, #fff);
    }

    /* Prevent tbody rows from stretching */
    .ant-table-tbody > tr {
        height: auto !important;
    }

    .ant-table-tbody > tr > td {
        height: auto !important;
    }
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
