import React, { useMemo } from 'react';
import { Table, Tag, Space, Button, Tooltip, Typography } from 'antd';
import type { TableProps } from 'antd';
import type { FilterValue } from 'antd/es/table/interface';
import styled from 'styled-components';
import {
    EyeOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    TagOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import type { MgmtTarget, MgmtTag, MgmtTargetType } from '@/api/generated/model';

import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TargetTagsCell } from './TargetTagsCell';
import { TargetTypeCell } from './TargetTypeCell';
import { SelectionToolbar, type ToolbarAction } from '@/components/patterns';

const { Text } = Typography;

// Monday.com style table container
const TableContainer = styled.div`
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    /* Row hover effects - Monday.com style */
    .ant-table-tbody > tr {
        transition: background-color 0.15s ease;

        &:hover {
            background-color: var(--ant-color-primary-bg) !important;
        }

        /* Show checkbox on hover */
        .ant-table-selection-column .ant-checkbox-wrapper {
            opacity: 0.3;
            transition: opacity 0.15s ease;
        }

        &:hover .ant-table-selection-column .ant-checkbox-wrapper,
        &.ant-table-row-selected .ant-table-selection-column .ant-checkbox-wrapper {
            opacity: 1;
        }
    }

    /* Selected row style */
    .ant-table-tbody > tr.ant-table-row-selected {
        background-color: var(--ant-color-primary-bg-hover) !important;

        > td {
            background: transparent !important;
        }
    }

    /* Action cell hover effects */
    .hover-action-cell {
        opacity: 0;
        transition: opacity 0.15s ease;
    }

    .ant-table-tbody > tr:hover .hover-action-cell {
        opacity: 1;
    }

    /* Table flex layout for remaining space */
    .ant-table-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-spin-nested-loading,
    .ant-spin-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-table {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-table-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-table-content {
        flex: 1;
        min-height: 0;
        overflow: auto !important;
    }

    /* Sticky header */
    .ant-table-thead > tr > th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: var(--ant-color-bg-container);
    }
`;

export type TargetUpdateStatus = 'in_sync' | 'pending' | 'error' | 'unknown';

interface TargetTableProps {
    data: MgmtTarget[];
    loading: boolean;
    total: number;
    pagination: {
        current: number;
        pageSize: number;
    };
    scrollY?: number;
    onPaginationChange: (page?: number, pageSize?: number) => void;
    onSortChange: (field: string, order: 'ASC' | 'DESC' | null) => void;
    onView: (target: MgmtTarget) => void;
    onDelete: (target: MgmtTarget) => void;
    canDelete: boolean;
    rowSelection?: TableProps<MgmtTarget>['rowSelection'];
    // Filter props
    availableTags?: MgmtTag[];
    availableTypes?: MgmtTargetType[];
    onFilterChange?: (filters: { tagName?: string; typeName?: string }) => void;
    filters?: { tagName?: string; typeName?: string };
    onChange?: TableProps<MgmtTarget>['onChange'];
    // Bulk action props
    selectedCount?: number;
    onBulkAssignTags?: () => void;
    onBulkAssignType?: () => void;
    onBulkDelete?: () => void;
    onClearSelection?: () => void;
}

const TargetTable: React.FC<TargetTableProps> = ({
    data,
    loading,
    total,
    pagination,
    scrollY: _scrollY,
    onPaginationChange,
    onSortChange,
    onView,
    onDelete,
    canDelete,
    rowSelection,
    availableTags,
    availableTypes,
    onFilterChange,
    filters,
    onChange,
    // Bulk action props
    selectedCount = 0,
    onBulkAssignTags,
    onBulkAssignType,
    onBulkDelete,
    onClearSelection,
}) => {
    const { t } = useTranslation('targets');

    // Selection toolbar actions (Monday.com style)
    const selectionActions: ToolbarAction[] = useMemo(() => {
        const actions: ToolbarAction[] = [];
        if (onBulkAssignTags) {
            actions.push({
                key: 'assignTags',
                label: t('bulkAssign.assignTag'),
                icon: <TagOutlined />,
                onClick: onBulkAssignTags,
            });
        }
        if (onBulkAssignType) {
            actions.push({
                key: 'assignType',
                label: t('bulkAssign.assignType'),
                icon: <AppstoreOutlined />,
                onClick: onBulkAssignType,
            });
        }
        if (onBulkDelete && canDelete) {
            actions.push({
                key: 'delete',
                label: t('bulkDelete.button', { defaultValue: 'Delete' }),
                icon: <DeleteOutlined />,
                onClick: onBulkDelete,
                danger: true,
            });
        }
        return actions;
    }, [t, onBulkAssignTags, onBulkAssignType, onBulkDelete, canDelete]);

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
        // 1. Never connected: no pollStatus or no lastRequestAt
        if (!pollStatus || pollStatus.lastRequestAt === undefined) {
            return <Tag color="default">{t('status.neverConnected')}</Tag>;
        }
        // 2. Offline: overdue is true
        if (pollStatus.overdue) {
            return <Tag color="red">{t('status.offline')}</Tag>;
        }
        // 3. Online: overdue is false
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

    const extractFilterValue = (value: FilterValue | null | undefined) => {
        if (!value) return undefined;
        if (Array.isArray(value)) {
            return value.length > 0 ? String(value[0]) : undefined;
        }
        return String(value);
    };

    const columns: TableProps<MgmtTarget>['columns'] = [
        {
            title: t('table.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            width: 220,
            render: (_: string, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.name || record.controllerId}</Text>
                    {record.ipAddress && (
                        <Text type="secondary" style={{ fontSize: 'var(--ant-font-size-sm)' }}>
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
            width: 160,
            filters: availableTypes?.map(type => ({ text: type.name || '', value: type.name || '' })),
            filterMultiple: false,
            filteredValue: filters?.typeName ? [filters.typeName] : null,
            render: (_, record) => {
                const typeColour = availableTypes?.find(t => t.id === record.targetType)?.colour;
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
            width: 200,
            filters: availableTags?.map(tag => ({ text: tag.name || '', value: tag.name || '' })),
            filterMultiple: false,
            filteredValue: filters?.tagName ? [filters.tagName] : null,
            render: (_, record) => <TargetTagsCell controllerId={record.controllerId!} />,
        },
        {
            title: t('table.status'),
            key: 'status',
            width: 90,
            render: (_, record) => getOnlineStatusTag(record.pollStatus),
        },

        {
            title: t('table.updateStatus'),
            dataIndex: 'updateStatus',
            key: 'updateStatus',
            width: 120,
            render: (status: string) => getUpdateStatusTag(status),
        },
        {
            title: t('table.installedDS'),
            key: 'installedDS',
            width: 200,
            render: (_, record) => {
                const dsInfo = getInstalledDsInfo(record);
                return (
                    <Space direction="vertical" size={0}>
                        {dsInfo ? (
                            <Link to={`/distributions/sets/${dsInfo.id}`}>
                                <Text strong>{dsInfo.label}</Text>
                            </Link>
                        ) : (
                            <Text type="secondary">-</Text>
                        )}
                        {record.installedAt && (
                            <Text type="secondary" style={{ fontSize: 'var(--ant-font-size-sm)' }}>
                                {dayjs(record.installedAt).format('YYYY-MM-DD HH:mm')}
                            </Text>
                        )}
                    </Space>
                );
            },
        },
        {
            title: t('table.lastControllerRequest'),
            dataIndex: 'lastControllerRequestAt',
            key: 'lastControllerRequestAt',
            width: 160,
            render: (value: number | undefined) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : <Text type="secondary">-</Text>,
        },
        {
            title: t('table.autoConfirm'),
            dataIndex: 'autoConfirmActive',
            key: 'autoConfirmActive',
            width: 120,
            render: (value: boolean | undefined) =>
                value ? (
                    <Tag color="green">{t('autoConfirm.enabled')}</Tag>
                ) : (
                    <Tag>{t('autoConfirm.disabled')}</Tag>
                ),
        },
        {
            title: t('table.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            sorter: true,
            width: 150,
            render: (value: number | undefined) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : <Text type="secondary">-</Text>,
        },
        {
            title: '',
            key: 'actions',
            width: 80,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small" className="hover-action-cell">
                    <Tooltip title={t('actions.viewDetails')}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => onView(record)}
                        />
                    </Tooltip>
                    {canDelete && (
                        <Tooltip title={t('actions.delete')}>
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onDelete(record)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    const handlePaginationUpdate = (page?: number, pageSize?: number) => {
        onPaginationChange(page, pageSize);
    };

    const handleTableChange: TableProps<MgmtTarget>['onChange'] = (
        paginationConfig,
        tableFilters,
        sorter
    ) => {
        handlePaginationUpdate(paginationConfig.current, paginationConfig.pageSize);

        // Handle sorting
        const sortResult = Array.isArray(sorter) ? sorter[0] : sorter;
        if (sortResult?.field && sortResult.order) {
            const order = sortResult.order === 'ascend' ? 'ASC' : 'DESC';
            onSortChange(sortResult.field as string, order);
        } else if (sortResult?.field && !sortResult.order) {
            onSortChange(sortResult.field as string, null);
        }

        // Handle filters
        if (onFilterChange) {
            const nextTagName = extractFilterValue(tableFilters['tags']);
            const nextTypeName = extractFilterValue(tableFilters['targetTypeName']);
            const currentFilters = filters || {};

            if (
                nextTagName !== currentFilters.tagName ||
                nextTypeName !== currentFilters.typeName
            ) {
                onFilterChange({
                    tagName: nextTagName,
                    typeName: nextTypeName,
                });
            }
        }
    };

    return (
        <TableContainer>
            <SelectionToolbar
                selectedCount={selectedCount}
                actions={selectionActions}
                onClearSelection={onClearSelection}
                selectionLabel={t('filter.selected', { ns: 'common' })}
            />
            <Table<MgmtTarget>
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey="controllerId"
                locale={{ emptyText: t('table.empty') }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) => t('table.pagination', { start: range[0], end: range[1], total }),
                    onChange: (page, pageSize) => handlePaginationUpdate(page, pageSize),
                    onShowSizeChange: (_current, size) => handlePaginationUpdate(1, size),
                    position: ['topRight'],
                }}
                onChange={onChange || handleTableChange}
                scroll={{ x: 1000 }}
                size="small"
                rowSelection={rowSelection}
            />
        </TableContainer>
    );
};

export default TargetTable;
