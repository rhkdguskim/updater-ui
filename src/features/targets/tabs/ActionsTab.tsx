import React from 'react';
import { Table, Tag, Typography, Skeleton, Empty, Button, Space, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    StopOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import type { MgmtAction, PagedListMgmtAction } from '@/api/generated/model';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ActionsTabProps {
    data: PagedListMgmtAction | null | undefined;
    loading: boolean;
    onViewAction: (action: MgmtAction) => void;
    onCancelAction?: (action: MgmtAction) => void;
    onForceAction?: (action: MgmtAction) => void;
    canForce?: boolean;
    canCancel?: boolean;
}

const getStatusIcon = (status?: string) => {
    switch (status) {
        case 'finished':
            return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'error':
            return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
        case 'running':
            return <SyncOutlined spin style={{ color: '#1890ff' }} />;
        case 'pending':
        case 'waiting':
            return <ClockCircleOutlined style={{ color: '#faad14' }} />;
        case 'canceled':
            return <StopOutlined style={{ color: '#8c8c8c' }} />;
        default:
            return <ClockCircleOutlined />;
    }
};

import { useTranslation } from 'react-i18next';
// ...

const ActionsTab: React.FC<ActionsTabProps> = ({
    data,
    loading,
    onViewAction,
    onCancelAction,
    onForceAction,
    canForce,
    canCancel,
}) => {
    const { t } = useTranslation('targets');
    if (loading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (!data?.content?.length) {
        return <Empty description={t('common:messages.noData')} />;
    }

    const getStatusTag = (status?: string) => {
        const icon = getStatusIcon(status);
        const colorMap: Record<string, string> = {
            finished: 'success',
            error: 'error',
            running: 'processing',
            pending: 'warning',
            waiting: 'warning',
            canceled: 'default',
        };
        return (
            <Tag icon={icon} color={colorMap[status || ''] || 'default'}>
                {status ? t(`status.${status}`, { defaultValue: status.toUpperCase() }) : t('status.unknown')}
            </Tag>
        );
    };

    const getForceTypeTag = (forceType?: string) => {
        if (forceType === 'forced') {
            return <Tag color="orange">{t('assign.forced')}</Tag>;
        }
        return <Tag>{t('assign.soft')}</Tag>;
    };

    const columns: TableProps<MgmtAction>['columns'] = [
        {
            title: t('table.id'),
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (id: number) => <Text strong>#{id}</Text>,
        },
        {
            title: t('table.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => getStatusTag(status),
        },
        {
            title: t('table.type'),
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => <Tag>{type?.toUpperCase()}</Tag>,
        },
        {
            title: t('table.forceType'),
            dataIndex: 'forceType',
            key: 'forceType',
            width: 100,
            render: (forceType: string) => getForceTypeTag(forceType),
        },
        {
            title: t('table.started'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: number) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: t('table.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            render: (value: number) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: t('table.actions'),
            key: 'actions',
            width: 150,
            render: (_, record) => {
                const isActive = record.status === 'running' || record.status === 'pending';
                const canBeForced = record.forceType !== 'forced' && isActive;

                return (
                    <Space size="small">
                        <Tooltip title={t('actions.viewDetails')}>
                            <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => onViewAction(record)}
                            />
                        </Tooltip>
                        {canForce && canBeForced && onForceAction && (
                            <Tooltip title={t('actions.force')}>
                                <Button
                                    type="text"
                                    icon={<ThunderboltOutlined />}
                                    onClick={() => onForceAction(record)}
                                />
                            </Tooltip>
                        )}
                        {canCancel && isActive && onCancelAction && (
                            <Tooltip title={t('actions.cancel')}>
                                <Button
                                    type="text"
                                    danger
                                    icon={<StopOutlined />}
                                    onClick={() => onCancelAction(record)}
                                />
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <Table<MgmtAction>
            columns={columns}
            dataSource={data.content}
            rowKey="id"
            pagination={false}
            size="middle"
        />
    );
};

export default ActionsTab;
