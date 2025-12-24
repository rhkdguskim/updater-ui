import React from 'react';
import { Table, Typography, Skeleton, Empty, Button, Space, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { PagedListMgmtMetadata, MgmtMetadata } from '@/api/generated/model';

const { Text } = Typography;

interface MetadataTabProps {
    data: PagedListMgmtMetadata | null | undefined;
    loading: boolean;
    canEdit?: boolean;
    onAdd?: () => void;
    onEdit?: (metadata: MgmtMetadata) => void;
    onDelete?: (metadata: MgmtMetadata) => void;
}

import { useTranslation } from 'react-i18next';
// ...

const MetadataTab: React.FC<MetadataTabProps> = ({
    data,
    loading,
    canEdit = false,
    onAdd,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    if (loading) {
        return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    const metadata = data?.content || [];

    if (metadata.length === 0 && !canEdit) {
        return <Empty description={t('metadata.noMetadata')} />;
    }

    const columns: TableProps<MgmtMetadata>['columns'] = [
        {
            title: t('metadata.key'),
            dataIndex: 'key',
            key: 'key',
            width: 250,
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: t('metadata.value'),
            dataIndex: 'value',
            key: 'value',
            render: (text: string) => (
                <Text copyable style={{ wordBreak: 'break-all' }}>
                    {text || '-'}
                </Text>
            ),
        },
    ];

    // Add actions column if canEdit
    if (canEdit) {
        columns.push({
            title: t('table.actions'),
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title={t('common:actions.edit')}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => onEdit?.(record)}
                        />
                    </Tooltip>
                    <Tooltip title={t('common:actions.delete')}>
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onDelete?.(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        });
    }

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {canEdit && (
                <div style={{ textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                        {t('metadata.add')}
                    </Button>
                </div>
            )}
            <Table<MgmtMetadata>
                columns={columns}
                dataSource={metadata}
                rowKey="key"
                pagination={metadata.length > 10 ? { pageSize: 10 } : false}
                size="middle"
                locale={{ emptyText: <Empty description={t('metadata.emptyText')} /> }}
            />
        </Space>
    );
};

export default MetadataTab;
