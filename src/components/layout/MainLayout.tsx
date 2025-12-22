import React from 'react';
import { Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import styled from 'styled-components';

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: transparent;
`;

const ContentLayout = styled(Layout)`
  transition: background-color 0.3s ease;
`;

const StyledContent = styled(Content) <{ $bg: string; $radius: number }>`
  margin: 8px;
  padding: 12px;
  height: calc(100vh - 48px - 16px);
  overflow: auto;
  background: ${(props) => props.$bg};
  border-radius: ${(props) => props.$radius}px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease-out;
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MainLayout: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <StyledLayout>
      <ContentLayout>
        <AppHeader />
        <StyledContent $bg={colorBgContainer} $radius={borderRadiusLG}>
          <Outlet />
        </StyledContent>
      </ContentLayout>
    </StyledLayout>
  );
};

export default MainLayout;
