import React from 'react';
import { Layout, theme, Avatar, Typography, Dropdown, Divider, Badge, Menu, type MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import {
    MdDashboard,
    MdDevices,
    MdInventory,
    MdRocketLaunch,
    MdPlayArrow,
    MdAssignment,
    MdList,
    MdLabel,
    MdCategory,
    MdExtension,
    MdOutlineDashboard,
} from 'react-icons/md';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher, ThemeSwitcher } from '@/components/common';

const { Header } = Layout;
const { Text } = Typography;

const StyledHeader = styled(Header) <{ $bg: string }>`
    padding: 0 24px;
    height: 64px;
    background: ${(props) => props.$bg};
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 100;
    
    .dark-mode & {
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 32px;
    flex: 1;
`;

const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  .logo-icon {
    width: 26px;
    height: 26px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }
  
  .logo-text {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #1e293b;
    
    .dark-mode & {
      color: #f8fafc;
    }
  }
`;

const StyledMenu = styled(Menu)`
    flex: 1;
    border-bottom: none !important;
    background: transparent !important;
    margin-left: 24px;
    
    .ant-menu-item, .ant-menu-submenu {
        top: 0 !important;
        margin-bottom: 0 !important;
        
        &::after {
            bottom: -1px !important;
        }
    }
`;

const SettingsGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background: rgba(99, 102, 241, 0.06);
    border-radius: 10px;
`;

const UserSection = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 8px 4px 12px;
    background: rgba(99, 102, 241, 0.06);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    height: 40px;
    
    &:hover {
        background: rgba(99, 102, 241, 0.1);
    }
`;

const UserInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
`;

const UserName = styled(Text)`
    font-weight: 600;
    font-size: 13px;
    line-height: 1.2;
`;

const UserRole = styled(Text)`
    font-size: 11px;
    opacity: 0.7;
`;

const StyledAvatar = styled(Avatar)`
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
    font-size: 14px;
`;

interface AppHeaderProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = () => {
    const { t } = useTranslation();
    const {
        token: { colorBgContainer },
    } = theme.useToken();
    const location = useLocation();
    const { user, role, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getSelectedKeys = () => {
        const path = location.pathname;
        if (path === '/') return ['/'];
        if (path.startsWith('/targets')) return ['targets-menu'];
        if (path.startsWith('/distributions')) return ['distributions-menu'];
        if (path.startsWith('/jobs')) return ['/jobs'];
        if (path.startsWith('/actions')) return ['/jobs'];
        if (path.startsWith('/rollouts')) return ['/jobs'];
        return [];
    };

    const menuItems: MenuProps['items'] = [
        {
            key: '/',
            icon: <MdDashboard />,
            label: t('nav.dashboard'),
            onClick: () => navigate('/'),
        },
        {
            key: 'targets-menu',
            label: t('nav.targets'),
            icon: <MdDevices />,
            onTitleClick: () => navigate('/targets'),
            children: [
                {
                    key: '/targets/overview',
                    icon: <MdOutlineDashboard />,
                    label: t('nav.overview', '개요'),
                    onClick: () => navigate('/targets'),
                },
                {
                    key: '/targets/list',
                    icon: <MdList />,
                    label: t('nav.list'),
                    onClick: () => navigate('/targets/list'),
                },
                {
                    key: '/targets/tags-types',
                    icon: <MdLabel />,
                    label: t('nav.tagsAndTypes'),
                    onClick: () => navigate('/targets/tags-types'),
                },
            ],
        },
        {
            key: 'distributions-menu',
            label: t('nav.distributions'),
            icon: <MdInventory />,
            onTitleClick: () => navigate('/distributions'),
            children: [
                {
                    key: '/distributions/overview',
                    icon: <MdOutlineDashboard />,
                    label: t('nav.overview', '개요'),
                    onClick: () => navigate('/distributions'),
                },
                {
                    key: 'distribution-sets-group',
                    label: t('nav.distributionSets'),
                    type: 'group',
                    children: [
                        {
                            key: '/distributions/sets',
                            icon: <MdList />,
                            label: t('nav.list'),
                            onClick: () => navigate('/distributions/sets'),
                        },
                        {
                            key: '/distributions/ds-types-tags',
                            icon: <MdCategory />,
                            label: t('nav.typesAndTags'),
                            onClick: () => navigate('/distributions/ds-types-tags'),
                        },

                    ]
                },
                {
                    key: 'software-modules-group',
                    label: t('nav.softwareModules'),
                    type: 'group',
                    children: [
                        {
                            key: '/distributions/modules',
                            icon: <MdList />,
                            label: t('nav.list'),
                            onClick: () => navigate('/distributions/modules'),
                        },
                        {
                            key: '/distributions/sm-types',
                            icon: <MdExtension />,
                            label: t('nav.types'),
                            onClick: () => navigate('/distributions/sm-types'),
                        },
                    ]
                },
            ],
        },
        {
            key: '/jobs',
            icon: <MdAssignment />,
            label: t('nav.jobs'),
            onTitleClick: () => navigate('/jobs'),
            children: [
                {
                    key: '/jobs/dashboard',
                    icon: <MdOutlineDashboard />,
                    label: t('nav.jobsOverview', '개요'),
                    onClick: () => navigate('/jobs'),
                },
                {
                    key: '/actions',
                    icon: <MdPlayArrow />,
                    label: t('nav.actions'),
                    onClick: () => navigate('/actions'),
                },
                {
                    key: '/rollouts',
                    icon: <MdRocketLaunch />,
                    label: t('nav.rollouts'),
                    onClick: () => navigate('/rollouts'),
                },
            ]
        },
    ];

    const userMenuItems: MenuProps['items'] = [
        ...(role === 'Admin' ? [{
            key: 'settings',
            label: t('nav.configuration'),
            icon: <SettingOutlined />,
            onClick: () => navigate('/system/config'),
        }, { type: 'divider' as const }] : []),
        {
            key: 'logout',
            label: t('settings.logout'),
            icon: <LogoutOutlined />,
            onClick: handleLogout,
            danger: true,
        },
    ];

    return (
        <StyledHeader $bg={colorBgContainer}>
            <HeaderLeft>
                <LogoContainer onClick={() => navigate('/')}>
                    <div className="logo-icon">
                        <MdRocketLaunch />
                    </div>
                    <span className="logo-text">{import.meta.env.VITE_APP_TITLE || 'Updater UI'}</span>
                </LogoContainer>

                <StyledMenu
                    mode="horizontal"
                    selectedKeys={getSelectedKeys()}
                    items={menuItems}
                    disabledOverflow
                />
            </HeaderLeft>

            <HeaderRight>
                <SettingsGroup>
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                </SettingsGroup>

                <Divider orientation="vertical" style={{ height: 32, margin: '0 4px' }} />

                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={['click']}>
                    <UserSection>
                        <UserInfo>
                            <UserName>{user}</UserName>
                            <UserRole type="secondary">{role}</UserRole>
                        </UserInfo>
                        <Badge dot status="success" offset={[-2, 24]}>
                            <StyledAvatar icon={<UserOutlined />} size={30} />
                        </Badge>
                    </UserSection>
                </Dropdown>
            </HeaderRight>
        </StyledHeader>
    );
};

export default AppHeader;
