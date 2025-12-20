import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Typography } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import {
    EyeOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { MgmtTarget } from '@/api/generated/model';
import type { SorterResult } from 'antd/es/table/interface';
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
}

import { useTranslation } from 'react-i18next';

// ... (imports)

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

    const getOnlineStatusTag = (pollStatus?: { overdue?: boolean }) => {
        if (!pollStatus) {
            return <Tag color="default">{t('status.unknown')}</Tag>;
        }
        return pollStatus.overdue ? (
            <Tag color="red">{t('status.offline')}</Tag>
        ) : (
            <Tag color="green">{t('status.online')}</Tag>
        );
    };

    const columns: TableProps<MgmtTarget>['columns'] = [
        {
            title: t('table.controllerId'),
            dataIndex: 'controllerId',
            key: 'controllerId',
            sorter: true,
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
            render: (text: string) => text || <Text type="secondary">-</Text>,
        },
        {
            title: t('table.status'),
            key: 'status',
            width: 100,
            render: (_, record) => getOnlineStatusTag(record.pollStatus),
        },
        {
            title: t('table.updateStatus'),
            dataIndex: 'updateStatus',
            key: 'updateStatus',
            width: 130,
            render: (status: string) => getUpdateStatusTag(status),
        },
        {
            title: t('table.installedDS'),
            dataIndex: 'installedAt',
            key: 'installedAt',
            ellipsis: true,
            render: (value: number | undefined) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : <Text type="secondary">-</Text>,
        },
        {
            title: t('table.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            sorter: true,
            width: 160,
            render: (value: number | undefined) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : <Text type="secondary">-</Text>,
        },
        {
            title: t('table.actions'),
            key: 'actions',
            width: 120,
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

    const handleTableChange = (
        paginationConfig: TablePaginationConfig,
        _filters: Record<string, unknown>,
        sorter: SorterResult<MgmtTarget> | SorterResult<MgmtTarget>[]
    ) => {
        // Handle pagination
        if (paginationConfig.current && paginationConfig.pageSize) {
            onPaginationChange(paginationConfig.current, paginationConfig.pageSize);
        }

        // Handle sorting
        const sortResult = Array.isArray(sorter) ? sorter[0] : sorter;
        if (sortResult?.field && sortResult.order) {
            const order = sortResult.order === 'ascend' ? 'ASC' : 'DESC';
            onSortChange(sortResult.field as string, order);
        } else if (sortResult?.field && !sortResult.order) {
            onSortChange(sortResult.field as string, null);
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
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
        />
    );
};

export default TargetTable;
