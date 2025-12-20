import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Steps,
    Form,
    Input,
    InputNumber,
    Button,
    Space,
    Typography,
    Table,
    Tag,
    Descriptions,
    message,
    Spin,
    Alert,
    Checkbox,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCreate, useStart } from '@/api/generated/rollouts/rollouts';
import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import { useGetTargets } from '@/api/generated/targets/targets';
import type { MgmtDistributionSet } from '@/api/generated/model';
import { useQueryClient } from '@tanstack/react-query';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface WizardFormData {
    name: string;
    description?: string;
    distributionSetId?: number;
    distributionSetName?: string;
    targetFilterQuery?: string;
    amountGroups: number;
    successThreshold: number;
    errorThreshold: number;
    startImmediately: boolean;
}

const RolloutWizard: React.FC = () => {
    const { t } = useTranslation('rollouts');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<WizardFormData>({
        name: '',
        description: '',
        distributionSetId: undefined,
        distributionSetName: '',
        targetFilterQuery: '',
        amountGroups: 5,
        successThreshold: 80,
        errorThreshold: 20,
        startImmediately: false,
    });

    // Form instances for each step
    const [basicInfoForm] = Form.useForm();
    const [groupSettingsForm] = Form.useForm();

    // Fetch distribution sets
    const { data: dsData, isLoading: dsLoading } = useGetDistributionSets({
        limit: 100,
    });

    // Fetch target count for preview
    const { data: targetPreviewData, isLoading: targetPreviewLoading, refetch: refetchTargets } = useGetTargets(
        {
            limit: 1,
            q: formData.targetFilterQuery || undefined,
        },
        { query: { enabled: false } }
    );

    // Create mutation
    const createMutation = useCreate({
        mutation: {
            onSuccess: (data) => {
                message.success(t('wizard.messages.createSuccess'));
                queryClient.invalidateQueries();
                if (formData.startImmediately && data.id) {
                    startMutation.mutate({ rolloutId: data.id });
                } else {
                    navigate(`/rollouts/${data.id}`);
                }
            },
            onError: (err: unknown) => {
                console.error('Rollout creation error:', err);
                const error = err as { response?: { data?: { message?: string; exceptionClass?: string }; status?: number }; message?: string };
                const errorMessage = error.response?.data?.message
                    || error.response?.data?.exceptionClass
                    || error.message
                    || t('wizard.messages.createError');
                const status = error.response?.status;

                if (status === 403) {
                    message.error(`Permission denied: You need CREATE_ROLLOUT permission. (${errorMessage})`);
                } else if (status === 400) {
                    message.error(`Bad request: ${errorMessage}`);
                } else {
                    message.error(errorMessage);
                }
            },
        },
    });

    // Start mutation (for start immediately option)
    const startMutation = useStart({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.startSuccess'));
                navigate('/rollouts');
            },
            onError: () => {
                message.error(t('detail.messages.startError'));
            },
        },
    });

    const steps = [
        { title: t('wizard.steps.basicInfo') },
        { title: t('wizard.steps.distributionSet') },
        { title: t('wizard.steps.targetFilter') },
        { title: t('wizard.steps.groupSettings') },
        { title: t('wizard.steps.review') },
    ];

    const handlePreviewTargets = () => {
        refetchTargets();
    };

    const handleNext = async () => {
        if (currentStep === 0) {
            try {
                const values = await basicInfoForm.validateFields();
                setFormData((prev) => ({ ...prev, ...values }));
                setCurrentStep(currentStep + 1);
            } catch {
                // validation failed
            }
        } else if (currentStep === 1) {
            if (!formData.distributionSetId) {
                message.warning(t('wizard.distributionSet.selectRequired'));
                return;
            }
            setCurrentStep(currentStep + 1);
        } else if (currentStep === 2) {
            setCurrentStep(currentStep + 1);
        } else if (currentStep === 3) {
            try {
                const values = await groupSettingsForm.validateFields();
                setFormData((prev) => ({ ...prev, ...values }));
                setCurrentStep(currentStep + 1);
            } catch {
                // validation failed
            }
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleCreate = () => {
        createMutation.mutate({
            data: {
                name: formData.name,
                description: formData.description || undefined,
                distributionSetId: formData.distributionSetId,
                targetFilterQuery: formData.targetFilterQuery || undefined,
                amountGroups: formData.amountGroups,
                successCondition: {
                    condition: 'THRESHOLD',
                    expression: String(formData.successThreshold),
                },
                errorCondition: {
                    condition: 'THRESHOLD',
                    expression: String(formData.errorThreshold),
                },
            },
        });
    };

    const handleSelectDS = (ds: MgmtDistributionSet) => {
        setFormData((prev) => ({
            ...prev,
            distributionSetId: ds.id,
            distributionSetName: `${ds.name} (v${ds.version})`,
        }));
    };

    // Step 1: Basic Info
    const renderBasicInfoStep = () => (
        <Card title={t('wizard.basicInfo.title')}>
            <Form
                form={basicInfoForm}
                layout="vertical"
                initialValues={{ name: formData.name, description: formData.description }}
            >
                <Form.Item
                    name="name"
                    label={t('wizard.basicInfo.name')}
                    rules={[{ required: true, message: t('wizard.basicInfo.nameRequired') }]}
                >
                    <Input placeholder={t('wizard.basicInfo.namePlaceholder')} />
                </Form.Item>
                <Form.Item name="description" label={t('wizard.basicInfo.description')}>
                    <TextArea rows={4} placeholder={t('wizard.basicInfo.descriptionPlaceholder')} />
                </Form.Item>
            </Form>
        </Card>
    );

    // Step 2: Distribution Set Selection
    const renderDistributionSetStep = () => (
        <Card title={t('wizard.distributionSet.title')}>
            {formData.distributionSetId && (
                <Alert
                    type="success"
                    message={`${t('wizard.distributionSet.selected')}: ${formData.distributionSetName}`}
                    style={{ marginBottom: 16 }}
                />
            )}
            {dsLoading ? (
                <Spin />
            ) : (
                <Table
                    dataSource={dsData?.content || []}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    rowSelection={{
                        type: 'radio',
                        selectedRowKeys: formData.distributionSetId ? [formData.distributionSetId] : [],
                        onChange: (_, selectedRows) => {
                            if (selectedRows[0]) {
                                handleSelectDS(selectedRows[0]);
                            }
                        },
                    }}
                    columns={[
                        { title: 'ID', dataIndex: 'id', width: 60 },
                        { title: 'Name', dataIndex: 'name' },
                        { title: 'Version', dataIndex: 'version', width: 100 },
                        {
                            title: 'Type',
                            dataIndex: 'type',
                            width: 120,
                            render: (type: string) => <Tag>{type}</Tag>,
                        },
                    ]}
                />
            )}
        </Card>
    );

    // Step 3: Target Filter
    const renderTargetFilterStep = () => (
        <Card title={t('wizard.targetFilter.title')}>
            <Form layout="vertical">
                <Form.Item label={t('wizard.targetFilter.filterQuery')}>
                    <Input
                        value={formData.targetFilterQuery}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, targetFilterQuery: e.target.value }))
                        }
                        placeholder={t('wizard.targetFilter.filterPlaceholder')}
                    />
                </Form.Item>
                <Space>
                    <Button onClick={handlePreviewTargets} loading={targetPreviewLoading}>
                        {t('wizard.targetFilter.preview')}
                    </Button>
                    {targetPreviewData && (
                        <Text>
                            {t('wizard.targetFilter.targetCount', { count: targetPreviewData.total || 0 })}
                        </Text>
                    )}
                </Space>
            </Form>
        </Card>
    );

    // Step 4: Group Settings
    const renderGroupSettingsStep = () => (
        <Card title={t('wizard.groupSettings.title')}>
            <Form
                form={groupSettingsForm}
                layout="vertical"
                initialValues={{
                    amountGroups: formData.amountGroups,
                    successThreshold: formData.successThreshold,
                    errorThreshold: formData.errorThreshold,
                    startImmediately: formData.startImmediately,
                }}
            >
                <Form.Item
                    name="amountGroups"
                    label={t('wizard.groupSettings.amountGroups')}
                    rules={[{ required: true }]}
                >
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    name="successThreshold"
                    label={t('wizard.groupSettings.successThreshold')}
                    rules={[{ required: true }]}
                >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    name="errorThreshold"
                    label={t('wizard.groupSettings.errorThreshold')}
                    rules={[{ required: true }]}
                >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="startImmediately" valuePropName="checked">
                    <Checkbox>{t('wizard.groupSettings.startImmediately')}</Checkbox>
                </Form.Item>
            </Form>
        </Card>
    );

    // Step 5: Review
    const renderReviewStep = () => (
        <Card title={t('wizard.review.title')}>
            <Descriptions bordered column={1}>
                <Descriptions.Item label={t('wizard.review.name')}>{formData.name}</Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.description')}>
                    {formData.description || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.distributionSet')}>
                    {formData.distributionSetName}
                </Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.targetFilter')}>
                    {formData.targetFilterQuery || t('wizard.review.allTargets')}
                </Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.groups')}>{formData.amountGroups}</Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.successThreshold')}>
                    {formData.successThreshold}%
                </Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.errorThreshold')}>
                    {formData.errorThreshold}%
                </Descriptions.Item>
            </Descriptions>
        </Card>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderBasicInfoStep();
            case 1:
                return renderDistributionSetStep();
            case 2:
                return renderTargetFilterStep();
            case 3:
                return renderGroupSettingsStep();
            case 4:
                return renderReviewStep();
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rollouts')}>
                        {t('detail.back')}
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        {t('wizard.title')}
                    </Title>
                </Space>

                <Steps current={currentStep} items={steps} />

                {renderStepContent()}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {currentStep > 0 && (
                        <Button onClick={handlePrev}>{t('wizard.buttons.previous')}</Button>
                    )}
                    {currentStep < steps.length - 1 && (
                        <Button type="primary" onClick={handleNext}>
                            {t('wizard.buttons.next')}
                        </Button>
                    )}
                    {currentStep === steps.length - 1 && (
                        <Button
                            type="primary"
                            onClick={handleCreate}
                            loading={createMutation.isPending || startMutation.isPending}
                        >
                            {t('wizard.buttons.create')}
                        </Button>
                    )}
                </div>
            </Space>
        </div>
    );
};

export default RolloutWizard;
