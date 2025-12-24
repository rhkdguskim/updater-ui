import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { TagOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageLayout, PageHeader } from '@/components/patterns';

// Import tag and type management components
import { DistributionSetTypeList } from './types';
import { DistributionSetTagList } from './tags';

const DSTypesAndTags: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const [activeTab, setActiveTab] = useState('types');

    const tabItems = [
        {
            key: 'types',
            label: (
                <span>
                    <AppstoreOutlined />
                    {t('dsTypes.title')}
                </span>
            ),
            children: <DistributionSetTypeList />,
        },
        {
            key: 'tags',
            label: (
                <span>
                    <TagOutlined />
                    {t('dsTags.title')}
                </span>
            ),
            children: <DistributionSetTagList />,
        },
    ];

    return (
        <PageLayout>
            <PageHeader title={t('dsTypesAndTags.title')} />
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

export default DSTypesAndTags;
