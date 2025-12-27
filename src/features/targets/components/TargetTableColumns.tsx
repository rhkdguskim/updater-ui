import { Space, Tag, Tooltip, Typography, Button } from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { EditableCell } from '@/components/common';
import { TargetTagsCell, TargetTypeCell } from './index';
import type { MgmtTarget, MgmtTargetType } from '@/api/generated/model';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { isTargetOnline } from '@/entities';

const { Text } = Typography;

interface GetColumnsProps {
    t: any;
    isAdmin: boolean;
    availableTypes: MgmtTargetType[];
    onView: (target: MgmtTarget) => void;
    onEdit: (target: MgmtTarget) => void;
    onDelete: (target: MgmtTarget) => void;
    onInlineUpdate: (controllerId: string, newName: string) => Promise<void>;
}

export const getTargetTableColumns = ({
    t,
    isAdmin,
    availableTypes,
    onView,
    onEdit,
    onDelete,
    onInlineUpdate,
}: GetColumnsProps): ColumnsType<MgmtTarget> => {
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

    const getOnlineStatusTag = (record: MgmtTarget) => {
        if (!record.pollStatus || record.pollStatus.lastRequestAt === undefined) {
            return <Tag color="default">{t('status.neverConnected')}</Tag>;
        }
        if (isTargetOnline(record as any)) {
            return <Tag color="green">{t('status.online')}</Tag>;
        }
        return <Tag color="red">{t('status.offline')}</Tag>;
    };

    const getInstalledDsInfo = (record: MgmtTarget) => {
        const link = record._links?.installedDS as any;
        if (!link) return undefined;
        const resolved = Array.isArray(link) ? link[0] : link;
        const id = resolved?.href?.split('/').pop();
        const label = resolved?.name || resolved?.title || id;
        return id ? { id, label: label || id } : undefined;
    };

    return [
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
                        onSave={(val) => onInlineUpdate(record.controllerId!, val)}
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
            render: (_, record) => getOnlineStatusTag(record),
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
                            onClick={() => onView(record)}
                        />
                    </Tooltip>
                    <Tooltip title={t('actions.edit', { defaultValue: 'Edit' })}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>
                    {isAdmin && (
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
};
