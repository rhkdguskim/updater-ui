import { useState, useCallback, useEffect } from 'react';
import type { TableProps } from 'antd';
import type { SorterResult, TablePaginationConfig, FilterValue } from 'antd/es/table/interface';
import { useSearchParams } from 'react-router-dom';

interface UseServerTableProps {
    defaultPageSize?: number;
    defaultSort?: string;
    syncToUrl?: boolean;
}

interface PaginationState {
    current: number;
    pageSize: number;
}

export function useServerTable<T>({
    defaultPageSize = 10,
    syncToUrl = false,
}: UseServerTableProps = {}) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state from URL if enabled
    const [pagination, setPagination] = useState<PaginationState>(() => {
        if (syncToUrl) {
            const page = parseInt(searchParams.get('page') || '1', 10);
            const size = parseInt(searchParams.get('size') || String(defaultPageSize), 10);
            return { current: page, pageSize: size };
        }
        return { current: 1, pageSize: defaultPageSize };
    });

    const [sort, setSort] = useState<string>(() => {
        if (syncToUrl) {
            return searchParams.get('sort') || '';
        }
        return '';
    });

    const [searchQuery, setSearchQuery] = useState<string>(() => {
        if (syncToUrl) {
            return searchParams.get('q') || '';
        }
        return '';
    });

    // Sync state to URL
    useEffect(() => {
        if (!syncToUrl) return;

        const newParams = new URLSearchParams(searchParams);

        if (pagination.current !== 1) newParams.set('page', String(pagination.current));
        else newParams.delete('page');

        if (pagination.pageSize !== defaultPageSize) newParams.set('size', String(pagination.pageSize));
        else newParams.delete('size');

        if (sort) newParams.set('sort', sort);
        else newParams.delete('sort');

        if (searchQuery) newParams.set('q', searchQuery);
        else newParams.delete('q');

        setSearchParams(newParams, { replace: true });
    }, [pagination, sort, searchQuery, syncToUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    const offset = (pagination.current - 1) * pagination.pageSize;

    const handleTableChange: TableProps<T>['onChange'] = useCallback((
        newPagination: TablePaginationConfig,
        _filters: Record<string, FilterValue | null>,
        sorter: SorterResult<T> | SorterResult<T>[]
    ) => {
        setPagination((prev) => ({
            ...prev,
            current: newPagination.current || 1,
            pageSize: newPagination.pageSize || prev.pageSize,
        }));

        if (Array.isArray(sorter)) {
            // Handle multiple sorters not implemented for this simple hook yet
        } else if (sorter.field && sorter.order) {
            const field = sorter.field as string;
            const order = sorter.order === 'ascend' ? 'ASC' : 'DESC';
            setSort(`${field}:${order}`);
        } else {
            setSort('');
        }
    }, []);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, []);

    // Helper to reset pagination when external filters change
    const resetPagination = useCallback(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, []);

    return {
        pagination,
        offset,
        sort,
        searchQuery,
        setSearchQuery,
        handleTableChange,
        handleSearch,
        resetPagination,
        setPagination,
    };
}
