import React, { useState } from 'react';
import { Modal, Select, message, Typography, Space, Button, Divider, Form, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAssignTargetType, getGetTargetsQueryKey } from '@/api/generated/targets/targets';
import { useGetTargetTypes, useCreateTargetTypes, getGetTargetTypesQueryKey } from '@/api/generated/target-types/target-types';
import type { MgmtTargetType } from '@/api/generated/model';

interface BulkAssignTypeModalProps {
    open: boolean;
    targetIds: string[];
    onCancel: () => void;
    onSuccess: () => void;
}

const BulkAssignTypeModal: React.FC<BulkAssignTypeModalProps> = ({
    open,
    targetIds,
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const queryClient = useQueryClient();
    const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(undefined);
    const [assigning, setAssigning] = useState(false);
    const [createTypeModalOpen, setCreateTypeModalOpen] = useState(false);
    const [form] = Form.useForm();

    const { data: typesData, isLoading: typesLoading } = useGetTargetTypes({ limit: 100 });

    const assignTypeMutation = useAssignTargetType();

    const createTypeMutation = useCreateTargetTypes({
        mutation: {
            onSuccess: (data) => {
                setCreateTypeModalOpen(false);
                form.resetFields();
                queryClient.invalidateQueries({ queryKey: getGetTargetTypesQueryKey() });
                // Auto-select the newly created type
                if (data && Array.isArray(data) && data[0]?.id) {
                    setSelectedTypeId(data[0].id!);
                }
                message.success(t('messages.typeCreated', { defaultValue: 'Type created' }));
            },
            onError: (error) => {
                message.error((error as Error).message || t('common:messages.error'));
            },
        },
    });

    const handleOk = async () => {
        if (!selectedTypeId) {
            message.warning(t('bulkAssign.selectType'));
            return;
        }

        setAssigning(true);
        try {
            for (const controllerId of targetIds) {
                await assignTypeMutation.mutateAsync({
                    targetId: controllerId,
                    data: { id: selectedTypeId },
                });
            }
            message.success(t('bulkAssign.typeAssignSuccess', { count: targetIds.length }));
            setSelectedTypeId(undefined);
            queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
            onSuccess();
        } catch (error) {
            message.error((error as Error).message || t('common:messages.error'));
        } finally {
            setAssigning(false);
        }
    };

    const handleCreateType = async () => {
        try {
            const values = await form.validateFields();
            createTypeMutation.mutate({
                data: [{
                    name: values.name,
                    key: values.name.toLowerCase().replace(/\s+/g, '_'),
                    description: values.description,
                }],
            });
        } catch {
            // Validation failed
        }
    };

    return (
        <>
            <Modal
                title={t('bulkAssign.assignType')}
                open={open}
                onOk={handleOk}
                onCancel={onCancel}
                confirmLoading={assigning}
                okText={t('common:actions.assign')}
                cancelText={t('common:actions.cancel')}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Typography.Text strong>
                        {t('bulkAssign.selectedTargetsCount', { count: targetIds.length })}
                    </Typography.Text>
                    <Select
                        placeholder={t('bulkAssign.selectTypePlaceholder')}
                        style={{ width: '100%' }}
                        loading={typesLoading}
                        value={selectedTypeId}
                        onChange={setSelectedTypeId}
                        options={(typesData?.content as MgmtTargetType[] || []).map((type) => ({
                            value: type.id,
                            label: type.name,
                        }))}
                        dropdownRender={(menu) => (
                            <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    onClick={() => setCreateTypeModalOpen(true)}
                                    style={{ width: '100%', textAlign: 'left' }}
                                >
                                    {t('bulkAssign.createNewType', { defaultValue: 'Create New Type' })}
                                </Button>
                            </>
                        )}
                    />
                </Space>
            </Modal>
            <Modal
                title={t('bulkAssign.createNewType', { defaultValue: 'Create New Type' })}
                open={createTypeModalOpen}
                onOk={handleCreateType}
                onCancel={() => {
                    setCreateTypeModalOpen(false);
                    form.resetFields();
                }}
                confirmLoading={createTypeMutation.isPending}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label={t('typeManagement.nameLabel', { defaultValue: 'Name' })}
                        rules={[{ required: true, message: t('typeManagement.nameRequired', { defaultValue: 'Name is required' }) }]}
                    >
                        <Input placeholder={t('typeManagement.namePlaceholder', { defaultValue: 'Enter type name' })} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label={t('typeManagement.descLabel', { defaultValue: 'Description' })}
                    >
                        <Input.TextArea rows={3} placeholder={t('typeManagement.descPlaceholder', { defaultValue: 'Enter description (optional)' })} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default BulkAssignTypeModal;

