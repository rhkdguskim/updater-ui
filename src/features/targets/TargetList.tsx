import React, { useMemo } from 'react';
import { TagOutlined, AppstoreOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { StandardListLayout } from '@/components/layout/StandardListLayout';
import {
    DeleteTargetModal,
    TargetFormModal,
    AssignDSModal,
    BulkAssignTagsModal,
    BulkAssignTypeModal,
    BulkDeleteTargetModal,
    SavedFiltersModal,
    ImportTargetsModal,
} from './components';
import { DataView, EnhancedTable, FilterBuilder, type ToolbarAction } from '@/components/patterns';
import { useTargetListModel } from './hooks/useTargetListModel';
import { getTargetTableColumns } from './components/TargetTableColumns';
import type { MgmtTarget } from '@/api/generated/model';

const TargetList: React.FC = () => {
    const model = useTargetListModel();
    const { isAdmin, t } = model;

    // UI-only derived values
    const selectionActions: ToolbarAction[] = useMemo(() => {
        const actions: ToolbarAction[] = [
            {
                key: 'assignTags',
                label: t('bulkAssign.assignTag'),
                icon: <TagOutlined />,
                onClick: () => model.setBulkTagsModalOpen(true),
            },
            {
                key: 'assignType',
                label: t('bulkAssign.assignType'),
                icon: <AppstoreOutlined />,
                onClick: () => model.setBulkTypeModalOpen(true),
            },
        ];
        if (isAdmin) {
            actions.push({
                key: 'delete',
                label: t('bulkDelete.button', { defaultValue: 'Delete' }),
                icon: <DeleteOutlined />,
                onClick: () => model.setBulkDeleteModalOpen(true),
                danger: true,
            });
        }
        return actions;
    }, [t, isAdmin, model]);

    const columns = useMemo(() => getTargetTableColumns({
        t,
        isAdmin,
        availableTypes: model.availableTypes,
        onView: (target) => model.handleEditTarget(target),
        onEdit: (target) => model.handleEditTarget(target),
        onDelete: (target) => model.handleDeleteClick(target),
        onInlineUpdate: model.handleInlineUpdate,
    }), [t, isAdmin, model]);

    return (
        <StandardListLayout
            title={t('list.title')}
            description={t('list.description')}
            searchBar={
                <FilterBuilder
                    fields={model.filterFields}
                    filters={model.filters}
                    onFiltersChange={model.handleFiltersChange}
                    onRefresh={() => model.refetchTargets()}
                    onAdd={model.handleAddTarget}
                    canAdd={isAdmin}
                    addLabel={t('actions.addTarget')}
                    loading={model.targetsLoading || model.targetsFetching}
                    extra={
                        <>
                            <Button
                                icon={<UploadOutlined />}
                                onClick={() => model.setImportModalOpen(true)}
                                disabled={!isAdmin}
                            >
                                {t('actions.import', { defaultValue: 'Import' })}
                            </Button>
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={model.handleExport}
                                disabled={!model.targetsData?.content?.length}
                            >
                                {t('actions.export', { defaultValue: 'Export' })}
                            </Button>
                        </>
                    }
                />
            }
        >
            <DataView
                loading={model.targetsLoading || model.targetsFetching}
                error={model.targetsError as Error}
                isEmpty={model.targetsData?.content?.length === 0}
                emptyText={t('noTargets')}
            >
                <EnhancedTable<MgmtTarget>
                    columns={columns}
                    dataSource={model.targetsData?.content || []}
                    rowKey="controllerId"
                    loading={model.targetsLoading || model.targetsFetching}
                    selectedRowKeys={model.selectedTargetIds}
                    onSelectionChange={(keys) => model.setSelectedTargetIds(keys)}
                    selectionActions={selectionActions}
                    selectionLabel={t('filter.selected', { ns: 'common' })}
                    pagination={{
                        current: model.pagination.current,
                        pageSize: model.pagination.pageSize,
                        total: model.targetsData?.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => t('table.pagination', { start: range[0], end: range[1], total }),
                        position: ['topRight'],
                    }}
                    onChange={model.handleTableChange}
                    scroll={{ x: 1200 }}
                    locale={{ emptyText: t('noTargets') }}
                />
            </DataView>

            <BulkAssignTagsModal
                open={model.bulkTagsModalOpen}
                targetIds={model.selectedTargetIds as string[]}
                onCancel={() => model.setBulkTagsModalOpen(false)}
                onSuccess={() => {
                    model.setBulkTagsModalOpen(false);
                    model.setSelectedTargetIds([]);
                    model.refetchTargets();
                }}
            />

            <BulkAssignTypeModal
                open={model.bulkTypeModalOpen}
                targetIds={model.selectedTargetIds as string[]}
                onCancel={() => model.setBulkTypeModalOpen(false)}
                onSuccess={() => {
                    model.setBulkTypeModalOpen(false);
                    model.setSelectedTargetIds([]);
                    model.refetchTargets();
                }}
            />

            <BulkDeleteTargetModal
                open={model.bulkDeleteModalOpen}
                targetIds={model.selectedTargetIds as string[]}
                onCancel={() => model.setBulkDeleteModalOpen(false)}
                onSuccess={() => {
                    model.setBulkDeleteModalOpen(false);
                    model.setSelectedTargetIds([]);
                    model.refetchTargets();
                }}
            />

            <DeleteTargetModal
                open={model.deleteModalOpen}
                target={model.targetToDelete}
                loading={model.deletePending}
                onConfirm={model.handleDeleteConfirm}
                onCancel={() => {
                    model.setDeleteModalOpen(false);
                }}
            />

            <TargetFormModal
                open={model.formModalOpen}
                mode={model.editingTarget ? 'edit' : 'create'}
                target={model.editingTarget}
                loading={model.createPending}
                onSubmit={model.handleCreateTarget}
                onCancel={() => {
                    model.setFormModalOpen(false);
                }}
            />

            <AssignDSModal
                open={model.assignModalOpen}
                targetId={model.targetToAssign?.controllerId ?? ''}
                distributionSets={model.dsData?.content || []}
                loading={model.assignPending}
                dsLoading={model.dsLoading}
                canForced={isAdmin}
                onConfirm={model.handleAssignDS}
                onCancel={() => {
                    model.setAssignModalOpen(false);
                }}
            />

            <SavedFiltersModal
                open={model.savedFiltersOpen}
                canEdit={isAdmin}
                onApply={(filter) => {
                    if (filter.query) {
                        model.handleFiltersChange([{
                            id: `saved-${filter.id}`,
                            field: 'query',
                            fieldLabel: 'Query',
                            operator: 'equals',
                            operatorLabel: '=',
                            value: filter.query,
                            displayValue: filter.name || filter.query,
                        }]);
                    }
                    model.setSavedFiltersOpen(false);
                }}
                onClose={() => model.setSavedFiltersOpen(false)}
            />

            <ImportTargetsModal
                open={model.importModalOpen}
                onCancel={() => model.setImportModalOpen(false)}
                onSuccess={() => {
                    model.setImportModalOpen(false);
                    model.refetchTargets();
                }}
            />
        </StandardListLayout>
    );
};

export default TargetList;
