import type { ThemeConfig } from 'antd';
import { modernColors } from './constants';

export const lightTheme: ThemeConfig = {
    token: {
        // Modern vibrant primary color palette
        colorPrimary: modernColors.colorPrimary,
        colorSuccess: modernColors.colorSuccess,
        colorWarning: modernColors.colorWarning,
        colorError: modernColors.colorError,
        colorInfo: modernColors.colorInfo,

        // Clean and bright backgrounds
        colorBgContainer: '#ffffff',
        colorBgLayout: '#f8fafc',
        colorBgBase: '#ffffff',
        colorBgElevated: '#ffffff',

        // Typography
        colorText: '#1c1c1e',
        colorTextSecondary: '#636366',
        colorTextTertiary: '#a0a0a5',
        colorTextQuaternary: '#c7c7cc',

        // Borders and shadows
        colorBorder: '#e5e5ea',
        colorBorderSecondary: '#f2f2f7',

        // Design tokens
        borderRadius: 16,
        borderRadiusLG: 20,
        borderRadiusSM: 12,
        borderRadiusXS: 8,

        // Typography
        fontFamily: "'Pretendard Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        fontSize: 15,
        fontSizeHeading1: 40,
        fontSizeHeading2: 32,
        fontSizeHeading3: 26,

        // Spacing
        marginXS: 8,
        marginSM: 12,
        margin: 16,
        marginMD: 20,
        marginLG: 28,
        marginXL: 36,

        // Motion
        motionDurationFast: '0.1s',
        motionDurationMid: '0.2s',
        motionDurationSlow: '0.3s',

        // Shadows (will be used in components)
        boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        boxShadowSecondary: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
    },
    components: {
        Layout: {
            siderBg: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
            headerBg: '#ffffff',
            bodyBg: '#f8fafc',
            headerPadding: '0 28px',
        },
        Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(255, 255, 255, 0.15)',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.1)',
            itemBorderRadius: 12,
            itemMarginInline: 12,
            itemPaddingInline: 20,
            iconSize: 19,
            collapsedIconSize: 21,
        },
        Card: {
            colorBgContainer: '#ffffff',
            borderRadiusLG: 20,
            boxShadowTertiary: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
            paddingLG: 28,
        },
        Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f1f5f9',
            borderColor: '#e2e8f0',
            headerBorderRadius: 16,
        },
        Button: {
            borderRadius: 12,
            borderRadiusLG: 16,
            borderRadiusSM: 10,
            paddingInline: 20,
            paddingInlineLG: 28,
            fontWeight: 500,
            primaryShadow: '0 4px 14px 0 rgba(94, 92, 230, 0.39)',
        },
        Input: {
            borderRadius: 12,
            paddingInline: 16,
            activeShadow: '0 0 0 3px rgba(94, 92, 230, 0.1)',
        },
        Select: {
            borderRadius: 12,
        },
        Tag: {
            borderRadiusSM: 10,
        },
        Badge: {
            dotSize: 9,
        },
        Breadcrumb: {
            separatorMargin: 16,
        },
        Descriptions: {
            itemPaddingBottom: 20,
        },
        Statistic: {
            contentFontSize: 30,
        },
        Tabs: {
            cardBg: '#f8fafc',
            itemActiveColor: modernColors.colorPrimary,
            itemHoverColor: modernColors.colorPrimary,
            inkBarColor: modernColors.colorPrimary,
        },
        Modal: {
            borderRadiusLG: 20,
        },
        Drawer: {
            borderRadiusLG: 20,
        },
        Message: {
            borderRadiusLG: 16,
        },
        Notification: {
            borderRadiusLG: 16,
        },
        Steps: {
            iconSize: 34,
        },
        Spin: {
            colorPrimary: modernColors.colorPrimary,
        },
    },
};
