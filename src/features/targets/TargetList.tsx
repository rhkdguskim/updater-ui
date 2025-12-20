import React, { useState, useCallback } from 'react';
import { Typography, Card, message, Alert, Select, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    TargetTable,
    TargetSearchBar,
    DeleteTargetModal,
    TargetFormModal,
    AssignDSModal,
} from './components';
import type { AssignType } from './components';
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
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { useGetTargetTags } from '@/api/generated/target-tags/target-tags';
import { useGetFilters } from '@/api/generated/target-filter-queries/target-filter-queries';
import type { MgmtTag, MgmtTargetFilterQuery } from '@/api/generated/model';

const { Title } = Typography;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
`;

const TargetList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const { t } = useTranslation('targets');

    // Pagination & Sorting State
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
    const [sort, setSort] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>(() => {
        const params = new URLSearchParams(location.search);
        return params.get('q') || '';
    });
    const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined);
    const [selectedFilterId, setSelectedFilterId] = useState<number | undefined>(undefined);

    // Modal States
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetToDelete, setTargetToDelete] = useState<MgmtTarget | null>(null);
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [targetToAssign, setTargetToAssign] = useState<MgmtTarget | null>(null);

    // Sync URL query param to state
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('q');
        if (q !== null && q !== searchQuery) {
            setSearchQuery(q);
        }
    }, [location.search]);

    // Calculate offset for API
    const offset = (pagination.current - 1) * pagination.pageSize;

    // FR-06: Target Tags
    const { data: tagsData } = useGetTargetTags({ limit: 100 });

    // FR-07: Saved Filters
    const { data: filtersData } = useGetFilters({ limit: 100 });

    // Get selected filter query
    const selectedFilter = filtersData?.content?.find((f: MgmtTargetFilterQuery) => f.id === selectedFilterId);

    // Build search query combining manual search, tag filter, and saved filter
    const buildFinalQuery = useCallback(() => {
        const queries: string[] = [];
        if (searchQuery) queries.push(searchQuery);
        if (selectedTagId) queries.push(`tag.id==${selectedTagId}`);
        if (selectedFilter?.query) queries.push(selectedFilter.query);
        return queries.length > 0 ? queries.join(';') : undefined;
    }, [searchQuery, selectedTagId, selectedFilter]);

    // API Queries
    const {
        data: targetsData,
        isLoading: targetsLoading,
        error: targetsError,
        refetch: refetchTargets,
    } = useGetTargets({
        offset,
        limit: pagination.pageSize,
        sort: sort || undefined,
        q: buildFinalQuery(),
    });

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
    const handlePaginationChange = useCallback((page: number, pageSize: number) => {
        setPagination({ current: page, pageSize });
    }, []);

    const handleSortChange = useCallback((field: string, order: 'ASC' | 'DESC' | null) => {
        if (order) {
            setSort(`${field}:${order}`);
        } else {
            setSort('');
        }
    }, []);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPagination((prev) => ({ ...prev, current: 1 })); // Reset to first page
    }, []);

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
        (dsId: number, type: AssignType) => {
            if (targetToAssign?.controllerId) {
                const assignment: MgmtDistributionSetAssignment = {
                    id: dsId,
                    type: type as MgmtDistributionSetAssignment['type'],
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
                message="Failed to load targets"
                description={(targetsError as Error).message}
                showIcon
            />
        );
    }

    return (
        <PageContainer>
            <HeaderRow>
                <Title level={2} style={{ margin: 0 }}>
                    {t('title')}
                </Title>
            </HeaderRow>

            <Card>
                <TargetSearchBar
                    onSearch={handleSearch}
                    onRefresh={() => refetchTargets()}
                    onAddTarget={handleAddTarget}
                    canAddTarget={isAdmin}
                    loading={targetsLoading}
                />

                {/* FR-06 & FR-07: Tag and Saved Filter Selectors */}
                <Space style={{ marginTop: 16, marginBottom: 16 }} wrap>
                    <Select
                        placeholder={t('list.filterByTag')}
                        allowClear
                        style={{ width: 180 }}
                        value={selectedTagId}
                        onChange={(val) => {
                            setSelectedTagId(val);
                            setPagination(prev => ({ ...prev, current: 1 }));
                        }}
                        options={(tagsData?.content as MgmtTag[] || []).map((tag: MgmtTag) => ({
                            value: tag.id,
                            label: tag.name,
                        }))}
                    />
                    <Select
                        placeholder={t('list.savedFilters')}
                        allowClear
                        style={{ width: 220 }}
                        value={selectedFilterId}
                        onChange={(val) => {
                            setSelectedFilterId(val);
                            setPagination(prev => ({ ...prev, current: 1 }));
                        }}
                        options={(filtersData?.content as MgmtTargetFilterQuery[] || []).map((f: MgmtTargetFilterQuery) => ({
                            value: f.id,
                            label: f.name,
                        }))}
                    />
                </Space>

                <TargetTable
                    data={targetsData?.content || []}
                    loading={targetsLoading}
                    total={targetsData?.total || 0}
                    pagination={pagination}
                    onPaginationChange={handlePaginationChange}
                    onSortChange={handleSortChange}
                    onView={handleViewTarget}
                    onDelete={handleDeleteClick}
                    canDelete={isAdmin}
                />
            </Card>

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
        </PageContainer>
    );
};

export default TargetList;
