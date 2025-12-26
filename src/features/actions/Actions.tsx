import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ActionList from './ActionList';
import ActionDetail from './ActionDetail';

const Actions: React.FC = () => {
    return (
        <Routes>
            <Route index element={<ActionList />} />
            <Route path=":actionId" element={<ActionDetail />} />
        </Routes>
    );
};

export default Actions;
