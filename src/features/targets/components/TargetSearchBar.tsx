import React, { useState } from 'react';
import { Input, Space, Button, Select, Tooltip } from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined,
    FilterOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { buildWildcardSearch } from '@/utils/fiql';

const { Search } = Input;

const SearchContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
`;

const SearchGroup = styled(Space)`
    flex: 1;
    min-width: 300px;
`;

const ActionGroup = styled(Space)`
    flex-shrink: 0;
`;

interface TargetSearchBarProps {
    onSearch: (query: string) => void;
    onRefresh: () => void;
    onAddTarget: () => void;
    canAddTarget: boolean;
    loading?: boolean;
}

type SearchField = 'name' | 'description';

const TargetSearchBar: React.FC<TargetSearchBarProps> = ({
    onSearch,
    onRefresh,
    onAddTarget,
    canAddTarget,
    loading,
}) => {
    const { t } = useTranslation('targets');
    const [searchField, setSearchField] = useState<SearchField>('name');
    const [searchValue, setSearchValue] = useState('');

    const searchFieldOptions = [
        { value: 'name', label: t('search.fields.name') },
        { value: 'description', label: t('search.fields.description') },
    ];

    const handleSearch = (value: string) => {
        setSearchValue(value);
        // Use centralized FIQL utility
        const query = buildWildcardSearch(searchField, value);
        onSearch(query);
    };

    const handleClear = () => {
        setSearchValue('');
        onSearch('');
    };

    return (
        <SearchContainer>
            <SearchGroup>
                <Select
                    value={searchField}
                    onChange={setSearchField}
                    options={searchFieldOptions}
                    style={{ width: 140 }}
                    suffixIcon={<FilterOutlined />}
                />
                <Search
                    placeholder={t('search.placeholder', { field: searchFieldOptions.find(o => o.value === searchField)?.label })}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onSearch={handleSearch}
                    allowClear
                    onClear={handleClear}
                    enterButton={<SearchOutlined />}
                    style={{ maxWidth: 400 }}
                    loading={loading}
                />
            </SearchGroup>

            <ActionGroup>
                <Tooltip title={t('actions.refresh')}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={onRefresh}
                        loading={loading}
                    />
                </Tooltip>
                {canAddTarget && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onAddTarget}
                    >
                        {t('list.addTarget')}
                    </Button>
                )}
            </ActionGroup>
        </SearchContainer>
    );
};

export default TargetSearchBar;
