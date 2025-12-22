import React from 'react';
import { Modal, Form, Input, Alert } from 'antd';
import type { MgmtTarget } from '@/api/generated/model';

interface TargetFormModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    target?: MgmtTarget | null;
    loading: boolean;
    onSubmit: (values: { controllerId?: string; name?: string; description?: string }) => void;
    onCancel: () => void;
}

import { useTranslation } from 'react-i18next';
// ...

const TargetFormModal: React.FC<TargetFormModalProps> = ({
    open,
    mode,
    target,
    loading,
    onSubmit,
    onCancel,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values);
        } catch {
            // Validation error
        }
    };

    const isEdit = mode === 'edit';

    return (
        <Modal
            title={isEdit ? t('modal.editTitle') : t('modal.createTitle')}
            open={open}
            onOk={handleSubmit}
            onCancel={onCancel}
            okText={isEdit ? t('common:actions.update') : t('common:actions.create')}
            okButtonProps={{ loading }}
            cancelButtonProps={{ disabled: loading }}
            destroyOnHidden
            afterOpenChange={(open) => {
                if (open && isEdit && target) {
                    form.setFieldsValue({
                        controllerId: target.controllerId,
                        name: target.name,
                        description: target.description,
                    });
                }
            }}
        >
            <Form
                form={form}
                layout="vertical"
                preserve={false}
                initialValues={
                    isEdit && target
                        ? {
                            controllerId: target.controllerId,
                            name: target.name,
                            description: target.description,
                        }
                        : {}
                }
            >
                <Form.Item
                    name="controllerId"
                    label={t('form.controllerId')}
                    rules={[
                        { required: true, message: t('common:validation.required') },
                        {
                            pattern: /^[a-zA-Z0-9_-]+$/,
                            message: t('form.validation.controllerIdPattern'),
                        },
                    ]}
                >
                    <Input
                        placeholder={t('form.controllerIdPlaceholder')}
                        disabled={isEdit}
                        maxLength={64}
                    />
                </Form.Item>

                {isEdit && (
                    <Alert
                        type="info"
                        message={t('form.controllerIdHelp')}
                        style={{ marginBottom: 16, marginTop: -8 }}
                    />
                )}

                <Form.Item
                    name="name"
                    label={t('form.name')}
                    rules={[{ max: 128, message: t('form.validation.nameMaxLength') }]}
                >
                    <Input placeholder={t('form.namePlaceholder')} maxLength={128} />
                </Form.Item>

                <Form.Item
                    name="description"
                    label={t('form.description')}
                    rules={[{ max: 512, message: t('form.validation.descriptionMaxLength') }]}
                >
                    <Input.TextArea
                        placeholder={t('form.descriptionPlaceholder')}
                        rows={3}
                        maxLength={512}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default TargetFormModal;
