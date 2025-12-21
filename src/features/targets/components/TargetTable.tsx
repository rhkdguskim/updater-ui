import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Typography } from 'antd';
import type { TableProps } from 'antd';
import {
    EyeOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { MgmtTarget, MgmtTag, MgmtTargetType } from '@/api/generated/model';

import dayjs from 'dayjs';

const { Text } = Typography;

export type TargetUpdateStatus = 'in_sync' | 'pending' | 'error' | 'unknown';

interface TargetTableProps {
    data: MgmtTarget[];
    loading: boolean;
    total: number;
    pagination: {
        current: number;
        pageSize: number;
    };
    onPaginationChange: (page: number, pageSize: number) => void;
    onSortChange: (field: string, order: 'ASC' | 'DESC' | null) => void;
    onView: (target: MgmtTarget) => void;
    onDelete: (target: MgmtTarget) => void;
    canDelete: boolean;
    rowSelection?: TableProps<MgmtTarget>['rowSelection'];
    // Filter props
    availableTags?: MgmtTag[];
    availableTypes?: MgmtTargetType[];
    onFilterChange?: (filters: { tagName?: string; typeName?: string }) => void;
}

import { useTranslation } from 'react-i18next';
import { TargetTagsCell } from './TargetTagsCell';
import { TargetTypeCell } from './TargetTypeCell';

const TargetTable: React.FC<TargetTableProps> = ({
    data,
    loading,
    total,
    pagination,
    onPaginationChange,
    onSortChange,
    onView,
    onDelete,
    canDelete,
    rowSelection,
    availableTags,
    availableTypes,
    onFilterChange,
}) => {
    const { t } = useTranslation('targets');

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

    const getInstalledDsLabel = (record: MgmtTarget) => {
        const link = record._links?.installedDS as unknown as
            | { name?: string; href?: string }
            | Array<{ name?: string; href?: string }>
            | undefined;
        if (!link) return undefined;
        const resolved = Array.isArray(link) ? link[0] : link;
        return resolved?.name || resolved?.href?.split('/').pop();
    };

    const columns: TableProps<MgmtTarget>['columns'] = [
        {
            title: t('table.controllerId'),
            dataIndex: 'controllerId',
            key: 'controllerId',
            sorter: true,
            width: 180,
            render: (text: string) => (
                <Text strong copyable={{ text }}>
                    {text}
                </Text>
            ),
        },
        {
            title: t('table.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            ellipsis: true,
            render: (_: string, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.name || <Text type="secondary">-</Text>}</Text>
                    {record.ipAddress && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('table.ipAddress')}: {record.ipAddress}
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
            render: (_, record) => (
                <TargetTypeCell
                    controllerId={record.controllerId!}
                    currentTypeId={record.targetType}
                    currentTypeName={record.targetTypeName}
                />
            ),
        },
        {
            title: t('table.tags'),
            key: 'tags',
            width: 200,
            filters: availableTags?.map(tag => ({ text: tag.name || '', value: tag.name || '' })),
            filterMultiple: false,
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
                const dsLabel = getInstalledDsLabel(record);
                return (
                    <Space direction="vertical" size={0}>
                        <Text strong>{dsLabel || <Text type="secondary">-</Text>}</Text>
                        {record.installedAt && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
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
            title: t('table.actions'),
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title={t('actions.viewDetails')}>
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => onView(record)}
                        />
                    </Tooltip>
                    {canDelete && (
                        <Tooltip title={t('actions.delete')}>
                            <Button
                                type="text"
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

    const handleTableChange: TableProps<MgmtTarget>['onChange'] = (
        _,
        filters,
        sorter
    ) => {
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
            const tagFilter = filters['tags'];
            const typeFilter = filters['targetTypeName'];
            onFilterChange({
                tagName: tagFilter && tagFilter.length > 0 ? tagFilter[0] as string : undefined,
                typeName: typeFilter && typeFilter.length > 0 ? typeFilter[0] as string : undefined,
            });
        }
    };

    return (
        <Table<MgmtTarget>
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="controllerId"
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} targets`,
                onChange: (page, pageSize) => onPaginationChange(page, pageSize),
                onShowSizeChange: (_current, size) => onPaginationChange(1, size),
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
            rowSelection={rowSelection}
        />
    );
};

export default TargetTable;
