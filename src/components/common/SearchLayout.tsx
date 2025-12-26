import React from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Space } from 'antd';

const Container = styled.div<{ $withBackground?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 16px;
    padding: ${props => props.$withBackground ? '16px' : '0'};
    background: ${props => props.$withBackground ? 'var(--ant-color-bg-container)' : 'transparent'};
    border-radius: ${props => props.$withBackground ? '12px' : '0'};
    box-shadow: ${props => props.$withBackground ? 'var(--ant-box-shadow-tertiary)' : 'none'};
`;

const SearchGroup = styled(Space)`
    flex: 1;
    min-width: 280px;
    flex-wrap: wrap;
    
    .ant-space-item {
        display: flex;
        align-items: center;
    }
`;

const ActionGroup = styled(Space)`
    flex-shrink: 0;
    margin-left: auto;
`;

interface SearchLayoutProps {
    children?: ReactNode;
    searchContent?: ReactNode;
    actionContent?: ReactNode;
    withBackground?: boolean;
}

export const SearchLayout: React.FC<SearchLayoutProps> & {
    SearchGroup: typeof SearchGroup;
    ActionGroup: typeof ActionGroup;
} = ({ children, searchContent, actionContent, withBackground = false }) => {
    if (searchContent || actionContent) {
        return (
            <Container $withBackground={withBackground}>
                <SearchGroup size={12}>
                    {searchContent}
                </SearchGroup>
                <ActionGroup size={12}>
                    {actionContent}
                </ActionGroup>
            </Container>
        );
    }

    return <Container $withBackground={withBackground}>{children}</Container>;
};

SearchLayout.SearchGroup = SearchGroup;
SearchLayout.ActionGroup = ActionGroup;

export default SearchLayout;
