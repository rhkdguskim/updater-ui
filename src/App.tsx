import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/features/dashboard/Dashboard';
import Targets from '@/features/targets/Targets';
import Distributions from '@/features/distributions/Distributions';
import Actions from '@/features/actions/Actions';
import Rollouts from '@/features/rollouts/Rollouts';
import OperationsDashboard from '@/features/jobs/OperationsDashboard';
import Configuration from '@/features/system/Configuration';
import LoginPage from '@/features/auth/LoginPage';
import AuthGuard from '@/features/auth/AuthGuard';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<AuthGuard />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="targets/*" element={<Targets />} />
          <Route path="distributions/*" element={<Distributions />} />
          <Route path="actions/*" element={<Actions />} />
          <Route path="rollouts/*" element={<Rollouts />} />
          <Route path="jobs" element={<OperationsDashboard />} />
          <Route path="system/config" element={<Configuration />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
