import React from 'react';
import { Modal, Form, Input, message, ColorPicker, Select, Divider, Typography, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    useCreateDistributionSetTypes,
    useUpdateDistributionSetType,
    useGetMandatoryModules,
    useGetOptionalModules,
} from '@/api/generated/distribution-set-types/distribution-set-types';
import { useGetTypes } from '@/api/generated/software-module-types/software-module-types';
import type { MgmtDistributionSetType } from '@/api/generated/model';

const { Text } = Typography;

interface DistributionSetTypeDialogProps {
    open: boolean;
    editingType: MgmtDistributionSetType | null;
    onClose: () => void;
    onSuccess: () => void;
}

const DistributionSetTypeDialog: React.FC<DistributionSetTypeDialogProps> = ({
    open,
    editingType,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation(['distributions', 'common']);
    const [form] = Form.useForm();
    const isEditing = !!editingType;

    // Fetch all Software Module Types
    const { data: smTypesData, isLoading: smTypesLoading } = useGetTypes(
        { limit: 100 },
        { query: { enabled: open } }
    );

    // Fetch existing mandatory/optional module types when editing
    const { data: mandatoryModules, isLoading: mandatoryLoading } = useGetMandatoryModules(
        editingType?.id ?? 0,
        { query: { enabled: open && isEditing && !!editingType?.id } }
    );

    const { data: optionalModules, isLoading: optionalLoading } = useGetOptionalModules(
        editingType?.id ?? 0,
        { query: { enabled: open && isEditing && !!editingType?.id } }
    );

    const smTypeOptions = React.useMemo(() => {
        return (smTypesData?.content || []).map(t => ({
            label: `${t.name} (${t.key})`,
            value: t.id,
        }));
    }, [smTypesData]);

    React.useEffect(() => {
        if (open && editingType) {
            form.setFieldsValue({
                name: editingType.name,
                key: editingType.key,
                description: editingType.description,
                colour: editingType.colour,
            });
        } else if (open) {
            form.resetFields();
        }
    }, [open, editingType, form]);

    // Set existing module types when loaded
    React.useEffect(() => {
        if (open && isEditing && mandatoryModules && optionalModules) {
            const mandatoryIds = (mandatoryModules || []).map(m => m.id);
            const optionalIds = (optionalModules || []).map(m => m.id);
            form.setFieldsValue({
                mandatoryModuleTypeIds: mandatoryIds,
                optionalModuleTypeIds: optionalIds,
            });
        }
    }, [open, isEditing, mandatoryModules, optionalModules, form]);

    const createMutation = useCreateDistributionSetTypes({
        mutation: {
            onSuccess: () => {
                message.success(t('typeManagement.createSuccess'));
                onSuccess();
            },
            onError: (error) => {
                message.error((error as Error).message || t('typeManagement.createError'));
            },
        },
    });

    const updateMutation = useUpdateDistributionSetType({
        mutation: {
            onSuccess: () => {
                message.success(t('typeManagement.updateSuccess'));
                onSuccess();
            },
            onError: (error) => {
                message.error((error as Error).message || t('typeManagement.updateError'));
            },
        },
    });

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const colourValue = typeof values.colour === 'string'
                ? values.colour
                : values.colour?.toHexString?.() || undefined;

            if (isEditing) {
                // Note: HawkBit API does not support updating module types after creation
                updateMutation.mutate({
                    distributionSetTypeId: editingType.id,
                    data: {
                        description: values.description,
                        colour: colourValue,
                    },
                });
            } else {
                // Validate: At least one module type must be selected
                const mandatoryIds = values.mandatoryModuleTypeIds || [];
                const optionalIds = values.optionalModuleTypeIds || [];

                if (mandatoryIds.length === 0 && optionalIds.length === 0) {
                    message.error(t('typeManagement.moduleTypeRequired'));
                    return;
                }

                // Convert selected SM Type IDs to API format
                const mandatorymodules = mandatoryIds.map((id: number) => ({ id }));
                const optionalmodules = optionalIds.map((id: number) => ({ id }));

                createMutation.mutate({
                    data: [{
                        name: values.name,
                        key: values.key,
                        description: values.description,
                        colour: colourValue,
                        mandatorymodules,
                        optionalmodules,
                    }],
                });
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const isLoadingModuleTypes = isEditing && (mandatoryLoading || optionalLoading);

    return (
        <Modal
            title={isEditing ? t('typeManagement.editType') : t('typeManagement.addType')}
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={createMutation.isPending || updateMutation.isPending}
            destroyOnHidden
            width={600}
        >
            <Spin spinning={isLoadingModuleTypes}>
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label={t('typeManagement.columns.name')}
                        rules={[{ required: true, message: t('typeManagement.nameRequired') }]}
                    >
                        <Input disabled={isEditing} placeholder={t('typeManagement.namePlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="key"
                        label={t('typeManagement.columns.key')}
                        rules={[{ required: true, message: t('typeManagement.keyRequired') }]}
                    >
                        <Input disabled={isEditing} placeholder={t('typeManagement.keyPlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label={t('typeManagement.columns.description')}
                    >
                        <Input.TextArea rows={3} placeholder={t('typeManagement.descriptionPlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="colour"
                        label={t('typeManagement.columns.colour')}
                    >
                        <ColorPicker format="hex" />
                    </Form.Item>

                    <Divider />
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        {isEditing
                            ? t('typeManagement.moduleTypesReadonly')
                            : t('typeManagement.moduleTypesHint')}
                    </Text>

                    <Form.Item
                        name="mandatoryModuleTypeIds"
                        label={t('typeManagement.mandatoryModuleTypes')}
                        tooltip={t('typeManagement.mandatoryModuleTypesTooltip')}
                    >
                        <Select
                            mode="multiple"
                            placeholder={t('typeManagement.selectModuleTypes')}
                            options={smTypeOptions}
                            loading={smTypesLoading || mandatoryLoading}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            disabled={isEditing}
                        />
                    </Form.Item>

                    <Form.Item
                        name="optionalModuleTypeIds"
                        label={t('typeManagement.optionalModuleTypes')}
                        tooltip={t('typeManagement.optionalModuleTypesTooltip')}
                    >
                        <Select
                            mode="multiple"
                            placeholder={t('typeManagement.selectModuleTypes')}
                            options={smTypeOptions}
                            loading={smTypesLoading || optionalLoading}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            disabled={isEditing}
                        />
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default DistributionSetTypeDialog;
