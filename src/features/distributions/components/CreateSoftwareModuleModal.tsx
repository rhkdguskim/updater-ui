import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateSoftwareModules } from '@/api/generated/software-modules/software-modules';
import { useGetTypes } from '@/api/generated/software-module-types/software-module-types';
import type { MgmtSoftwareModuleRequestBodyPost } from '@/api/generated/model';

interface CreateSoftwareModuleModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const CreateSoftwareModuleModal: React.FC<CreateSoftwareModuleModalProps> = ({
    visible,
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation('distributions');
    const [form] = Form.useForm();
    const { data: typesData, isLoading: isTypesLoading } = useGetTypes({ limit: 100 });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { mutate: createSoftwareModule, isPending: isCreating } = useCreateSoftwareModules({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.createModuleSuccess'));
                form.resetFields();
                onSuccess();
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.createModuleError'));
            },
        },
    });

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload: MgmtSoftwareModuleRequestBodyPost = {
                name: values.name,
                version: values.version,
                type: values.type,
                description: values.description,
                vendor: values.vendor,
                encrypted: false,
            };
            createSoftwareModule({ data: [payload] });
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title={t('modal.createModuleTitle')}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={isCreating}
            destroyOnHidden
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label={t('modal.name')}
                    rules={[{ required: true, message: t('modal.placeholders.name') }]}
                >
                    <Input placeholder={t('modal.placeholders.name')} />
                </Form.Item>
                <Form.Item
                    name="version"
                    label={t('modal.version')}
                    rules={[{ required: true, message: t('modal.placeholders.version') }]}
                >
                    <Input placeholder={t('modal.placeholders.version')} />
                </Form.Item>
                <Form.Item
                    name="type"
                    label={t('modal.type')}
                    rules={[{ required: true, message: t('modal.placeholders.type') }]}
                >
                    <Select
                        placeholder={t('modal.placeholders.type')}
                        loading={isTypesLoading}
                        options={typesData?.content?.map((t) => ({ label: t.name, value: t.key }))}
                    />
                </Form.Item>
                <Form.Item name="vendor" label={t('modal.vendor')}>
                    <Input placeholder={t('modal.placeholders.vendor')} />
                </Form.Item>
                <Form.Item name="description" label={t('modal.description')}>
                    <Input.TextArea rows={3} placeholder={t('modal.placeholders.description')} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateSoftwareModuleModal;
