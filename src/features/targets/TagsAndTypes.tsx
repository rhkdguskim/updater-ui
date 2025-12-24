import React, { useState } from 'react';
import { TagOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// Import tag and type management components
import { TargetTagList } from './tags';
import { TargetTypeList } from './types';

import { PageLayout, PageHeader } from '@/components/patterns';

const TagsAndTypes: React.FC = () => {
    const { t } = useTranslation(['targets', 'common']);
    const [activeTab, setActiveTab] = useState('tags');

    const tabItems = [
        {
            key: 'tags',
            label: (
                <span>
                    <TagOutlined />
                    {t('tagManagement.title')}
                </span>
            ),
            children: <TargetTagList />,
        },
        {
            key: 'types',
            label: (
                <span>
                    <AppstoreOutlined />
                    {t('typeManagement.title')}
                </span>
            ),
            children: <TargetTypeList />,
        },
    ];

    return (
        <PageLayout>
            <PageHeader title={t('tagsAndTypes.title')} />
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

export default TagsAndTypes;
