import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ActionsOverview from './ActionsOverview';
import ActionList from './ActionList';
import ActionDetail from './ActionDetail';

const Actions: React.FC = () => {
    return (
        <Routes>
            <Route index element={<ActionsOverview />} />
            <Route path="list" element={<ActionList />} />
            <Route path=":actionId" element={<ActionDetail />} />
        </Routes>
    );
};

export default Actions;
