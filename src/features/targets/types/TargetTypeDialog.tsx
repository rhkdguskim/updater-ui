import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Spin, Typography, Divider, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { MgmtTargetType, MgmtTargetTypeRequestBodyPost, MgmtTargetTypeRequestBodyPut, MgmtDistributionSetType } from '@/api/generated/model';
import { useGetDistributionSetTypes } from '@/api/generated/distribution-set-types/distribution-set-types';
import { useGetCompatibleDistributionSets } from '@/api/generated/target-types/target-types';

const { Text } = Typography;

interface TargetTypeDialogProps {
    open: boolean;
    mode: 'create' | 'edit';
    initialData?: MgmtTargetType | null;
    loading?: boolean;
    onSubmit: (values: MgmtTargetTypeRequestBodyPost | MgmtTargetTypeRequestBodyPut, compatibleDsTypeIds?: number[]) => void;
    onCancel: () => void;
}

const TargetTypeDialog: React.FC<TargetTypeDialogProps> = ({
    open,
    mode,
    initialData,
    loading = false,
    onSubmit,
    onCancel,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const [form] = Form.useForm();
    const [selectedDsTypes, setSelectedDsTypes] = useState<number[]>([]);

    // Fetch all DS Types for the selector
    const { data: dsTypesData, isLoading: isDsTypesLoading } = useGetDistributionSetTypes(
        { limit: 100 },
        { query: { enabled: open } }
    );

    // Fetch compatible DS Types for edit mode
    const { data: compatibleDsTypes, isLoading: isCompatibleLoading } = useGetCompatibleDistributionSets(
        initialData?.id ?? 0,
        { query: { enabled: open && mode === 'edit' && !!initialData?.id } }
    );

    const dsTypes = dsTypesData?.content || [];

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                form.setFieldsValue({
                    name: initialData.name,
                    key: initialData.key,
                    description: initialData.description,
                    colour: initialData.colour,
                });
                // Set compatible DS types from fetched data
                if (compatibleDsTypes) {
                    setSelectedDsTypes(compatibleDsTypes.map(dt => dt.id));
                }
            } else {
                form.resetFields();
                setSelectedDsTypes([]);
            }
        }
    }, [open, mode, initialData, form, compatibleDsTypes]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values, selectedDsTypes);
        } catch {
            // Validation failed
        }
    };

    const handleDsTypeChange = (value: number[]) => {
        setSelectedDsTypes(value);
    };

    return (
        <Modal
            title={mode === 'create' ? t('typeManagement.createTitle') : t('typeManagement.editTitle')}
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={loading}
            destroyOnHidden
            width={560}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label={t('table.name')}
                    rules={[{ required: true, message: t('common:validation.required') }]}
                >
                    <Input placeholder={t('form.namePlaceholder')} />
                </Form.Item>

                {mode === 'create' && (
                    <Form.Item
                        name="key"
                        label={t('typeManagement.key')}
                        rules={[{ required: true, message: t('common:validation.required') }]}
                    >
                        <Input placeholder={t('typeManagement.keyPlaceholder')} />
                    </Form.Item>
                )}

                <Form.Item
                    name="description"
                    label={t('form.description')}
                >
                    <Input.TextArea rows={3} placeholder={t('form.descriptionPlaceholder')} />
                </Form.Item>

                <Form.Item
                    name="colour"
                    label={t('typeManagement.colour')}
                >
                    <Input type="color" style={{ width: 60, padding: 2 }} />
                </Form.Item>

                <Divider style={{ margin: '16px 0' }} />

                <Form.Item
                    label={
                        <span>
                            {t('typeManagement.compatibleDsTypes', 'Compatible Distribution Set Types')}
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                ({t('typeManagement.compatibleDsTypesHint', 'Only these DS types can be deployed to targets of this type')})
                            </Text>
                        </span>
                    }
                >
                    <Spin spinning={isDsTypesLoading || isCompatibleLoading}>
                        <Select
                            mode="multiple"
                            placeholder={t('typeManagement.selectDsTypes', 'Select compatible DS types...')}
                            value={selectedDsTypes}
                            onChange={handleDsTypeChange}
                            style={{ width: '100%' }}
                            optionFilterProp="label"
                            options={dsTypes.map((dsType: MgmtDistributionSetType) => ({
                                value: dsType.id,
                                label: dsType.name,
                            }))}
                            tagRender={(props) => {
                                const dsType = dsTypes.find((dt: MgmtDistributionSetType) => dt.id === props.value);
                                return (
                                    <Tag
                                        color={dsType?.colour || 'blue'}
                                        closable={props.closable}
                                        onClose={props.onClose}
                                        style={{ marginRight: 3 }}
                                    >
                                        {props.label}
                                    </Tag>
                                );
                            }}
                        />
                    </Spin>
                    {selectedDsTypes.length === 0 && (
                        <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            {t('typeManagement.noCompatibleWarning', 'If no DS types are selected, targets of this type will be incompatible with all deployments.')}
                        </Text>
                    )}
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default TargetTypeDialog;
