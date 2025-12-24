import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { buildWildcardSearch } from '@/utils/fiql';
import { SearchLayout } from '@/components/common';

interface ActionSearchBarProps {
    onSearch: (query: string) => void;
    onRefresh: () => void;
    loading?: boolean;
}

const ActionSearchBar: React.FC<ActionSearchBarProps> = ({
    onSearch,
    onRefresh,
    loading = false,
}) => {
    const { t } = useTranslation('actions');
    const [searchText, setSearchText] = useState('');

    // Currently Actions mainly support searching by Target Name (via target.name==*foo*)
    // We could expand this to include Type or Status if needed, but Status is usually a filter.

    const handleSearch = () => {
        if (!searchText.trim()) {
            onSearch('');
            return;
        }

        // Default to searching by target name 
        const query = buildWildcardSearch('target.name', searchText);
        onSearch(query);
    };


    return (
        <SearchLayout
            searchContent={
                <Input.Search
                    placeholder={t('filter.searchPlaceholder', { defaultValue: 'Search Target Name' })}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onSearch={handleSearch}
                    style={{ width: 400 }}
                    allowClear
                    enterButton={t('filter.search', { defaultValue: 'Search' })}
                    loading={loading}
                />
            }
            actionContent={
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                    {t('refresh', { defaultValue: 'Refresh' })}
                </Button>
            }
        />
    );
};

export default ActionSearchBar;
