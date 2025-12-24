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
    Switch,
    Input,
    InputNumber,
    DatePicker,
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { MgmtDistributionSet } from '@/api/generated/model';
import type { MgmtMaintenanceWindowRequestBody } from '@/api/generated/model';
import dayjs from 'dayjs';

const { Text } = Typography;

export type AssignType = 'soft' | 'forced' | 'timeforced' | 'downloadonly';

interface AssignDSModalProps {
    open: boolean;
    targetId: string;
    distributionSets: MgmtDistributionSet[];
    loading: boolean;
    dsLoading?: boolean;
    canForced: boolean;
    onConfirm: (payload: AssignPayload) => void;
    onCancel: () => void;
}

import { useTranslation } from 'react-i18next';
// ...

export interface AssignPayload {
    dsId: number;
    type: AssignType;
    confirmationRequired?: boolean;
    weight?: number;
    forcetime?: number;
    maintenanceWindow?: MgmtMaintenanceWindowRequestBody;
}

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
    const [showAdvanced, setShowAdvanced] = useState(false);

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
            value: 'timeforced',
            label: t('assign.timeforced'),
            description: t('assign.timeforcedDesc'),
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
            const includeAdvanced = showAdvanced || values.type === 'timeforced';
            const maintenanceWindow = includeAdvanced ? values.maintenanceWindow : undefined;
            const hasMaintenanceWindow =
                maintenanceWindow &&
                (maintenanceWindow.schedule || maintenanceWindow.duration || maintenanceWindow.timezone);

            onConfirm({
                dsId: values.distributionSetId,
                type: values.type,
                confirmationRequired: includeAdvanced ? values.confirmationRequired : undefined,
                weight: includeAdvanced ? values.weight : undefined,
                forcetime:
                    values.type === 'timeforced' && values.forcetime
                        ? dayjs(values.forcetime).valueOf()
                        : undefined,
                maintenanceWindow: hasMaintenanceWindow ? maintenanceWindow : undefined,
            });
        } catch {
            // Validation error
        }
    };

    const handleTypeChange = (value: AssignType) => {
        setSelectedType(value);
        form.setFieldValue('type', value);
    };

    const handleAdvancedToggle = (checked: boolean) => {
        setShowAdvanced(checked);
        if (!checked) {
            form.setFieldsValue({
                confirmationRequired: undefined,
                weight: undefined,
                forcetime: undefined,
                maintenanceWindow: {
                    schedule: undefined,
                    duration: undefined,
                    timezone: undefined,
                },
            });
        }
    };

    const filteredTypeOptions = canForced
        ? assignTypeOptions
        : assignTypeOptions.filter((opt) => opt.value !== 'forced' && opt.value !== 'timeforced');

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
            destroyOnHidden
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
                            {t('assign.targetLabel')} <Text strong>{targetId}</Text>
                        </>
                    }
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

                <Divider />

                <Form.Item label={t('assign.advancedOptions')}>
                    <Space>
                        <Switch checked={showAdvanced} onChange={handleAdvancedToggle} />
                        <Text type="secondary">{t('assign.advancedDesc')}</Text>
                    </Space>
                </Form.Item>

                {(showAdvanced || selectedType === 'timeforced') && (
                    <>
                        <Form.Item
                            name="confirmationRequired"
                            label={t('assign.confirmationRequired')}
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item name="weight" label={t('assign.weight')}>
                            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="forcetime"
                            label={t('assign.forcetime')}
                            dependencies={['type']}
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (getFieldValue('type') === 'timeforced' && !value) {
                                            return Promise.reject(new Error(t('assign.forcetimeRequired')));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <DatePicker
                                showTime
                                style={{ width: '100%' }}
                                placeholder={t('assign.forcetimePlaceholder')}
                            />
                        </Form.Item>

                        <Form.Item
                            name={['maintenanceWindow', 'schedule']}
                            label={t('assign.maintenanceSchedule')}
                        >
                            <Input placeholder={t('assign.maintenanceSchedulePlaceholder')} />
                        </Form.Item>
                        <Form.Item
                            name={['maintenanceWindow', 'duration']}
                            label={t('assign.maintenanceDuration')}
                        >
                            <Input placeholder={t('assign.maintenanceDurationPlaceholder')} />
                        </Form.Item>
                        <Form.Item
                            name={['maintenanceWindow', 'timezone']}
                            label={t('assign.maintenanceTimezone')}
                        >
                            <Input placeholder={t('assign.maintenanceTimezonePlaceholder')} />
                        </Form.Item>
                    </>
                )}

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
