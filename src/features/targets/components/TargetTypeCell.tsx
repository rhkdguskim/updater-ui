import React, { useState } from 'react';
import { Tag, Popover, Select, Button, Space, Typography, message, Divider, Modal, Form, Input, ColorPicker } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useGetTargetTypes, useCreateTargetTypes, getGetTargetTypesQueryKey } from '@/api/generated/target-types/target-types';
import { useAssignTargetType, useUnassignTargetType, getGetTargetsQueryKey } from '@/api/generated/targets/targets';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/useAuthStore';
import type { MgmtTargetType } from '@/api/generated/model';

const { Text } = Typography;

interface TargetTypeCellProps {
    controllerId: string;
    currentTypeId?: number;
    currentTypeName?: string;
    currentTypeColour?: string;
}

export const TargetTypeCell: React.FC<TargetTypeCellProps> = ({
    controllerId,
    currentTypeId,
    currentTypeName,
    currentTypeColour,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const [form] = Form.useForm();

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(currentTypeId);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const { data: typesData, isLoading: typesLoading, refetch: refetchTypes } = useGetTargetTypes({ limit: 100 });

    const assignTypeMutation = useAssignTargetType();
    const unassignTypeMutation = useUnassignTargetType();

    const createTypeMutation = useCreateTargetTypes({
        mutation: {
            onSuccess: async (data) => {
                message.success(t('typeManagement.createSuccess'));
                setCreateModalOpen(false);
                form.resetFields();
                await refetchTypes();
                queryClient.invalidateQueries({ queryKey: getGetTargetTypesQueryKey() });
                // Auto-select the newly created type
                const newType = data?.[0];
                if (newType?.id) {
                    setSelectedTypeId(newType.id);
                }
            },
            onError: (error) => {
                message.error((error as Error).message || t('common:error'));
            },
        },
    });

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setSelectedTypeId(currentTypeId);
        }
        setPopoverOpen(open);
    };

    const handleSave = async () => {
        try {
            if (selectedTypeId && selectedTypeId !== currentTypeId) {
                await assignTypeMutation.mutateAsync({
                    targetId: controllerId,
                    data: { id: selectedTypeId }
                });
                message.success(t('messages.typeUpdated'));
            } else if (!selectedTypeId && currentTypeId) {
                await unassignTypeMutation.mutateAsync({ targetId: controllerId });
                message.success(t('messages.typeRemoved'));
            }
            queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
            setPopoverOpen(false);
        } catch (error) {
            message.error((error as Error).message || t('common:messages.error'));
        }
    };

    const handleCreateType = async () => {
        try {
            const values = await form.validateFields();
            const colourValue = typeof values.colour === 'string'
                ? values.colour
                : values.colour?.toHexString?.() || undefined;

            createTypeMutation.mutate({
                data: [{
                    name: values.name,
                    key: values.key || values.name.toLowerCase().replace(/\s+/g, '_'),
                    description: values.description,
                    colour: colourValue,
                }]
            });
        } catch {
            // Validation failed
        }
    };

    const popoverContent = (
        <div style={{ width: 250 }}>
            <Select
                style={{ width: '100%', marginBottom: 8 }}
                placeholder={t('list.selectType')}
                value={selectedTypeId}
                onChange={setSelectedTypeId}
                loading={typesLoading}
                allowClear
                options={(typesData?.content as MgmtTargetType[] || []).map(type => ({
                    value: type.id,
                    label: <Tag color={type.colour || 'default'}>{type.name}</Tag>,
                }))}
                dropdownRender={(menu) => (
                    <>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <Button
                            type="text"
                            icon={<PlusOutlined />}
                            onClick={() => setCreateModalOpen(true)}
                            style={{ width: '100%' }}
                        >
                            {t('typeManagement.add')}
                        </Button>
                    </>
                )}
            />
            <Space>
                <Button size="small" onClick={() => setPopoverOpen(false)}>
                    {t('common:actions.cancel')}
                </Button>
                <Button
                    type="primary"
                    size="small"
                    onClick={handleSave}
                    loading={assignTypeMutation.isPending || unassignTypeMutation.isPending}
                >
                    {t('common:actions.save')}
                </Button>
            </Space>
        </div>
    );

    if (!isAdmin) {
        return currentTypeName ? (
            <Tag color={currentTypeColour || 'default'}>{currentTypeName}</Tag>
        ) : (
            <Text type="secondary">-</Text>
        );
    }

    return (
        <>
            <Popover
                content={popoverContent}
                title={t('list.editType')}
                trigger="click"
                open={popoverOpen}
                onOpenChange={handleOpenChange}
            >
                {currentTypeName ? (
                    <Tag color={currentTypeColour || 'default'} style={{ cursor: 'pointer' }}>
                        {currentTypeName} <EditOutlined />
                    </Tag>
                ) : (
                    <Tag
                        style={{
                            cursor: 'pointer',
                            background: 'transparent',
                            border: '1px solid var(--ant-color-border, #d9d9d9)',
                        }}
                        icon={currentTypeName ? <EditOutlined /> : <PlusOutlined />}
                    >
                        {currentTypeName ? '' : t('list.addType')}
                    </Tag>
                )}
            </Popover>

            <Modal
                title={t('typeManagement.createTitle')}
                open={createModalOpen}
                onOk={handleCreateType}
                onCancel={() => {
                    setCreateModalOpen(false);
                    form.resetFields();
                }}
                confirmLoading={createTypeMutation.isPending}
                destroyOnHidden
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label={t('table.name')}
                        rules={[{ required: true, message: t('common:validation.required') }]}
                    >
                        <Input placeholder={t('form.namePlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="key"
                        label={t('typeManagement.key')}
                    >
                        <Input placeholder={t('typeManagement.keyPlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label={t('form.description')}
                    >
                        <Input.TextArea rows={2} placeholder={t('form.descriptionPlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="colour"
                        label={t('tagManagement.colour')}
                    >
                        <ColorPicker format="hex" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};
