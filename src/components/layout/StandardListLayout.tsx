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

    /* Ant Design Table flex layout overrides */
    .ant-table-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-spin-nested-loading {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-spin-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-table {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-table-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-table-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: auto !important;
    }

    .ant-table-content > table {
        flex: 1;
    }

    .ant-table-thead > tr > th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: var(--ant-color-bg-container, #fff);
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
