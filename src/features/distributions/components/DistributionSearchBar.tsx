import React, { useState } from 'react';
import { Input, Button, Space, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';

interface DistributionSearchBarProps {
    onSearch: (query: string) => void;
    onRefresh: () => void;
    onAdd?: () => void;
    loading?: boolean;
    canAdd?: boolean;
    placeholder?: string;
    type?: 'set' | 'module';
}

import { useTranslation } from 'react-i18next';

const DistributionSearchBar: React.FC<DistributionSearchBarProps> = ({
    onSearch,
    onRefresh,
    onAdd,
    loading = false,
    canAdd = false,
    placeholder,
    type = 'set',
}) => {
    const { t } = useTranslation('distributions');
    const [searchText, setSearchText] = useState('');
    const [searchField, setSearchField] = useState('name');

    // Default placeholder handling if not provided
    const displayPlaceholder = placeholder || t('list.searchPlaceholder', { field: t(`list.searchFields.${searchField}`) });

    const handleSearch = () => {
        if (!searchText.trim()) {
            onSearch('');
            return;
        }

        // Simple FIQL construction
        const query = `${searchField}==*${searchText}*`;
        onSearch(query);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
                <Select
                    defaultValue="name"
                    options={[
                        { value: 'name', label: t('list.searchFields.name') },
                        { value: 'version', label: t('list.searchFields.version') },
                        { value: 'description', label: t('list.searchFields.description') },
                    ]}
                    onChange={setSearchField}
                    style={{ width: 120 }}
                />
                <Input
                    placeholder={displayPlaceholder}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ width: 300 }}
                    allowClear
                    prefix={<SearchOutlined />}
                />
                <Button type="primary" onClick={handleSearch} loading={loading}>
                    {t('list.search')}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                    {t('list.refresh')}
                </Button>
            </Space>

            {canAdd && onAdd && (
                <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                    {type === 'set' ? t('list.addSet') : t('list.addModule')}
                </Button>
            )}
        </div>
    );
};

export default DistributionSearchBar;
