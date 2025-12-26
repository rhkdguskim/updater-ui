import React, { useState, useMemo, useCallback } from 'react';
import { Tag, Tooltip, Space, Button, message, Modal, Typography } from 'antd';
import { EyeOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { EditableCell } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import {
    useGetSoftwareModules,
    useDeleteSoftwareModule,
    useUpdateSoftwareModule,
    getGetSoftwareModulesQueryKey,
} from '@/api/generated/software-modules/software-modules';
import type { MgmtSoftwareModule } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import CreateSoftwareModuleModal from './components/CreateSoftwareModuleModal';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { StandardListLayout } from '@/components/layout/StandardListLayout';
import { useServerTable } from '@/hooks/useServerTable';
import { DataView, EnhancedTable, FilterBuilder, type ToolbarAction, type FilterValue, type FilterField } from '@/components/patterns';
import type { ColumnsType } from 'antd/es/table';
import { appendFilter, buildCondition } from '@/utils/fiql';

const { Text } = Typography;

const SoftwareModuleList: React.FC = () => {
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
    } = useServerTable<MgmtSoftwareModule>({ syncToUrl: true });

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedModuleIds, setSelectedModuleIds] = useState<React.Key[]>([]);
    const [filters, setFilters] = useState<FilterValue[]>([]);

    // Filter fields
    const filterFields: FilterField[] = useMemo(() => [
        { key: 'name', label: t('list.columns.name'), type: 'text' },
        { key: 'version', label: t('list.columns.version'), type: 'text' },
        { key: 'typeName', label: t('list.columns.type'), type: 'text' },
        { key: 'vendor', label: t('list.columns.vendor'), type: 'text' },
    ], [t]);

    // Build RSQL query from filters
    const buildFinalQuery = useCallback(() => {
        if (filters.length === 0) return undefined;

        const conditions = filters.map(f => {
            let val = String(f.value);

            // For contains, use wildcards with == operator
            if (f.operator === 'contains') val = `*${val}*`;

            // HawkBit uses == for all comparisons including wildcards
            const op: '==' = '==';

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
    } = useGetSoftwareModules(
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

    const deleteMutation = useDeleteSoftwareModule({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.deleteModuleSuccess'));
                refetch();
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.deleteModuleError'));
            },
        },
    });

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: t('messages.deleteModuleConfirmTitle'),
            content: t('messages.deleteModuleConfirmDesc'),
            okText: t('actions.delete'),
            okType: 'danger',
            cancelText: t('common:actions.cancel'),
            onOk: () => deleteMutation.mutate({ softwareModuleId: id }),
        });
    };

    const handleBulkDelete = useCallback(() => {
        Modal.confirm({
            title: t('messages.bulkDeleteModuleConfirmTitle', { count: selectedModuleIds.length }),
            content: t('messages.bulkDeleteModuleConfirmDesc'),
            okText: t('actions.delete'),
            okType: 'danger',
            cancelText: t('common:actions.cancel'),
            onOk: async () => {
                for (const id of selectedModuleIds) {
                    await deleteMutation.mutateAsync({ softwareModuleId: id as number }).catch(() => { });
                }
                setSelectedModuleIds([]);
                refetch();
                message.success(t('messages.bulkDeleteModuleSuccess'));
            },
        });
    }, [selectedModuleIds, deleteMutation, refetch, t]);

    // Handle filter change
    const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
        setFilters(newFilters);
        resetPagination();
    }, [resetPagination]);

    // Selection toolbar actions
    const selectionActions: ToolbarAction[] = useMemo(() => {
        const actions: ToolbarAction[] = [];
        if (isAdmin) {
            actions.push({
                key: 'delete',
                label: t('actions.deleteSelected'),
                icon: <DeleteOutlined />,
                onClick: handleBulkDelete,
                danger: true,
            });
        }
        return actions;
    }, [t, isAdmin, handleBulkDelete]);

    // Update mutation for inline editing
    const updateMutation = useUpdateSoftwareModule({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.updateSuccess', { defaultValue: 'Updated' }));
                queryClient.invalidateQueries({ queryKey: getGetSoftwareModulesQueryKey() });
            },
            onError: (error) => {
                message.error((error as Error).message || t('common:messages.error'));
            },
        },
    });

    const handleInlineUpdate = useCallback(async (id: number, field: 'vendor' | 'description', value: string) => {
        await updateMutation.mutateAsync({
            softwareModuleId: id,
            data: { [field]: value },
        });
    }, [updateMutation]);

    const columns: ColumnsType<MgmtSoftwareModule> = [
        {
            title: t('list.columns.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            width: 200,
            render: (text, record) => (
                <Text strong style={{ fontSize: 12 }}>
                    <a onClick={() => navigate(`/distributions/modules/${record.id}`)}>{text}</a>
                </Text>
            ),
        },
        {
            title: t('list.columns.version'),
            dataIndex: 'version',
            key: 'version',
            sorter: true,
            width: 80,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: t('list.columns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
            width: 120,
            render: (text) => <Tag color="cyan">{text || t('common:notSelected', { defaultValue: '선택되지 않음' })}</Tag>,
        },
        {
            title: t('list.columns.vendor'),
            dataIndex: 'vendor',
            key: 'vendor',
            width: 120,
            render: (text, record) => (
                <EditableCell
                    value={text || ''}
                    onSave={(val) => handleInlineUpdate(record.id, 'vendor', val)}
                    editable={isAdmin}
                />
            ),
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
            title: t('list.columns.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            sorter: true,
            width: 130,
            render: (val: number) => (
                <Text style={{ fontSize: 12 }}>{val ? format(val, 'yyyy-MM-dd HH:mm') : '-'}</Text>
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
                            onClick={() => navigate(`/distributions/modules/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title={t('actions.edit', { defaultValue: 'Edit' })}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/distributions/modules/${record.id}`)}
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
            title={t('moduleList.title')}
            searchBar={
                <FilterBuilder
                    fields={filterFields}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onRefresh={refetch}
                    onAdd={() => setIsCreateModalVisible(true)}
                    canAdd={isAdmin}
                    addLabel={t('actions.createModule')}
                    loading={isLoading || isFetching}
                />
            }
        >
            <DataView
                loading={isLoading || isFetching}
                error={error as Error}
                isEmpty={data?.content?.length === 0}
                emptyText={t('moduleList.empty')}
            >
                <EnhancedTable<MgmtSoftwareModule>
                    columns={columns}
                    dataSource={data?.content || []}
                    rowKey="id"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: data?.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        position: ['topRight'],
                    }}
                    loading={isLoading || isFetching}
                    onChange={handleTableChange}
                    selectedRowKeys={selectedModuleIds}
                    onSelectionChange={(keys) => setSelectedModuleIds(keys)}
                    selectionActions={selectionActions}
                    selectionLabel={t('common:filter.selected')}
                    scroll={{ x: 1000 }}
                />
            </DataView>
            <CreateSoftwareModuleModal
                visible={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                onSuccess={() => {
                    setIsCreateModalVisible(false);
                    refetch();
                }}
            />
        </StandardListLayout>
    );
};

export default SoftwareModuleList;
