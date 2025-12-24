import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, Checkbox, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    useGetMetadata1,
    useCreateMetadata1,
    useUpdateMetadata1,
    useDeleteMetadata1,
} from '@/api/generated/software-modules/software-modules';
import type { MgmtSoftwareModuleMetadata } from '@/api/generated/model';

interface ModuleMetadataTabProps {
    softwareModuleId: number;
    isAdmin: boolean;
}

import { useTranslation } from 'react-i18next';

const ModuleMetadataTab: React.FC<ModuleMetadataTabProps> = ({ softwareModuleId, isAdmin }) => {
    const { t } = useTranslation('distributions');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingMetadata, setEditingMetadata] = useState<MgmtSoftwareModuleMetadata | null>(null);
    const [form] = Form.useForm();

    const openModal = (record?: MgmtSoftwareModuleMetadata) => {
        if (record) {
            setEditingMetadata(record);
            form.setFieldsValue({ key: record.key, value: record.value, targetVisible: record.targetVisible });
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
        deleteMutation.mutate({ softwareModuleId, metadataKey: key });
    };

    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            if (!editingMetadata?.key) return;
            updateMutation.mutate({
                softwareModuleId,
                metadataKey: editingMetadata.key,
                data: { value: values.value, targetVisible: values.targetVisible }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const { data, isLoading, refetch } = useGetMetadata1(softwareModuleId);

    const createMutation = useCreateMetadata1({
        mutation: {
            onSuccess: () => {
                message.success(t('metadataTab.successCreate'));
                handleCancel();
                refetch();
            },
            onError: () => message.error(t('metadataTab.errorCreate')),
        },
    });

    const updateMutation = useUpdateMetadata1({
        mutation: {
            onSuccess: () => {
                message.success(t('metadataTab.successUpdate'));
                handleCancel();
                refetch();
            },
            onError: () => message.error(t('metadataTab.errorUpdate')),
        },
    });

    const deleteMutation = useDeleteMetadata1({
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
            const payload: MgmtSoftwareModuleMetadata = {
                key: values.key,
                value: values.value,
                targetVisible: values.targetVisible
            };
            createMutation.mutate({ softwareModuleId, data: [payload] });
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
            title: t('metadataTab.targetVisible'),
            dataIndex: 'targetVisible',
            key: 'targetVisible',
            render: (visible: boolean) => (
                <Tag color={visible ? 'green' : 'default'}>{visible ? t('values.yes') : t('values.no')}</Tag>
            ),
        },
        {
            title: t('list.columns.actions'),
            key: 'actions',
            render: (_: unknown, record: MgmtSoftwareModuleMetadata) => (
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
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {isAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                    {t('metadataTab.add')}
                </Button>
            )}
            <Table
                dataSource={data?.content || []}
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
                    <Form.Item name="targetVisible" valuePropName="checked">
                        <Checkbox>{t('metadataTab.targetVisible')}</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
};

export default ModuleMetadataTab;
