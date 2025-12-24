import React from 'react';
import styled from 'styled-components';
import { PageContainer, ChartsContainer, DashboardScrollContent } from '../DashboardStyles';

const TopRow = styled.div`
    display: flex;
    gap: 16px;
    flex: 0 0 auto;
    min-height: 320px;
`;

const BottomRow = styled.div`
    display: flex;
    gap: 16px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

interface DashboardGridProps {
    header: React.ReactNode;
    kpiCards: React.ReactNode;
    charts: React.ReactNode;
    bottomWidgets: React.ReactNode;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
    header,
    kpiCards,
    charts,
    bottomWidgets,
}) => {
    return (
        <PageContainer>
            {header}
            <DashboardScrollContent>
                <TopRow>
                    {kpiCards}
                    <ChartsContainer>
                        {charts}
                    </ChartsContainer>
                </TopRow>
                <BottomRow>
                    {bottomWidgets}
                </BottomRow>
            </DashboardScrollContent>
        </PageContainer>
    );
};
