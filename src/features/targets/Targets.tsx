import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TargetList from './TargetList';
import TargetDetail from './TargetDetail';
import TargetsOverview from './TargetsOverview';


const Targets: React.FC = () => {
    return (
        <Routes>
            <Route index element={<TargetsOverview />} />
            <Route path="list" element={<TargetList />} />
            <Route path=":id" element={<TargetDetail />} />
            <Route path="*" element={<Navigate to="/targets" replace />} />
        </Routes>
    );
};

export default Targets;

