import React, { useState } from 'react';
import { Table, Tag, Tooltip, Space, Button, message, Modal } from 'antd';
import type { TableProps } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
    useGetDistributionSetTags,
    useDeleteDistributionSetTag,
    useCreateDistributionSetTags,
    useUpdateDistributionSetTag,
} from '@/api/generated/distribution-set-tags/distribution-set-tags';
import type { MgmtTag } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { ColorSwatch, TagFormModal } from '@/components/common';
import type { TagFormValues } from '@/components/common';



const DistributionSetTagList: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<MgmtTag | null>(null);

    const offset = (pagination.current - 1) * pagination.pageSize;

    const { data, isLoading, refetch } = useGetDistributionSetTags({
        offset,
        limit: pagination.pageSize,
    });

    const deleteMutation = useDeleteDistributionSetTag({
        mutation: {
            onSuccess: () => {
                message.success(t('tagManagement.deleteSuccess'));
                refetch();
            },
            onError: (error) => {
                message.error((error as Error).message || t('tagManagement.deleteError'));
            },
        },
    });

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: t('tagManagement.deleteConfirmTitle'),
            content: t('tagManagement.deleteConfirmDesc'),
            okText: t('common:actions.delete'),
            okType: 'danger',
            cancelText: t('common:actions.cancel'),
            onOk: () => deleteMutation.mutate({ distributionsetTagId: id }),
        });
    };

    const handleEdit = (record: MgmtTag) => {
        setEditingTag(record);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingTag(null);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditingTag(null);
    };

    const createMutation = useCreateDistributionSetTags({
        mutation: {
            onSuccess: () => {
                message.success(t('tagManagement.createSuccess'));
                handleDialogClose();
                refetch();
            },
            onError: (error) => {
                message.error((error as Error).message || t('tagManagement.createError'));
            },
        },
    });

    const updateMutation = useUpdateDistributionSetTag({
        mutation: {
            onSuccess: () => {
                message.success(t('tagManagement.updateSuccess'));
                handleDialogClose();
                refetch();
            },
            onError: (error) => {
                message.error((error as Error).message || t('tagManagement.updateError'));
            },
        },
    });

    const handleSubmit = (values: TagFormValues) => {
        if (editingTag) {
            updateMutation.mutate({
                distributionsetTagId: editingTag.id,
                data: {
                    name: values.name,
                    description: values.description,
                    colour: values.colour,
                },
            });
        } else {
            createMutation.mutate({
                data: [{
                    name: values.name,
                    description: values.description,
                    colour: values.colour,
                }],
            });
        }
    };

    const handleTableChange: TableProps<MgmtTag>['onChange'] = (newPagination) => {
        setPagination((prev) => ({
            ...prev,
            current: newPagination.current || 1,
            pageSize: newPagination.pageSize || 20,
        }));
    };

    const columns: TableProps<MgmtTag>['columns'] = [
        {
            title: t('tagManagement.columns.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
            render: (text, record) => (
                <Tag color={record.colour || 'blue'}>{text}</Tag>
            ),
        },
        {
            title: t('tagManagement.columns.description'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            sorter: (a, b) => (a.description ?? '').localeCompare(b.description ?? ''),
        },
        {
            title: t('tagManagement.columns.colour'),
            dataIndex: 'colour',
            key: 'colour',
            width: 140,
            render: (colour) => <ColorSwatch color={colour} />,
        },
        {
            title: t('tagManagement.columns.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            width: 180,
            sorter: (a, b) => (a.lastModifiedAt ?? 0) - (b.lastModifiedAt ?? 0),
            render: (val: number) => (val ? format(val, 'yyyy-MM-dd HH:mm') : '-'),
        },
        {
            title: t('common:table.actions'),
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    {isAdmin && (
                        <>
                            <Tooltip title={t('common:actions.edit')}>
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(record)}
                                />
                            </Tooltip>
                            <Tooltip title={t('common:actions.delete')}>
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(record.id)}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
                        {t('common:actions.refresh')}
                    </Button>
                    {isAdmin && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            {t('tagManagement.addTag')}
                        </Button>
                    )}
                </Space>
            </div>
            <Table
                columns={columns}
                dataSource={data?.content || []}
                rowKey="id"
                pagination={{
                    ...pagination,
                    total: data?.total || 0,
                    showSizeChanger: true,
                }}
                loading={isLoading}
                onChange={handleTableChange}
                size="small"
            />
            <TagFormModal
                open={dialogOpen}
                mode={editingTag ? 'edit' : 'create'}
                initialData={editingTag}
                loading={createMutation.isPending || updateMutation.isPending}
                onSubmit={handleSubmit}
                onCancel={handleDialogClose}
                translations={{
                    createTitle: t('tagManagement.addTag'),
                    editTitle: t('tagManagement.editTag'),
                    nameLabel: t('tagManagement.columns.name'),
                    namePlaceholder: t('tagManagement.namePlaceholder'),
                    nameRequired: t('tagManagement.nameRequired'),
                    descriptionLabel: t('tagManagement.columns.description'),
                    descriptionPlaceholder: t('tagManagement.descriptionPlaceholder'),
                    colourLabel: t('tagManagement.columns.colour'),
                }}
            />
        </Space>
    );
};

export default DistributionSetTagList;
