import React, { useEffect, useRef, useState } from 'react';
import { Input, Select, Button, Tooltip, Space } from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    ReloadOutlined,
    FilterOutlined,
    BookOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { buildWildcardSearch } from '@/utils/fiql';
import { FilterBar } from '@/components/patterns';

const { Search } = Input;

interface TargetSearchBarProps {
    onSearch: (query: string) => void;
    onRefresh: () => void;
    onAddTarget: () => void;
    canAddTarget: boolean;
    loading?: boolean;
    onOpenSavedFilters?: () => void;
    resetSignal?: number;
}

type SearchField = 'name' | 'description' | 'controllerId';

const TargetSearchBar: React.FC<TargetSearchBarProps> = ({
    onSearch,
    onRefresh,
    onAddTarget,
    canAddTarget,
    loading,
    onOpenSavedFilters,
    resetSignal,
}) => {
    const { t } = useTranslation('targets');
    const [searchField, setSearchField] = useState<SearchField>('name');
    const [searchValue, setSearchValue] = useState('');
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const [fiqlQuery, setFiqlQuery] = useState('');

    const manualSearchRef = useRef(false);
    const debounceRef = useRef<number | undefined>(undefined);

    const searchFieldOptions = [
        { value: 'name', label: t('search.fields.name') },
        { value: 'description', label: t('search.fields.description') },
        { value: 'controllerId', label: t('search.fields.controllerId') },
    ];

    useEffect(() => {
        if (resetSignal === undefined) {
            return;
        }
        setSearchValue('');
        if (!isAdvancedMode) {
            setSearchField('name');
        }
    }, [resetSignal, isAdvancedMode]);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        const query = buildWildcardSearch(searchField, value);
        manualSearchRef.current = true;
        onSearch(query);
    };

    const handleAdvancedSearch = (value: string) => {
        setFiqlQuery(value);
        manualSearchRef.current = true;
        onSearch(value);
    };

    const handleClear = () => {
        setSearchValue('');
        setFiqlQuery('');
        onSearch('');
    };

    useEffect(() => {
        if (manualSearchRef.current) {
            manualSearchRef.current = false;
            return;
        }

        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            if (isAdvancedMode) {
                onSearch(fiqlQuery);
            } else {
                const query = buildWildcardSearch(searchField, searchValue);
                onSearch(query);
            }
        }, 400);

        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
        };
    }, [searchField, searchValue, fiqlQuery, isAdvancedMode, onSearch]);

    return (
        <FilterBar
            extra={
                <Space size="small">
                    {onOpenSavedFilters && (
                        <Tooltip title={t('list.savedFilters')}>
                            <Button icon={<BookOutlined />} onClick={onOpenSavedFilters} />
                        </Tooltip>
                    )}
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
                </Space>
            }
        >
            <Space size="small">
                <Tooltip title={isAdvancedMode ? t('search.switchToSimple') : t('search.switchToAdvanced')}>
                    <Button
                        icon={isAdvancedMode ? <SearchOutlined /> : <FilterOutlined />}
                        onClick={() => {
                            setIsAdvancedMode(!isAdvancedMode);
                            handleClear();
                        }}
                    />
                </Tooltip>
                {!isAdvancedMode ? (
                    <>
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
                            onSearch={handleSearch}
                            allowClear
                            onClear={handleClear}
                            enterButton={<SearchOutlined />}
                            style={{ width: 300 }}
                            loading={loading}
                        />
                    </>
                ) : (
                    <Input.Search
                        placeholder="FIQL Query (e.g. name==*test*;status==online)"
                        value={fiqlQuery}
                        onChange={(e) => setFiqlQuery(e.target.value)}
                        onSearch={handleAdvancedSearch}
                        allowClear
                        onClear={handleClear}
                        enterButton={<SearchOutlined />}
                        style={{ width: 450 }}
                        loading={loading}
                        prefix={<span style={{ color: '#aaa', fontSize: 12, marginRight: 4 }}>FIQL:</span>}
                    />
                )}
            </Space>
        </FilterBar>
    );
};

export default TargetSearchBar;
