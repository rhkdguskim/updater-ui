import { theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { modernColors } from './constants';

export const darkTheme: ThemeConfig = {
    token: {
        // More vibrant primary color for dark mode (Indigo-400)
        colorPrimary: modernColors.colorPrimary,
        colorSuccess: modernColors.colorSuccess,
        colorWarning: modernColors.colorWarning,
        colorError: modernColors.colorError,
        colorInfo: modernColors.colorInfo,

        // Deeper backgrounds (Zinc-950 and Zinc-900)
        colorBgContainer: '#1c1c1e',
        colorBgLayout: '#000000', // Deeper Slate-950
        colorBgBase: '#000000',
        colorBgElevated: '#2c2c2e', // Zinc-900
        colorBgSpotlight: '#3a3a3c', // Zinc-800

        // Typography
        colorText: '#ffffff', // Slate-50
        colorTextSecondary: '#8e8e93', // Slate-400
        colorTextTertiary: '#636366', // Slate-500
        colorTextQuaternary: '#48484a', // Slate-600

        // Borders - subtler
        colorBorder: '#3a3a3c',
        colorBorderSecondary: '#1c1c1e',

        // Design tokens - more compact
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

        // Spacing - more compact
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

        // Shadows
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        boxShadowSecondary: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    },
    algorithm: theme.darkAlgorithm,
    components: {
        Layout: {
            siderBg: '#1c1c1e',
            headerBg: '#1c1c1e',
            bodyBg: '#000000',
            headerPadding: '0 28px',
        },
        Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(94, 92, 230, 0.15)',
            darkItemHoverBg: 'rgba(94, 92, 230, 0.08)',
            itemBorderRadius: 12,
            itemMarginInline: 12,
            itemPaddingInline: 20,
            iconSize: 19,
            collapsedIconSize: 21,
        },
        Card: {
            colorBgContainer: '#1c1c1e',
            borderRadiusLG: 20,
            boxShadowTertiary: '0 4px 6px -1px rgb(0 0 0 / 0.2)',
            paddingLG: 28, // More compact padding
        },
        Table: {
            headerBg: '#2c2c2e',
            headerColor: '#8e8e93',
            rowHoverBg: '#3a3a3c',
            borderColor: '#3a3a3c',
            headerBorderRadius: 16,
            padding: 16, // Compact table
        },
        Button: {
            borderRadius: 12,
            borderRadiusLG: 16,
            borderRadiusSM: 10,
            paddingInline: 20,
            paddingInlineLG: 28,
            fontWeight: 500,
            primaryShadow: '0 4px 12px 0 rgba(94, 92, 230, 0.2)',
        },
        Input: {
            borderRadius: 12,
            paddingInline: 16,
            activeShadow: '0 0 0 2px rgba(94, 92, 230, 0.2)',
            colorBgContainer: '#000000',
        },
        Select: {
            borderRadius: 12,
            optionSelectedBg: 'rgba(94, 92, 230, 0.15)',
        },
        Tag: {
            borderRadiusSM: 10,
        },
        Badge: {
            dotSize: 9,
        },
        Tabs: {
            cardBg: '#000000',
            itemActiveColor: modernColors.colorPrimary,
            itemHoverColor: modernColors.colorPrimary,
            inkBarColor: modernColors.colorPrimary,
            horizontalItemPadding: '12px 8px',
        },
        Modal: {
            contentBg: '#1c1c1e',
            headerBg: '#1c1c1e',
            borderRadiusLG: 20,
        },
        Drawer: {
            colorBgElevated: '#1c1c1e',
            borderRadiusLG: 20,
        },
        Statistic: {
            contentFontSize: 30,
        },
        Tooltip: {
            colorBgSpotlight: '#2c2c2e',
        },
    },
};
