import React, { useState, useCallback, useMemo } from 'react';
import { message, Space, Tag, Tooltip, Typography, Button } from 'antd';
import { EditableCell } from '@/components/common';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    TagOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { StandardListLayout } from '@/components/layout/StandardListLayout';
import { useServerTable } from '@/hooks/useServerTable';
import {
    DeleteTargetModal,
    TargetFormModal,
    AssignDSModal,
    BulkAssignTagsModal,
    BulkAssignTypeModal,
    BulkDeleteTargetModal,
    SavedFiltersModal,
    TargetTagsCell,
    TargetTypeCell,
} from './components';
import type { AssignPayload } from './components';
import { useTranslation } from 'react-i18next';
import {
    useGetTargets,
    useDeleteTarget,
    useCreateTargets,
    useUpdateTarget,
    usePostAssignedDistributionSet,
    getGetTargetsQueryKey,
} from '@/api/generated/targets/targets';
import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import type { MgmtTarget, MgmtDistributionSetAssignments, MgmtDistributionSetAssignment } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { useGetTargetTags } from '@/api/generated/target-tags/target-tags';
import { useGetTargetTypes } from '@/api/generated/target-types/target-types';
import type { MgmtTag, MgmtTargetType } from '@/api/generated/model';
import { appendFilter, buildCondition } from '@/utils/fiql';
import { DataView, EnhancedTable, FilterBuilder, type ToolbarAction, type FilterValue, type FilterField } from '@/components/patterns';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;

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
        handleTableChange: serverTableChange,
        resetPagination,
        setPagination,
    } = useServerTable<MgmtTarget>({ syncToUrl: true });

    // Filter state
    const [filters, setFilters] = useState<FilterValue[]>([]);
    const [selectedTargetIds, setSelectedTargetIds] = useState<React.Key[]>([]);
    const [bulkTagsModalOpen, setBulkTagsModalOpen] = useState(false);
    const [bulkTypeModalOpen, setBulkTypeModalOpen] = useState(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);

    // Modal States
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetToDelete, setTargetToDelete] = useState<MgmtTarget | null>(null);
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState<MgmtTarget | null>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [targetToAssign, setTargetToAssign] = useState<MgmtTarget | null>(null);

    // FR-06: Target Tags
    const { data: tagsData } = useGetTargetTags(
        { limit: 100 },
        { query: { staleTime: 60000 } }
    );

    // Get target types for filters
    const { data: typesData } = useGetTargetTypes(
        { limit: 100 },
        { query: { staleTime: 60000 } }
    );

    const availableTags = (tagsData?.content as MgmtTag[]) || [];
    const availableTypes = (typesData?.content as MgmtTargetType[]) || [];

    // Filter fields for FilterBuilder
    const filterFields: FilterField[] = useMemo(() => [
        { key: 'name', label: t('table.name'), type: 'text' },
        { key: 'controllerId', label: 'Controller ID', type: 'text' },
        {
            key: 'targetType',
            label: t('table.targetType'),
            type: 'select',
            options: availableTypes.map(tp => ({ value: tp.name || '', label: tp.name || '' })),
        },
        {
            key: 'tag',
            label: t('table.tags'),
            type: 'select',
            options: availableTags.map(tag => ({ value: tag.name || '', label: tag.name || '' })),
        },
        {
            key: 'updateStatus',
            label: t('table.updateStatus'),
            type: 'select',
            options: [
                { value: 'in_sync', label: t('status.inSync') },
                { value: 'pending', label: t('status.pending') },
                { value: 'error', label: t('status.error') },
            ],
        },
    ], [t, availableTypes, availableTags]);

    // Build RSQL query from filters
    const buildFinalQuery = useCallback(() => {
        if (filters.length === 0) return undefined;

        const conditions = filters.map(f => {
            let field = f.field;

            // Map filter fields to RSQL fields (HawkBit field names)
            if (f.field === 'targetType') field = 'targetTypeName';
            if (f.field === 'tag') field = 'tag';

            let val = String(f.value);

            // For contains/startsWith/endsWith, use wildcards with == operator
            if (f.operator === 'contains') val = `*${val}*`;
            else if (f.operator === 'startsWith') val = `${val}*`;
            else if (f.operator === 'endsWith') val = `*${val}`;

            // HawkBit uses == for all comparisons including wildcards
            const op: '==' | '!=' = f.operator === 'notEquals' ? '!=' : '==';

            return buildCondition({ field, operator: op, value: val });
        });

        return conditions.reduce((acc, cond) => appendFilter(acc, cond), '');
    }, [filters]);

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
                setEditingTarget(null);
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
        setEditingTarget(null);
        setFormModalOpen(true);
    }, []);

    const handleEditTarget = useCallback((target: MgmtTarget) => {
        // For now, navigate to detail page for editing
        navigate(`/targets/${target.controllerId}`);
    }, [navigate]);

    const handleCreateTarget = useCallback(
        (values: { controllerId?: string; name?: string; description?: string }) => {
            if (values.controllerId) {
                createTargetMutation.mutate({
                    data: [
                        {
                            controllerId: values.controllerId,
                            name: values.name || values.controllerId,
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

    // Selection toolbar actions
    const selectionActions: ToolbarAction[] = useMemo(() => {
        const actions: ToolbarAction[] = [
            {
                key: 'assignTags',
                label: t('bulkAssign.assignTag'),
                icon: <TagOutlined />,
                onClick: () => setBulkTagsModalOpen(true),
            },
            {
                key: 'assignType',
                label: t('bulkAssign.assignType'),
                icon: <AppstoreOutlined />,
                onClick: () => setBulkTypeModalOpen(true),
            },
        ];
        if (isAdmin) {
            actions.push({
                key: 'delete',
                label: t('bulkDelete.button', { defaultValue: 'Delete' }),
                icon: <DeleteOutlined />,
                onClick: () => setBulkDeleteModalOpen(true),
                danger: true,
            });
        }
        return actions;
    }, [t, isAdmin]);

    // Helper functions for column rendering
    const getUpdateStatusTag = (updateStatus?: string) => {
        switch (updateStatus) {
            case 'in_sync':
                return <Tag icon={<CheckCircleOutlined />} color="success">{t('status.inSync')}</Tag>;
            case 'pending':
                return <Tag icon={<SyncOutlined spin />} color="processing">{t('status.pending')}</Tag>;
            case 'error':
                return <Tag icon={<CloseCircleOutlined />} color="error">{t('status.error')}</Tag>;
            default:
                return <Tag icon={<ExclamationCircleOutlined />} color="default">{t('status.unknown')}</Tag>;
        }
    };

    const getOnlineStatusTag = (pollStatus?: { overdue?: boolean; lastRequestAt?: number }) => {
        if (!pollStatus || pollStatus.lastRequestAt === undefined) {
            return <Tag color="default">{t('status.neverConnected')}</Tag>;
        }
        if (pollStatus.overdue) {
            return <Tag color="red">{t('status.offline')}</Tag>;
        }
        return <Tag color="green">{t('status.online')}</Tag>;
    };

    const getInstalledDsInfo = (record: MgmtTarget) => {
        const link = record._links?.installedDS as unknown as
            | { name?: string; title?: string; href?: string }
            | Array<{ name?: string; title?: string; href?: string }>
            | undefined;
        if (!link) return undefined;
        const resolved = Array.isArray(link) ? link[0] : link;
        const id = resolved?.href?.split('/').pop();
        const label = resolved?.name || resolved?.title || id;
        return id ? { id, label: label || id } : undefined;
    };

    // Update mutation for inline editing
    const updateTargetMutation = useUpdateTarget({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.updateSuccess', { defaultValue: 'Target updated' }));
                queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.updateFailed', { defaultValue: 'Failed to update target' }));
            },
        },
    });

    const handleInlineUpdate = useCallback(async (controllerId: string, newName: string) => {
        await updateTargetMutation.mutateAsync({
            targetId: controllerId,
            data: {
                controllerId,
                name: newName,
            },
        });
    }, [updateTargetMutation]);

    // Column definitions with unified action buttons
    const columns: ColumnsType<MgmtTarget> = [
        {
            title: t('table.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            width: 200,
            render: (_: string, record) => (
                <Space direction="vertical" size={0}>
                    <EditableCell
                        value={record.name || record.controllerId || ''}
                        onSave={(val) => handleInlineUpdate(record.controllerId!, val)}
                        editable={isAdmin}
                    />
                    {record.ipAddress && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {record.ipAddress}
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: t('table.targetType'),
            dataIndex: 'targetTypeName',
            key: 'targetTypeName',
            width: 140,
            render: (_, record) => {
                const typeColour = availableTypes?.find(tp => tp.id === record.targetType)?.colour;
                return (
                    <TargetTypeCell
                        controllerId={record.controllerId!}
                        currentTypeId={record.targetType}
                        currentTypeName={record.targetTypeName}
                        currentTypeColour={typeColour}
                    />
                );
            },
        },
        {
            title: t('table.tags'),
            key: 'tags',
            width: 180,
            render: (_, record) => <TargetTagsCell controllerId={record.controllerId!} />,
        },
        {
            title: t('table.status'),
            key: 'status',
            width: 80,
            render: (_, record) => getOnlineStatusTag(record.pollStatus),
        },
        {
            title: t('table.updateStatus'),
            dataIndex: 'updateStatus',
            key: 'updateStatus',
            width: 100,
            render: (status: string) => getUpdateStatusTag(status),
        },
        {
            title: t('table.installedDS'),
            key: 'installedDS',
            width: 160,
            render: (_, record) => {
                const dsInfo = getInstalledDsInfo(record);
                return dsInfo ? (
                    <Link to={`/distributions/sets/${dsInfo.id}`}>
                        <Text style={{ fontSize: 12 }}>{dsInfo.label}</Text>
                    </Link>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
                );
            },
        },
        {
            title: t('table.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            sorter: true,
            width: 130,
            render: (value: number | undefined) =>
                value ? (
                    <Text style={{ fontSize: 12 }}>{dayjs(value).format('YYYY-MM-DD HH:mm')}</Text>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
                ),
        },
        {
            title: t('table.actions'),
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Space size={0} className="action-cell">
                    <Tooltip title={t('actions.viewDetails')}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/targets/${record.controllerId}`)}
                        />
                    </Tooltip>
                    <Tooltip title={t('actions.edit', { defaultValue: 'Edit' })}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditTarget(record)}
                        />
                    </Tooltip>
                    {isAdmin && (
                        <Tooltip title={t('actions.delete')}>
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteClick(record)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    // Handle table change
    const handleTableChange: TableProps<MgmtTarget>['onChange'] = (paginationConfig, tableFilters, sorter, extra) => {
        serverTableChange(paginationConfig, tableFilters, sorter, extra);
    };

    // Handle filter change
    const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
        setFilters(newFilters);
        resetPagination();
    }, [resetPagination]);

    return (
        <StandardListLayout
            title={t('title')}
            searchBar={
                <FilterBuilder
                    fields={filterFields}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onRefresh={() => refetchTargets()}
                    onAdd={handleAddTarget}
                    canAdd={isAdmin}
                    addLabel={t('actions.addTarget')}
                    loading={targetsLoading || targetsFetching}
                />
            }
        >
            <DataView
                loading={targetsLoading || targetsFetching}
                error={targetsError as Error}
                isEmpty={targetsData?.content?.length === 0}
                emptyText={t('noTargets')}
            >
                <EnhancedTable<MgmtTarget>
                    columns={columns}
                    dataSource={targetsData?.content || []}
                    rowKey="controllerId"
                    loading={targetsLoading || targetsFetching}
                    selectedRowKeys={selectedTargetIds}
                    onSelectionChange={(keys) => setSelectedTargetIds(keys)}
                    selectionActions={selectionActions}
                    selectionLabel={t('filter.selected', { ns: 'common' })}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: targetsData?.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => t('table.pagination', { start: range[0], end: range[1], total }),
                        position: ['topRight'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    locale={{ emptyText: t('noTargets') }}
                />
            </DataView>

            <BulkAssignTagsModal
                open={bulkTagsModalOpen}
                targetIds={selectedTargetIds as string[]}
                onCancel={() => setBulkTagsModalOpen(false)}
                onSuccess={() => {
                    setBulkTagsModalOpen(false);
                    setSelectedTargetIds([]);
                    queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
                }}
            />

            <BulkAssignTypeModal
                open={bulkTypeModalOpen}
                targetIds={selectedTargetIds as string[]}
                onCancel={() => setBulkTypeModalOpen(false)}
                onSuccess={() => {
                    setBulkTypeModalOpen(false);
                    setSelectedTargetIds([]);
                    queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
                }}
            />

            <BulkDeleteTargetModal
                open={bulkDeleteModalOpen}
                targetIds={selectedTargetIds as string[]}
                onCancel={() => setBulkDeleteModalOpen(false)}
                onSuccess={() => {
                    setBulkDeleteModalOpen(false);
                    setSelectedTargetIds([]);
                    queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
                }}
            />

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

            <TargetFormModal
                open={formModalOpen}
                mode={editingTarget ? 'edit' : 'create'}
                target={editingTarget}
                loading={createTargetMutation.isPending}
                onSubmit={handleCreateTarget}
                onCancel={() => {
                    setFormModalOpen(false);
                    setEditingTarget(null);
                }}
            />

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
                    // Convert saved filter to FilterValue format
                    if (filter.query) {
                        setFilters([{
                            id: `saved-${filter.id}`,
                            field: 'query',
                            fieldLabel: 'Query',
                            operator: 'equals',
                            operatorLabel: '=',
                            value: filter.query,
                            displayValue: filter.name || filter.query,
                        }]);
                    }
                    setPagination((prev) => ({ ...prev, current: 1 }));
                    setSavedFiltersOpen(false);
                }}
                onClose={() => setSavedFiltersOpen(false)}
            />
        </StandardListLayout>
    );
};

export default TargetList;
