/**
 * App Providers
 * 
 * Combines all providers into a single component for clean composition.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';

interface AppProvidersProps {
    children: React.ReactNode;
}

/**
 * Combines all application providers in the correct order.
 * Provider order (outer to inner):
 * 1. QueryProvider - React Query client
 * 2. ThemeProvider - Ant Design theming
 * 3. AntdApp - Ant Design app context
 * 4. BrowserRouter - React Router
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    return (
        <QueryProvider>
            <ThemeProvider>
                <AntdApp>
                    <BrowserRouter>
                        {children}
                    </BrowserRouter>
                </AntdApp>
            </ThemeProvider>
        </QueryProvider>
    );
};

export default AppProviders;
