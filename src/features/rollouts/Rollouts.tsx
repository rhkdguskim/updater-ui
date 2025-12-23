import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RolloutList from './RolloutList';
import RolloutDetail from './RolloutDetail';
import RolloutsOverview from './RolloutsOverview';

const Rollouts: React.FC = () => {
    return (
        <Routes>
            <Route index element={<RolloutsOverview />} />
            <Route path="list" element={<RolloutList />} />
            <Route path=":rolloutId" element={<RolloutDetail />} />
        </Routes>
    );
};

export default Rollouts;


