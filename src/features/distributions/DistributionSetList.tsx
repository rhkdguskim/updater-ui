import React, { useState, useCallback, useMemo } from 'react';
import { Tag, Tooltip, Space, Button, message, Modal, Typography } from 'antd';
import { EyeOutlined, DeleteOutlined, TagOutlined, EditOutlined } from '@ant-design/icons';
import { EditableCell } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import {
    useGetDistributionSets,
    useDeleteDistributionSet,
    useUpdateDistributionSet,
    getGetDistributionSetsQueryKey,
} from '@/api/generated/distribution-sets/distribution-sets';
import type { MgmtDistributionSet } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import CreateDistributionSetWizard from './components/CreateDistributionSetWizard';
import dayjs from 'dayjs';
import { DistributionSetTagsCell } from './components/DistributionSetTagsCell';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import BulkManageSetTagsModal from './components/BulkManageSetTagsModal';
import BulkDeleteDistributionSetModal from './components/BulkDeleteDistributionSetModal';
import { StandardListLayout } from '@/components/layout/StandardListLayout';
import { useServerTable } from '@/hooks/useServerTable';
import { DataView, EnhancedTable, FilterBuilder, type ToolbarAction, type FilterValue, type FilterField } from '@/components/patterns';
import type { ColumnsType } from 'antd/es/table';
import { appendFilter, buildCondition } from '@/utils/fiql';

const { Text } = Typography;

const DistributionSetList: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    const {
        pagination,
        offset,
        sort,
        handleTableChange,
        resetPagination,
    } = useServerTable<MgmtDistributionSet>({ syncToUrl: true });

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedSetIds, setSelectedSetIds] = useState<React.Key[]>([]);
    const [bulkTagsModalOpen, setBulkTagsModalOpen] = useState(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterValue[]>([]);

    // Filter fields
    const filterFields: FilterField[] = useMemo(() => [
        { key: 'name', label: t('list.columns.name'), type: 'text' },
        { key: 'version', label: t('list.columns.version'), type: 'text' },
        { key: 'typeName', label: t('list.columns.type'), type: 'text' },
        {
            key: 'complete',
            label: t('list.columns.completeness'),
            type: 'select',
            options: [
                { value: 'true', label: t('tags.complete') },
                { value: 'false', label: t('tags.incomplete') },
            ],
        },
    ], [t]);

    // Build RSQL query from filters
    const buildFinalQuery = useCallback(() => {
        if (filters.length === 0) return undefined;

        const conditions = filters.map(f => {
            let val = String(f.value);

            // For contains, use wildcards with == operator
            if (f.operator === 'contains') val = `*${val}*`;

            // HawkBit uses == for all comparisons including wildcards
            const op: '==' | '!=' = f.operator === 'notEquals' ? '!=' : '==';

            return buildCondition({ field: f.field, operator: op, value: val });
        });

        return conditions.reduce((acc, cond) => appendFilter(acc, cond), '');
    }, [filters]);


    const {
        data,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetDistributionSets(
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

    const deleteMutation = useDeleteDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.deleteSetSuccess'));
                refetch();
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.deleteSetError'));
            },
        },
    });

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: t('messages.deleteSetConfirmTitle'),
            content: t('messages.deleteSetConfirmDesc'),
            okText: t('actions.delete'),
            okType: 'danger',
            cancelText: t('common:actions.cancel'),
            onOk: () => deleteMutation.mutate({ distributionSetId: id }),
        });
    };

    // Handle filter change
    const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
        setFilters(newFilters);
        resetPagination();
    }, [resetPagination]);

    // Selection toolbar actions
    const selectionActions: ToolbarAction[] = useMemo(() => {
        const actions: ToolbarAction[] = [
            {
                key: 'manageTags',
                label: t('bulkAssignment.manageTags'),
                icon: <TagOutlined />,
                onClick: () => setBulkTagsModalOpen(true),
            },
        ];
        if (isAdmin) {
            actions.push({
                key: 'delete',
                label: t('common:actions.delete'),
                icon: <DeleteOutlined />,
                onClick: () => setBulkDeleteModalOpen(true),
                danger: true,
            });
        }
        return actions;
    }, [t, isAdmin]);

    // Update mutation for inline editing
    const updateMutation = useUpdateDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.updateSuccess', { defaultValue: 'Updated' }));
                queryClient.invalidateQueries({ queryKey: getGetDistributionSetsQueryKey() });
            },
            onError: (error) => {
                message.error((error as Error).message || t('common:messages.error'));
            },
        },
    });

    const handleInlineUpdate = useCallback(async (id: number, field: 'name' | 'description', value: string) => {
        await updateMutation.mutateAsync({
            distributionSetId: id,
            data: { [field]: value },
        });
    }, [updateMutation]);

    const columns: ColumnsType<MgmtDistributionSet> = [
        {
            title: t('list.columns.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            width: 200,
            render: (text, record) => (
                <EditableCell
                    value={text || ''}
                    onSave={(val) => handleInlineUpdate(record.id, 'name', val)}
                    editable={isAdmin}
                />
            ),
        },
        {
            title: t('list.columns.version'),
            dataIndex: 'version',
            key: 'version',
            sorter: true,
            width: 80,
            render: (text) => <Text style={{ fontSize: 12 }}>{text}</Text>,
        },
        {
            title: t('list.columns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
            width: 120,
            render: (text) => <Tag color="blue">{text || t('common:notSelected')}</Tag>,
        },
        {
            title: t('list.columns.description'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text, record) => (
                <EditableCell
                    value={text || ''}
                    onSave={(val) => handleInlineUpdate(record.id, 'description', val)}
                    editable={isAdmin}
                    secondary
                />
            ),
        },
        {
            title: t('list.columns.completeness'),
            dataIndex: 'complete',
            key: 'complete',
            width: 100,
            render: (complete: boolean) => (
                <Tag color={complete ? 'success' : 'warning'}>
                    {complete ? t('tags.complete') : t('tags.incomplete')}
                </Tag>
            ),
        },
        {
            title: t('list.columns.tags'),
            key: 'tags',
            width: 160,
            render: (_, record) => <DistributionSetTagsCell distributionSetId={record.id} />,
        },
        {
            title: t('list.columns.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            sorter: true,
            width: 130,
            render: (val: number) => (
                <Text style={{ fontSize: 12 }}>{val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'}</Text>
            ),
        },
        {
            title: t('list.columns.actions', { defaultValue: 'Actions' }),
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
                            onClick={() => navigate(`/distributions/sets/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title={t('actions.edit', { defaultValue: 'Edit' })}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/distributions/sets/${record.id}`)}
                        />
                    </Tooltip>
                    {isAdmin && (
                        <Tooltip title={t('actions.delete')}>
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(record.id)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <StandardListLayout
            title={t('list.title')}
            description={t('list.description')}
            searchBar={
                <FilterBuilder
                    fields={filterFields}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onRefresh={refetch}
                    onAdd={() => setIsCreateModalVisible(true)}
                    canAdd={isAdmin}
                    addLabel={t('actions.createSet')}
                    loading={isLoading || isFetching}
                />
            }
        >
            <DataView
                loading={isLoading || isFetching}
                error={error as Error}
                isEmpty={data?.content?.length === 0}
                emptyText={t('list.empty')}
            >
                <EnhancedTable<MgmtDistributionSet>
                    columns={columns}
                    dataSource={data?.content || []}
                    rowKey="id"
                    pagination={{
                        ...pagination,
                        total: data?.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        position: ['topRight'],
                    }}
                    loading={isLoading || isFetching}
                    onChange={handleTableChange}
                    selectedRowKeys={selectedSetIds}
                    onSelectionChange={(keys) => setSelectedSetIds(keys)}
                    selectionActions={selectionActions}
                    selectionLabel={t('common:filter.selected')}
                    scroll={{ x: 1000 }}
                />
            </DataView>
            <CreateDistributionSetWizard
                visible={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                onSuccess={() => {
                    setIsCreateModalVisible(false);
                    refetch();
                }}
            />
            <BulkManageSetTagsModal
                open={bulkTagsModalOpen}
                setIds={selectedSetIds as number[]}
                onCancel={() => setBulkTagsModalOpen(false)}
                onSuccess={() => {
                    setBulkTagsModalOpen(false);
                    setSelectedSetIds([]);
                    refetch();
                }}
            />
            <BulkDeleteDistributionSetModal
                open={bulkDeleteModalOpen}
                setIds={selectedSetIds as number[]}
                setNames={(data?.content || []).filter(ds => selectedSetIds.includes(ds.id)).map(ds => `${ds.name} v${ds.version}`)}
                onCancel={() => setBulkDeleteModalOpen(false)}
                onSuccess={() => {
                    setBulkDeleteModalOpen(false);
                    setSelectedSetIds([]);
                    refetch();
                }}
            />
        </StandardListLayout>
    );
};

export default DistributionSetList;
