/**
 * Target List Filter State Hook
 * 
 * Manages filter-related state for the target list, including
 * tag filters, type filters, and saved filter queries.
 */

import { useState, useCallback } from 'react';
import type { MgmtTargetFilterQuery } from '@/api/generated/model';
import { appendFilter, buildCondition } from '@/utils/fiql';

export interface TargetFilters {
    tagName?: string;
    typeName?: string;
    savedFilter: { id?: number; name?: string; query: string } | null;
}

export interface UseTargetFiltersOptions {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    resetPagination: () => void;
}

export interface UseTargetFiltersReturn {
    filters: TargetFilters;
    setTagFilter: (tagName: string | undefined) => void;
    setTypeFilter: (typeName: string | undefined) => void;
    selectSavedFilter: (filter: MgmtTargetFilterQuery) => void;
    clearAllFilters: () => void;
    buildFinalQuery: () => string | undefined;
    searchResetSignal: number;
}

export const useTargetFilters = ({
    searchQuery,
    setSearchQuery,
    resetPagination,
}: UseTargetFiltersOptions): UseTargetFiltersReturn => {
    const [tagName, setTagName] = useState<string | undefined>(undefined);
    const [typeName, setTypeName] = useState<string | undefined>(undefined);
    const [savedFilter, setSavedFilter] = useState<TargetFilters['savedFilter']>(null);
    const [searchResetSignal, setSearchResetSignal] = useState(0);

    const setTagFilter = useCallback((name: string | undefined) => {
        setTagName(name);
        resetPagination();
    }, [resetPagination]);

    const setTypeFilter = useCallback((name: string | undefined) => {
        setTypeName(name);
        resetPagination();
    }, [resetPagination]);

    const selectSavedFilter = useCallback((filter: MgmtTargetFilterQuery) => {
        if (savedFilter?.id === filter.id) {
            // Deselect
            setSavedFilter(null);
            setSearchQuery('');
            setSearchResetSignal((prev) => prev + 1);
        } else {
            // Select
            setSavedFilter({
                id: filter.id,
                name: filter.name,
                query: filter.query || '',
            });
            setSearchQuery(filter.query || '');
        }
        resetPagination();
    }, [savedFilter, setSearchQuery, resetPagination]);

    const clearAllFilters = useCallback(() => {
        setSavedFilter(null);
        setSearchQuery('');
        setTagName(undefined);
        setTypeName(undefined);
        setSearchResetSignal((prev) => prev + 1);
        resetPagination();
    }, [setSearchQuery, resetPagination]);

    const buildFinalQuery = useCallback(() => {
        let query = searchQuery;

        if (tagName) {
            query = appendFilter(query, buildCondition({ field: 'tag.name', operator: '==', value: tagName }));
        }
        if (typeName) {
            query = appendFilter(query, buildCondition({ field: 'targettype.name', operator: '==', value: typeName }));
        }

        return query?.trim() || undefined;
    }, [searchQuery, tagName, typeName]);

    return {
        filters: { tagName, typeName, savedFilter },
        setTagFilter,
        setTypeFilter,
        selectSavedFilter,
        clearAllFilters,
        buildFinalQuery,
        searchResetSignal,
    };
};
