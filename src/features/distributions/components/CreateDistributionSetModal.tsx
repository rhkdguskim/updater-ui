import React from 'react';
import { Modal, Form, Input, Select, Checkbox, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import { useGetDistributionSetTypes } from '@/api/generated/distribution-set-types/distribution-set-types';
import type { MgmtDistributionSetRequestBodyPost } from '@/api/generated/model';

interface CreateDistributionSetModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const CreateDistributionSetModal: React.FC<CreateDistributionSetModalProps> = ({
    visible,
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation('distributions');
    const [form] = Form.useForm();
    const { data: typesData, isLoading: isTypesLoading } = useGetDistributionSetTypes({ limit: 100 });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { mutate: createDistributionSet, isPending: isCreating } = useCreateDistributionSets({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.createSetSuccess'));
                form.resetFields();
                onSuccess();
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.createSetError'));
            },
        },
    });

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload: MgmtDistributionSetRequestBodyPost = {
                name: values.name,
                version: values.version,
                type: values.type,
                description: values.description,
                requiredMigrationStep: values.requiredMigrationStep,
            };
            createDistributionSet({ data: [payload] });
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title={t('modal.createSetTitle')}
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
                <Form.Item name="description" label={t('modal.description')}>
                    <Input.TextArea rows={3} placeholder={t('modal.placeholders.description')} />
                </Form.Item>
                <Form.Item name="requiredMigrationStep" valuePropName="checked">
                    <Checkbox>{t('modal.requiredMigration')}</Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateDistributionSetModal;
