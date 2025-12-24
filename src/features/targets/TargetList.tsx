import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { message, Alert, Space, Tag, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { StandardListLayout } from '@/components/layout/StandardListLayout';
import { useServerTable } from '@/hooks/useServerTable';
import {
    TargetTable,
    TargetSearchBar,
    DeleteTargetModal,
    TargetFormModal,
    AssignDSModal,
    BulkAssignTagsModal,
    BulkAssignTypeModal,
    BulkDeleteTargetModal,
    SavedFiltersModal,
} from './components';
import type { AssignPayload } from './components';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    useGetTargets,
    useDeleteTarget,
    useCreateTargets,
    usePostAssignedDistributionSet,
    getGetTargetsQueryKey,
} from '@/api/generated/targets/targets';
import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import type { MgmtTarget, MgmtDistributionSetAssignments, MgmtDistributionSetAssignment } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { useGetTargetTags } from '@/api/generated/target-tags/target-tags';
import { useGetTargetTypes } from '@/api/generated/target-types/target-types';
import { useGetFilters } from '@/api/generated/target-filter-queries/target-filter-queries';
import type { MgmtTag, MgmtTargetType, MgmtTargetFilterQuery } from '@/api/generated/model';

import { FilterOutlined } from '@ant-design/icons';

import { appendFilter, buildCondition } from '@/utils/fiql';

const { Text } = Typography;

// Styled components removed in favor of PageLayout


const TargetList: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const { t } = useTranslation('targets');

    // Use Shared Hook
    const {
        pagination,
        offset,
        sort,
        searchQuery,
        setSearchQuery,
        handleTableChange,
        handleSearch,
        resetPagination,
        setPagination,
    } = useServerTable<MgmtTarget>({ syncToUrl: true });

    // Additional Filters
    const [selectedTagName, setSelectedTagName] = useState<string | undefined>(undefined);
    const [selectedTypeName, setSelectedTypeName] = useState<string | undefined>(undefined);
    const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
    const [bulkTagsModalOpen, setBulkTagsModalOpen] = useState(false);
    const [bulkTypeModalOpen, setBulkTypeModalOpen] = useState(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);
    const [activeSavedFilter, setActiveSavedFilter] = useState<{ id?: number; name?: string; query: string } | null>(null);
    const [searchResetSignal, setSearchResetSignal] = useState(0);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const [tableScrollY, setTableScrollY] = useState<number | undefined>(undefined);

    // Modal States
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetToDelete, setTargetToDelete] = useState<MgmtTarget | null>(null);
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [targetToAssign, setTargetToAssign] = useState<MgmtTarget | null>(null);



    useLayoutEffect(() => {
        if (!tableContainerRef.current) {
            return;
        }
        const element = tableContainerRef.current;
        const updateHeight = () => {
            const height = element.getBoundingClientRect().height;
            const scrollHeight = Math.max(240, Math.floor(height - 100)); // Increased offset to account for quick filters
            setTableScrollY(scrollHeight);
        };
        updateHeight();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateHeight);
            return () => window.removeEventListener('resize', updateHeight);
        }
        const observer = new ResizeObserver(updateHeight);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // FR-06: Target Tags
    const { data: tagsData } = useGetTargetTags(
        { limit: 100 },
        { query: { staleTime: 60000 } }
    );

    // Get saved filters for Quick Access
    const { data: filtersData } = useGetFilters(
        { limit: 20 },
        { query: { staleTime: 60000 } }
    );
    const savedFilters = filtersData?.content || [];

    const handleFilterSelect = (filter: MgmtTargetFilterQuery) => {
        if (activeSavedFilter?.id === filter.id) {
            // Deselect
            setActiveSavedFilter(null);
            setSearchQuery('');
            setSearchResetSignal((prev) => prev + 1);
        } else {
            // Select
            setActiveSavedFilter({
                id: filter.id,
                name: filter.name,
                query: filter.query || '',
            });
            setSearchQuery(filter.query || '');
        }
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    // Get target types for filters
    const { data: typesData } = useGetTargetTypes(
        { limit: 100 },
        { query: { staleTime: 60000 } }
    );

    // Build search query combining manual search, tag filter, type filter
    const buildFinalQuery = useCallback(() => {
        let query = searchQuery;

        if (selectedTagName) {
            query = appendFilter(query, buildCondition({ field: 'tag.name', operator: '==', value: selectedTagName }));
        }
        if (selectedTypeName) {
            query = appendFilter(query, buildCondition({ field: 'targettype.name', operator: '==', value: selectedTypeName }));
        }
        // Return undefined if empty to avoid malformed query error
        return query?.trim() || undefined;
    }, [searchQuery, selectedTagName, selectedTypeName]);

    // API Queries
    const {
        data: targetsData,
        isLoading: targetsLoading,
        isFetching: targetsFetching,
        error: targetsError,
        refetch: refetchTargets,
    } = useGetTargets(
        {
            offset,
            limit: pagination.pageSize,
            sort: sort || undefined,
            q: buildFinalQuery(),
        },
        {
            query: {
                placeholderData: keepPreviousData,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
            },
        }
    );

    const { data: dsData, isLoading: dsLoading } = useGetDistributionSets(
        { limit: 100 },
        { query: { enabled: assignModalOpen } }
    );

    // Mutations
    const deleteTargetMutation = useDeleteTarget({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.deleteSuccess'));
                setDeleteModalOpen(false);
                setTargetToDelete(null);
                queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
            },
            onError: (error) => {
                const errMsg = (error as Error).message || t('messages.deleteFailed');
                if (errMsg.includes('409')) {
                    message.error(t('messages.conflict', { ns: 'common' }));
                } else {
                    message.error(errMsg);
                }
            },
        },
    });

    const createTargetMutation = useCreateTargets({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.createSuccess'));
                setFormModalOpen(false);
                queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
            },
            onError: (error) => {
                const errMsg = (error as Error).message || t('messages.createFailed');
                if (errMsg.includes('409')) {
                    message.error(t('messages.targetExists'));
                } else {
                    message.error(errMsg);
                }
            },
        },
    });

    const assignDSMutation = usePostAssignedDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.assignSuccess'));
                setAssignModalOpen(false);
                setTargetToAssign(null);
                queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.error', { ns: 'common' }));
            },
        },
    });

    // Handlers
    const handleSearchWrapper = useCallback((query: string) => {
        handleSearch(query);
        setActiveSavedFilter(null);
    }, [handleSearch]);

    const handleViewTarget = useCallback(
        (target: MgmtTarget) => {
            navigate(`/targets/${target.controllerId}`);
        },
        [navigate]
    );

    const handleDeleteClick = useCallback((target: MgmtTarget) => {
        setTargetToDelete(target);
        setDeleteModalOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (targetToDelete?.controllerId) {
            deleteTargetMutation.mutate({ targetId: targetToDelete.controllerId });
        }
    }, [targetToDelete, deleteTargetMutation]);

    const handleAddTarget = useCallback(() => {
        setFormModalOpen(true);
    }, []);

    const handleCreateTarget = useCallback(
        (values: { controllerId?: string; name?: string; description?: string }) => {
            if (values.controllerId) {
                createTargetMutation.mutate({
                    data: [
                        {
                            controllerId: values.controllerId,
                            name: values.name || values.controllerId, // name is required, default to controllerId
                            description: values.description,
                        },
                    ],
                });
            }
        },
        [createTargetMutation]
    );

    const handleAssignDS = useCallback(
        (payload: AssignPayload) => {
            if (targetToAssign?.controllerId) {
                const assignment: MgmtDistributionSetAssignment = {
                    id: payload.dsId,
                    type: payload.type as MgmtDistributionSetAssignment['type'],
                    confirmationRequired: payload.confirmationRequired,
                    weight: payload.weight,
                    forcetime: payload.forcetime,
                    maintenanceWindow: payload.maintenanceWindow,
                };
                assignDSMutation.mutate({
                    targetId: targetToAssign.controllerId,
                    data: [assignment] as MgmtDistributionSetAssignments,
                });
            }
        },
        [targetToAssign, assignDSMutation]
    );

    if (targetsError) {
        return (
            <Alert
                type="error"
                message={t('messages.loadFailed')}
                description={(targetsError as Error).message}
                showIcon
            />
        );
    }

    return (
        <StandardListLayout
            title={t('title')}
            searchBar={
                <TargetSearchBar
                    onSearch={handleSearchWrapper}
                    onRefresh={() => refetchTargets()}
                    onAddTarget={handleAddTarget}
                    canAddTarget={isAdmin}
                    loading={targetsLoading || targetsFetching}
                    onOpenSavedFilters={() => setSavedFiltersOpen(true)}
                    resetSignal={searchResetSignal}
                />
            }
            bulkActionBar={(activeSavedFilter || searchQuery || selectedTagName || selectedTypeName || selectedTargetIds.length > 0) && (
                <div style={{ marginBottom: 16 }}>
                    {(activeSavedFilter || searchQuery || selectedTagName || selectedTypeName) && (
                        <Space style={{ marginBottom: selectedTargetIds.length > 0 ? 16 : 0 }} wrap>
                            {activeSavedFilter && (
                                <Tag
                                    color="blue"
                                    closable
                                    onClose={() => {
                                        setActiveSavedFilter(null);
                                        setSearchQuery('');
                                        setPagination((prev) => ({ ...prev, current: 1 }));
                                        setSearchResetSignal((prev) => prev + 1);
                                    }}
                                >
                                    {t('filters.savedFilter', { name: activeSavedFilter.name || activeSavedFilter.query })}
                                </Tag>
                            )}
                            {!activeSavedFilter && searchQuery && (
                                <Tooltip title={searchQuery}>
                                    <Tag
                                        color="blue"
                                        closable
                                        onClose={() => {
                                            setSearchQuery('');
                                            setPagination((prev) => ({ ...prev, current: 1 }));
                                            setSearchResetSignal((prev) => prev + 1);
                                        }}
                                    >
                                        {t('filters.query')}
                                    </Tag>
                                </Tooltip>
                            )}
                            {selectedTagName && (
                                <Tag
                                    color="gold"
                                    closable
                                    onClose={() => {
                                        setSelectedTagName(undefined);
                                        setPagination((prev) => ({ ...prev, current: 1 }));
                                    }}
                                >
                                    {t('filters.tag', { name: selectedTagName })}
                                </Tag>
                            )}
                            {selectedTypeName && (
                                <Tag
                                    color="purple"
                                    closable
                                    onClose={() => {
                                        setSelectedTypeName(undefined);
                                        setPagination((prev) => ({ ...prev, current: 1 }));
                                    }}
                                >
                                    {t('filters.type', { name: selectedTypeName })}
                                </Tag>
                            )}
                            <Button
                                size="small"
                                onClick={() => {
                                    setActiveSavedFilter(null);
                                    setSearchQuery('');
                                    setSelectedTagName(undefined);
                                    setSelectedTypeName(undefined);
                                    setPagination((prev) => ({ ...prev, current: 1 }));
                                    setSearchResetSignal((prev) => prev + 1);
                                }}
                            >
                                {t('filters.clearAll')}
                            </Button>
                        </Space>
                    )}

                    {selectedTargetIds.length > 0 && (
                        <Space wrap>
                            <span style={{ marginRight: 8 }}>
                                {t('bulkAssign.selectedCount', { count: selectedTargetIds.length })}
                            </span>
                            <Button onClick={() => setBulkTagsModalOpen(true)}>
                                {t('bulkAssign.assignTag')}
                            </Button>
                            <Button onClick={() => setBulkTypeModalOpen(true)}>
                                {t('bulkAssign.assignType')}
                            </Button>
                            <Button danger onClick={() => setBulkDeleteModalOpen(true)}>
                                {t('bulkDelete.button', { defaultValue: 'Delete' })}
                            </Button>
                        </Space>
                    )}
                </div>
            )}
        >
            <div ref={tableContainerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Saved Filters Quick Access */}
                <div style={{ padding: '8px 2px', marginBottom: 8, flexShrink: 0 }}>
                    <Space wrap size={[8, 8]}>
                        <Text type="secondary" style={{ fontSize: 13, marginRight: 4 }}>
                            {t('quickFilters')}:
                        </Text>
                        {savedFilters.slice(0, 5).map(filter => (
                            <Tag.CheckableTag
                                key={filter.id}
                                checked={activeSavedFilter?.id === filter.id}
                                onChange={() => handleFilterSelect(filter)}
                                style={{
                                    border: '1px solid var(--ant-color-border, #d9d9d9)',
                                    padding: '2px 8px',
                                    fontSize: 13
                                }}
                            >
                                {filter.name}
                            </Tag.CheckableTag>
                        ))}
                        <Button
                            type="link"
                            size="small"
                            icon={<FilterOutlined />}
                            onClick={() => setSavedFiltersOpen(true)}
                            style={{ padding: 0, marginLeft: 8 }}
                        >
                            {t('manageFilters')}
                        </Button>
                    </Space>
                </div>

                <TargetTable
                    data={targetsData?.content || []}
                    loading={targetsLoading || targetsFetching}
                    total={targetsData?.total || 0}
                    pagination={pagination}
                    scrollY={tableScrollY}
                    onChange={handleTableChange}
                    onPaginationChange={() => { }} // Handled by onChange
                    onSortChange={() => { }} // Handled by onChange
                    onView={handleViewTarget}
                    onDelete={handleDeleteClick}
                    canDelete={isAdmin}
                    rowSelection={{
                        selectedRowKeys: selectedTargetIds,
                        onChange: (keys: React.Key[]) => setSelectedTargetIds(keys as string[]),
                    }}
                    availableTags={(tagsData?.content as MgmtTag[]) || []}
                    availableTypes={(typesData?.content as MgmtTargetType[]) || []}
                    filters={{ tagName: selectedTagName, typeName: selectedTypeName }}
                    onFilterChange={(filters) => {
                        setSelectedTagName(filters.tagName);
                        setSelectedTypeName(filters.typeName);
                        resetPagination();
                    }}
                />
            </div>

            <BulkAssignTagsModal
                open={bulkTagsModalOpen}
                targetIds={selectedTargetIds}
                onCancel={() => setBulkTagsModalOpen(false)}
                onSuccess={() => {
                    setBulkTagsModalOpen(false);
                    setSelectedTargetIds([]); // Clear selection after success
                    queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
                }}
            />

            <BulkAssignTypeModal
                open={bulkTypeModalOpen}
                targetIds={selectedTargetIds}
                onCancel={() => setBulkTypeModalOpen(false)}
                onSuccess={() => {
                    setBulkTypeModalOpen(false);
                    setSelectedTargetIds([]); // Clear selection after success
                    queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
                }}
            />

            <BulkDeleteTargetModal
                open={bulkDeleteModalOpen}
                targetIds={selectedTargetIds}
                onCancel={() => setBulkDeleteModalOpen(false)}
                onSuccess={() => {
                    setBulkDeleteModalOpen(false);
                    setSelectedTargetIds([]);
                    queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
                }}
            />

            {/* Delete Modal */}
            <DeleteTargetModal
                open={deleteModalOpen}
                target={targetToDelete}
                loading={deleteTargetMutation.isPending}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setTargetToDelete(null);
                }}
            />

            {/* Create Target Modal */}
            <TargetFormModal
                open={formModalOpen}
                mode="create"
                loading={createTargetMutation.isPending}
                onSubmit={handleCreateTarget}
                onCancel={() => setFormModalOpen(false)}
            />

            {/* Assign DS Modal */}
            <AssignDSModal
                open={assignModalOpen}
                targetId={targetToAssign?.controllerId ?? ''}
                distributionSets={dsData?.content || []}
                loading={assignDSMutation.isPending}
                dsLoading={dsLoading}
                canForced={isAdmin}
                onConfirm={handleAssignDS}
                onCancel={() => {
                    setAssignModalOpen(false);
                    setTargetToAssign(null);
                }}
            />

            <SavedFiltersModal
                open={savedFiltersOpen}
                canEdit={isAdmin}
                onApply={(filter) => {
                    setSearchQuery(filter.query || '');
                    setActiveSavedFilter({
                        id: filter.id,
                        name: filter.name,
                        query: filter.query || '',
                    });
                    setPagination((prev) => ({ ...prev, current: 1 }));
                    setSearchResetSignal((prev) => prev + 1);
                    setSavedFiltersOpen(false);
                }}
                onClose={() => setSavedFiltersOpen(false)}
            />
        </StandardListLayout>
    );
};

export default TargetList;
