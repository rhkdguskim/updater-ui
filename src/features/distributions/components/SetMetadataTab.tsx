import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    useGetMetadata2,
    useCreateMetadata2,
    useUpdateMetadata2,
    useDeleteMetadata2,
} from '@/api/generated/distribution-sets/distribution-sets';
import type { MgmtMetadata } from '@/api/generated/model';

interface SetMetadataTabProps {
    distributionSetId: number;
    isAdmin: boolean;
}

import { useTranslation } from 'react-i18next';

const SetMetadataTab: React.FC<SetMetadataTabProps> = ({ distributionSetId, isAdmin }) => {
    const { t } = useTranslation('distributions');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingMetadata, setEditingMetadata] = useState<MgmtMetadata | null>(null);
    const [form] = Form.useForm();

    const openModal = (record?: MgmtMetadata) => {
        if (record) {
            setEditingMetadata(record);
            form.setFieldsValue({ key: record.key, value: record.value });
        } else {
            setEditingMetadata(null);
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingMetadata(null);
        form.resetFields();
    };

    const handleDelete = (key?: string) => {
        if (!key) return;
        deleteMutation.mutate({ distributionSetId, metadataKey: key });
    };

    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            if (!editingMetadata?.key) return;
            updateMutation.mutate({
                distributionSetId,
                metadataKey: editingMetadata.key,
                data: { value: values.value }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const { data, isLoading, refetch } = useGetMetadata2(distributionSetId);

    const createMutation = useCreateMetadata2({
        mutation: {
            onSuccess: () => {
                message.success(t('metadataTab.successCreate'));
                handleCancel();
                refetch();
            },
            onError: () => message.error(t('metadataTab.errorCreate')),
        },
    });

    const updateMutation = useUpdateMetadata2({
        mutation: {
            onSuccess: () => {
                message.success(t('metadataTab.successUpdate'));
                handleCancel();
                refetch();
            },
            onError: () => message.error(t('metadataTab.errorUpdate')),
        },
    });

    const deleteMutation = useDeleteMetadata2({
        mutation: {
            onSuccess: () => {
                message.success(t('metadataTab.successDelete'));
                refetch();
            },
            onError: () => message.error(t('metadataTab.errorDelete')),
        },
    });

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            const payload: MgmtMetadata = { key: values.key, value: values.value };
            createMutation.mutate({ distributionSetId, data: [payload] });
        } catch (error) {
            console.error(error);
        }
    };
    const columns = [
        {
            title: t('metadataTab.key'),
            dataIndex: 'key',
            key: 'key',
        },
        {
            title: t('metadataTab.value'),
            dataIndex: 'value',
            key: 'value',
        },
        {
            title: t('list.columns.actions'),
            key: 'actions',
            render: (_: unknown, record: MgmtMetadata) => (
                <Space>
                    {isAdmin && (
                        <>
                            <Button
                                icon={<EditOutlined />}
                                type="text"
                                onClick={() => openModal(record)}
                            />
                            <Popconfirm
                                title={t('metadataTab.deleteTitle')}
                                description={t('metadataTab.deleteDesc')}
                                onConfirm={() => handleDelete(record.key)}
                                okText={t('values.yes')}
                                cancelText={t('values.no')}
                            >
                                <Button icon={<DeleteOutlined />} type="text" danger />
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            {isAdmin && (
                <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                        {t('metadataTab.add')}
                    </Button>
                </div>
            )}
            <Table
                dataSource={data?.content || []} // Assuming content is the array
                columns={columns}
                rowKey="key"
                loading={isLoading}
                pagination={false}
            />

            <Modal
                title={editingMetadata ? t('metadataTab.edit') : t('metadataTab.add')}
                open={isModalVisible}
                onOk={editingMetadata ? handleUpdate : handleCreate}
                onCancel={handleCancel}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="key"
                        label={t('metadataTab.key')}
                        rules={[{ required: true, message: t('metadataTab.placeholderKey') }]}
                    >
                        <Input disabled={!!editingMetadata} placeholder={t('metadataTab.key')} />
                    </Form.Item>
                    <Form.Item
                        name="value"
                        label={t('metadataTab.value')}
                        rules={[{ required: true, message: t('metadataTab.placeholderValue') }]}
                    >
                        <Input.TextArea rows={3} placeholder={t('metadataTab.value')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SetMetadataTab;
