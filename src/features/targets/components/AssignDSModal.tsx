import React, { useState } from 'react';
import {
    Modal,
    Form,
    Select,
    Button,
    Space,
    Alert,
    Typography,
    Divider,
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { MgmtDistributionSet } from '@/api/generated/model';

const { Text } = Typography;

export type AssignType = 'soft' | 'forced' | 'downloadonly';

interface AssignDSModalProps {
    open: boolean;
    targetId: string;
    distributionSets: MgmtDistributionSet[];
    loading: boolean;
    dsLoading?: boolean;
    canForced: boolean;
    onConfirm: (dsId: number, type: AssignType) => void;
    onCancel: () => void;
}

import { useTranslation } from 'react-i18next';
// ...

const AssignDSModal: React.FC<AssignDSModalProps> = ({
    open,
    targetId,
    distributionSets,
    loading,
    dsLoading,
    canForced,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const [form] = Form.useForm();
    const [selectedType, setSelectedType] = useState<AssignType>('soft');

    const assignTypeOptions = [
        {
            value: 'soft',
            label: t('assign.soft'),
            description: t('assign.softDesc'),
        },
        {
            value: 'forced',
            label: t('assign.forced'),
            description: t('assign.forcedDesc'),
        },
        {
            value: 'downloadonly',
            label: t('assign.downloadOnly'),
            description: t('assign.downloadOnlyDesc'),
        },
    ];

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onConfirm(values.distributionSetId, values.type);
        } catch {
            // Validation error
        }
    };

    const handleTypeChange = (value: AssignType) => {
        setSelectedType(value);
        form.setFieldValue('type', value);
    };

    const filteredTypeOptions = canForced
        ? assignTypeOptions
        : assignTypeOptions.filter((opt) => opt.value !== 'forced');

    return (
        <Modal
            title={t('assign.title')}
            open={open}
            onCancel={onCancel}
            footer={
                <Space>
                    <Button onClick={onCancel} disabled={loading}>
                        {t('common:actions.cancel')}
                    </Button>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSubmit}
                        loading={loading}
                    >
                        {t('common:actions.assign')}
                    </Button>
                </Space>
            }
            width={500}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ type: 'soft' }}
                preserve={false}
            >
                <Alert
                    type="info"
                    message={
                        <>
                            Assigning to target: <Text strong>{targetId}</Text>
                        </>
                    }
                    style={{ marginBottom: 16 }}
                />

                <Form.Item
                    name="distributionSetId"
                    label={t('assign.selectDS')}
                    rules={[{ required: true, message: t('common:validation.required') }]}
                >
                    <Select
                        placeholder={t('assign.selectDS')}
                        loading={dsLoading}
                        showSearch
                        optionFilterProp="label"
                        options={distributionSets.map((ds) => ({
                            value: ds.id,
                            label: `${ds.name} (v${ds.version})`,
                        }))}
                    />
                </Form.Item>

                <Divider />

                <Form.Item
                    name="type"
                    label={t('assign.assignType')}
                    rules={[{ required: true, message: t('common:validation.required') }]}
                >
                    <Select
                        value={selectedType}
                        onChange={handleTypeChange}
                        options={filteredTypeOptions.map((opt) => ({
                            value: opt.value,
                            label: (
                                <div>
                                    <Text strong>{opt.label}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {opt.description}
                                    </Text>
                                </div>
                            ),
                        }))}
                    />
                </Form.Item>

                {!canForced && (
                    <Alert
                        type="warning"
                        message={t('assign.forcedWarning')}
                        style={{ marginTop: 16 }}
                    />
                )}
            </Form>
        </Modal>
    );
};

export default AssignDSModal;
