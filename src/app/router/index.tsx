/**
 * App Router Configuration
 * 
 * Centralized routing configuration for the application.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/components/layout/MainLayout';
import { ROUTES } from './routes';

// Lazy load feature components for code splitting
const Dashboard = React.lazy(() => import('@/features/dashboard/Dashboard'));
const Targets = React.lazy(() => import('@/features/targets/Targets'));
const Distributions = React.lazy(() => import('@/features/distributions/Distributions'));
const Actions = React.lazy(() => import('@/features/actions/Actions'));
const Rollouts = React.lazy(() => import('@/features/rollouts/Rollouts'));

const Configuration = React.lazy(() => import('@/features/system/Configuration'));
const LoginPage = React.lazy(() => import('@/features/auth/LoginPage'));
const AuthGuard = React.lazy(() => import('@/features/auth/AuthGuard'));

// Global loading fallback component
const GlobalLoadingFallback: React.FC = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--ant-color-bg-layout, #f5f5f5)',
    }}>
        <Spin size="large" />
    </div>
);

const AppRouter: React.FC = () => {
    return (
        <React.Suspense fallback={<GlobalLoadingFallback />}>
            <Routes>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />

                {/* Protected Routes */}
                <Route element={<AuthGuard />}>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="targets/*" element={<Targets />} />
                        <Route path="distributions/*" element={<Distributions />} />
                        <Route path="actions/*" element={<Actions />} />
                        <Route path="rollouts/*" element={<Rollouts />} />

                        <Route path="system/config" element={<Configuration />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </React.Suspense>
    );
};

export default AppRouter;
export { ROUTES };

