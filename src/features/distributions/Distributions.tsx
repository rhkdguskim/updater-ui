import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DistributionSetList from './DistributionSetList';
import SoftwareModuleList from './SoftwareModuleList';
import SoftwareModuleDetail from './SoftwareModuleDetail';
import DistributionSetDetail from './DistributionSetDetail';
import DistributionBulkAssign from './DistributionBulkAssign';
import DistributionsOverview from './DistributionsOverview';


const Distributions: React.FC = () => {
    return (
        <Routes>
            <Route index element={<DistributionsOverview />} />
            <Route path="sets" element={<DistributionSetList />} />
            <Route path="modules" element={<SoftwareModuleList />} />
            <Route path="sets/bulk-assign" element={<DistributionBulkAssign />} />
            <Route path="sets/:id" element={<DistributionSetDetail />} />
            <Route path="modules/:id" element={<SoftwareModuleDetail />} />
        </Routes>
    );
};

export default Distributions;

