import React from 'react';
import { Spin, Empty, Alert } from 'antd';
import styled from 'styled-components';

const Container = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CenterContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export interface DataViewProps {
    loading?: boolean;
    error?: Error | null;
    isEmpty?: boolean;
    emptyText?: string;
    children: React.ReactNode;
}

/**
 * DataView Pattern
 * - Handles Loading, Error, and Empty states consistently
 * - Ensures the content area takes up remaining space
 */
export const DataView: React.FC<DataViewProps> = ({
    loading,
    error,
    isEmpty,
    emptyText,
    children,
}) => {
    if (loading) {
        return (
            <Container>
                <CenterContent>
                    <Spin size="large" />
                </CenterContent>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert
                    type="error"
                    message="Resource Load Failed"
                    description={error.message}
                    showIcon
                />
            </Container>
        );
    }

    if (isEmpty) {
        return (
            <Container>
                <CenterContent>
                    <Empty description={emptyText} />
                </CenterContent>
            </Container>
        );
    }

    return <Container>{children}</Container>;
};
