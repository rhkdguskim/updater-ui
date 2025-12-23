import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const darkTheme: ThemeConfig = {
    token: {
        // More vibrant primary color for dark mode (Indigo-400)
        colorPrimary: '#818cf8',
        colorSuccess: '#34d399', // Emerald-400
        colorWarning: '#fbbf24', // Amber-400
        colorError: '#f87171', // Red-400
        colorInfo: '#60a5fa', // Blue-400

        // Deeper backgrounds (Zinc-950 and Zinc-900)
        colorBgContainer: '#09090b',
        colorBgLayout: '#020617', // Deeper Slate-950
        colorBgBase: '#020617',
        colorBgElevated: '#18181b', // Zinc-900
        colorBgSpotlight: '#27272a', // Zinc-800

        // Typography
        colorText: '#f8fafc', // Slate-50
        colorTextSecondary: '#94a3b8', // Slate-400
        colorTextTertiary: '#64748b', // Slate-500
        colorTextQuaternary: '#475569', // Slate-600

        // Borders - subtler
        colorBorder: '#1e293b',
        colorBorderSecondary: '#0f172a',

        // Design tokens - more compact
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        borderRadiusXS: 4,

        // Typography
        fontFamily: "'Pretendard Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        fontSize: 13, // Slightly smaller for compact feel
        fontSizeHeading1: 32,
        fontSizeHeading2: 24,
        fontSizeHeading3: 20,

        // Spacing - more compact
        marginXS: 4,
        marginSM: 8,
        margin: 12,
        marginMD: 16,
        marginLG: 20,
        marginXL: 28,

        // Motion
        motionDurationFast: '0.1s',
        motionDurationMid: '0.2s',
        motionDurationSlow: '0.3s',

        // Shadows
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        boxShadowSecondary: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    },
    algorithm: theme.darkAlgorithm,
    components: {
        Layout: {
            siderBg: '#09090b',
            headerBg: '#09090b',
            bodyBg: '#020617',
            headerPadding: '0 20px',
        },
        Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(129, 140, 248, 0.15)',
            darkItemHoverBg: 'rgba(129, 140, 248, 0.08)',
            itemBorderRadius: 6,
            itemMarginInline: 6,
            itemPaddingInline: 12,
            iconSize: 16,
            collapsedIconSize: 18,
        },
        Card: {
            colorBgContainer: '#09090b',
            borderRadiusLG: 12,
            boxShadowTertiary: '0 4px 6px -1px rgb(0 0 0 / 0.2)',
            paddingLG: 16, // More compact padding
        },
        Table: {
            headerBg: '#18181b',
            headerColor: '#cbd5e1',
            rowHoverBg: '#1e293b',
            borderColor: '#1e293b',
            headerBorderRadius: 8,
            padding: 10, // Compact table
        },
        Button: {
            borderRadius: 6,
            borderRadiusLG: 8,
            borderRadiusSM: 4,
            paddingInline: 12,
            paddingInlineLG: 20,
            fontWeight: 600,
            primaryShadow: '0 4px 12px 0 rgba(129, 140, 248, 0.2)',
        },
        Input: {
            borderRadius: 6,
            paddingInline: 10,
            activeShadow: '0 0 0 2px rgba(129, 140, 248, 0.2)',
            colorBgContainer: '#020617',
        },
        Select: {
            borderRadius: 6,
            optionSelectedBg: 'rgba(129, 140, 248, 0.15)',
        },
        Tag: {
            borderRadiusSM: 4,
        },
        Badge: {
            dotSize: 6,
        },
        Tabs: {
            cardBg: '#020617',
            itemActiveColor: '#818cf8',
            itemHoverColor: '#818cf8',
            inkBarColor: '#818cf8',
            horizontalItemPadding: '8px 4px',
        },
        Modal: {
            contentBg: '#09090b',
            headerBg: '#09090b',
            borderRadiusLG: 12,
        },
        Drawer: {
            colorBgElevated: '#09090b',
            borderRadiusLG: 12,
        },
        Statistic: {
            contentFontSize: 24,
        },
        Tooltip: {
            colorBgSpotlight: '#18181b',
        },
    },
};
