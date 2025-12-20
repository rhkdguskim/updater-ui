import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Typography, Tabs } from 'antd';
import styled from 'styled-components';
import DistributionSetList from './DistributionSetList';
import SoftwareModuleList from './SoftwareModuleList';
import SoftwareModuleDetail from './SoftwareModuleDetail';
import DistributionSetDetail from './DistributionSetDetail';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
`;


const Distributions: React.FC = () => {
    const { t } = useTranslation('distributions');
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sets');

    // Update active tab based on URL
    useEffect(() => {
        if (location.pathname.includes('/distributions/modules')) {
            setActiveTab('modules');
        } else {
            setActiveTab('sets');
        }
    }, [location]);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        navigate(`/distributions/${key}`);
    };

    return (
        <PageContainer>
            <HeaderRow>
                <Title level={2} style={{ margin: 0 }}>
                    {t('pageTitle')}
                </Title>
            </HeaderRow>

            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                items={[
                    {
                        key: 'sets',
                        label: t('tabs.sets'),
                    },
                    {
                        key: 'modules',
                        label: t('tabs.modules'),
                    },
                ]}
            />

            <Routes>
                <Route index element={<Navigate to="sets" replace />} />
                <Route path="sets" element={<DistributionSetList />} />
                <Route path="modules" element={<SoftwareModuleList />} />
                {/* Details routes will be added in Phase 2 */}
                <Route path="sets/:id" element={<DistributionSetDetail />} />
                <Route path="modules/:id" element={<SoftwareModuleDetail />} />
                <Route path="*" element={<Navigate to="sets" replace />} />
            </Routes>
        </PageContainer>
    );
};

export default Distributions;
