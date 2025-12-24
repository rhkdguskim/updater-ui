import styled from 'styled-components';

export const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-height: 0;
    height: 100%;
    /* Remove rigid height to allow parent flex to control it, or for it to grow */
    padding-bottom: 24px;
`;


export const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 4px 0;
`;
