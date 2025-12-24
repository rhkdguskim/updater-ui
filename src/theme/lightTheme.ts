import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
    token: {
        // Modern vibrant primary color palette
        colorPrimary: '#6366f1', // Indigo
        colorSuccess: '#10b981', // Emerald
        colorWarning: '#f59e0b', // Amber
        colorError: '#ef4444', // Red
        colorInfo: '#3b82f6', // Blue

        // Clean and bright backgrounds
        colorBgContainer: '#ffffff',
        colorBgLayout: '#f8fafc',
        colorBgBase: '#ffffff',
        colorBgElevated: '#ffffff',

        // Typography
        colorText: '#1e293b',
        colorTextSecondary: '#64748b',
        colorTextTertiary: '#94a3b8',
        colorTextQuaternary: '#cbd5e1',

        // Borders and shadows
        colorBorder: '#e2e8f0',
        colorBorderSecondary: '#f1f5f9',

        // Design tokens
        borderRadius: 12,
        borderRadiusLG: 16,
        borderRadiusSM: 8,
        borderRadiusXS: 4,

        // Typography
        fontFamily: "'Pretendard Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        fontSize: 14,
        fontSizeHeading1: 38,
        fontSizeHeading2: 30,
        fontSizeHeading3: 24,

        // Spacing
        marginXS: 8,
        marginSM: 12,
        margin: 16,
        marginMD: 16,
        marginLG: 24,
        marginXL: 32,

        // Motion
        motionDurationFast: '0.1s',
        motionDurationMid: '0.2s',
        motionDurationSlow: '0.3s',

        // Shadows (will be used in components)
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        boxShadowSecondary: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
    components: {
        Layout: {
            siderBg: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
            headerBg: '#ffffff',
            bodyBg: '#f8fafc',
            headerPadding: '0 24px',
        },
        Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(255, 255, 255, 0.15)',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.1)',
            itemBorderRadius: 8,
            itemMarginInline: 8,
            itemPaddingInline: 16,
            iconSize: 18,
            collapsedIconSize: 20,
        },
        Card: {
            colorBgContainer: '#ffffff',
            borderRadiusLG: 16,
            boxShadowTertiary: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            paddingLG: 24,
        },
        Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f1f5f9',
            borderColor: '#e2e8f0',
            headerBorderRadius: 12,
        },
        Button: {
            borderRadius: 8,
            borderRadiusLG: 12,
            borderRadiusSM: 6,
            paddingInline: 16,
            paddingInlineLG: 24,
            fontWeight: 500,
            primaryShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
        },
        Input: {
            borderRadius: 8,
            paddingInline: 12,
            activeShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
        },
        Select: {
            borderRadius: 8,
        },
        Tag: {
            borderRadiusSM: 6,
        },
        Badge: {
            dotSize: 8,
        },
        Breadcrumb: {
            separatorMargin: 12,
        },
        Descriptions: {
            itemPaddingBottom: 16,
        },
        Statistic: {
            contentFontSize: 28,
        },
        Tabs: {
            cardBg: '#f8fafc',
            itemActiveColor: '#6366f1',
            itemHoverColor: '#6366f1',
            inkBarColor: '#6366f1',
        },
        Modal: {
            borderRadiusLG: 16,
        },
        Drawer: {
            borderRadiusLG: 16,
        },
        Message: {
            borderRadiusLG: 12,
        },
        Notification: {
            borderRadiusLG: 12,
        },
        Steps: {
            iconSize: 32,
        },
        Spin: {
            colorPrimary: '#6366f1',
        },
    },
};
