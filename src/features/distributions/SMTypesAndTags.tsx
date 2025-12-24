import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageLayout, PageHeader } from '@/components/patterns';

// Import type management component
import { SoftwareModuleTypeList } from './types';

const SMTypesAndTags: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const [activeTab, setActiveTab] = useState('types');

    const tabItems = [
        {
            key: 'types',
            label: (
                <span>
                    <AppstoreOutlined />
                    {t('smTypes.title')}
                </span>
            ),
            children: <SoftwareModuleTypeList />,
        },
    ];

    return (
        <PageLayout>
            <PageHeader title={t('smTypesAndTags.title')} />
            <Card>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="large"
                />
            </Card>
        </PageLayout>
    );
};

export default SMTypesAndTags;
