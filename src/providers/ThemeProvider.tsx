import React, { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import { useThemeStore } from '@/stores/useThemeStore';
import { lightTheme, darkTheme } from '@/theme';

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { mode, getResolvedTheme } = useThemeStore();
    const [resolvedTheme, setResolvedTheme] = useState(getResolvedTheme());

    useEffect(() => {
        // Update resolved theme when mode changes
        setResolvedTheme(getResolvedTheme());
    }, [mode, getResolvedTheme]);

    useEffect(() => {
        // Listen for system theme changes
        if (mode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                setResolvedTheme(getResolvedTheme());
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [mode, getResolvedTheme]);

    // Apply body background color and class for smooth theme transitions
    useEffect(() => {
        const theme = resolvedTheme === 'dark' ? darkTheme : lightTheme;
        document.body.style.backgroundColor = theme.token?.colorBgLayout || '#f0f2f5';
        document.body.style.transition = 'background-color 0.3s ease';

        if (resolvedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.classList.remove('dark-mode');
        }
    }, [resolvedTheme]);

    const currentTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

    return (
        <ConfigProvider theme={{ ...currentTheme, cssVar: true }}>
            {children}
        </ConfigProvider>
    );
};

export default ThemeProvider;
