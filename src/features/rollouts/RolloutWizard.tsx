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
    Select,
    Radio,
} from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCreate, useStart } from '@/api/generated/rollouts/rollouts';
import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetTargetTags } from '@/api/generated/target-tags/target-tags';
import { useGetTargetTypes } from '@/api/generated/target-types/target-types';
import type { MgmtDistributionSet } from '@/api/generated/model';
import { useQueryClient } from '@tanstack/react-query';
import type { RadioChangeEvent } from 'antd/es/radio';

const { Title } = Typography;
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

interface TargetFilterBuilderState {
    tags: number[];
    tagMode: 'any' | 'all';
    targetTypes: string[];
    targetTypeMode: 'any' | 'all';
    statuses: Array<'online' | 'offline'>;
    controllerQuery: string;
    searchKeyword: string;
}

const buildClauseWithMode = (field: string, values: Array<string | number>, mode: 'any' | 'all') => {
    if (!values.length) return '';
    const operator = mode === 'any' ? ',' : ';';
    if (values.length === 1) {
        return `${field}==${values[0]}`;
    }
    return `(${values.map((value) => `${field}==${value}`).join(operator)})`;
};

const buildFiqlFromBuilder = (state: TargetFilterBuilderState) => {
    const clauses: string[] = [];
    const tagClause = buildClauseWithMode('tags.id', state.tags, state.tagMode);
    if (tagClause) clauses.push(tagClause);
    const typeClause = buildClauseWithMode('targettype.key', state.targetTypes, state.targetTypeMode);
    if (typeClause) clauses.push(typeClause);

    if (state.statuses.length && state.statuses.length < 2) {
        const status = state.statuses[0];
        clauses.push(status === 'online' ? 'pollStatus.overdue==false' : 'pollStatus.overdue==true');
    } else if (state.statuses.length === 2) {
        // both selected => no filter needed
    }

    if (state.controllerQuery.trim()) {
        clauses.push(`controllerId==*${state.controllerQuery.trim()}*`);
    }
    if (state.searchKeyword.trim()) {
        clauses.push(`name==*${state.searchKeyword.trim()}*`);
    }
    return clauses.join(';');
};

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
    const [filterMode, setFilterMode] = useState<'builder' | 'advanced'>('builder');
    const [builderState, setBuilderState] = useState<TargetFilterBuilderState>({
        tags: [],
        tagMode: 'any',
        targetTypes: [],
        targetTypeMode: 'any',
        statuses: [],
        controllerQuery: '',
        searchKeyword: '',
    });
    React.useEffect(() => {
        if (filterMode === 'builder') {
            const fiql = buildFiqlFromBuilder(builderState);
            setFormData((prev) => ({ ...prev, targetFilterQuery: fiql }));
        }
    }, [builderState, filterMode]);

    // Form instances for each step
    const [basicInfoForm] = Form.useForm();
    const [groupSettingsForm] = Form.useForm();

    // Fetch distribution sets
    const { data: dsData, isLoading: dsLoading } = useGetDistributionSets({
        limit: 100,
    });

    // Fetch target metadata for builder
    const { data: targetTagsData, isLoading: targetTagsLoading } = useGetTargetTags({ limit: 200 });
    const { data: targetTypesData, isLoading: targetTypesLoading } = useGetTargetTypes({ limit: 200 });

    // Fetch target count for preview
    const { data: targetPreviewData, isLoading: targetPreviewLoading, refetch: refetchTargets } = useGetTargets(
        {
            limit: 5,
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
            if (!formData.targetFilterQuery?.trim()) {
                message.warning(t('wizard.targetFilter.required'));
                return;
            }
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
        if (!formData.targetFilterQuery?.trim()) {
            message.warning(t('wizard.targetFilter.required'));
            setCurrentStep(2);
            return;
        }

        createMutation.mutate({
            data: {
                name: formData.name,
                description: formData.description || undefined,
                distributionSetId: formData.distributionSetId,
                targetFilterQuery: formData.targetFilterQuery.trim(),
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
    const renderTargetFilterStep = () => {
        const previewTargets = targetPreviewData?.content || [];
        return (
            <Card title={t('wizard.targetFilter.title')}>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Button
                        type={filterMode === 'builder' ? 'primary' : 'default'}
                        onClick={() => setFilterMode('builder')}
                    >
                        {t('wizard.targetFilter.builderMode')}
                    </Button>
                    <Button
                        type={filterMode === 'advanced' ? 'primary' : 'default'}
                        onClick={() => setFilterMode('advanced')}
                    >
                        {t('wizard.targetFilter.advancedMode')}
                    </Button>
                    <Button onClick={handlePreviewTargets} loading={targetPreviewLoading} icon={<SearchOutlined />}>
                        {t('wizard.targetFilter.preview')}
                    </Button>
                    {targetPreviewData && (
                        <Tag color="blue">
                            {t('wizard.targetFilter.targetCount', { count: targetPreviewData.total || 0 })}
                        </Tag>
                    )}
                </Space>
                {filterMode === 'builder' ? (
                    <Form layout="vertical">
                        <Form.Item label={t('wizard.targetFilter.tags')}>
                            <Select
                                mode="multiple"
                                allowClear
                                loading={targetTagsLoading}
                                placeholder={t('wizard.targetFilter.tagsPlaceholder')}
                                value={builderState.tags}
                                onChange={(values: number[]) => setBuilderState((prev) => ({ ...prev, tags: values }))}
                                options={(targetTagsData?.content || []).map((tag) => ({
                                    label: tag.name,
                                    value: tag.id,
                                }))}
                            />
                            {builderState.tags.length > 1 && (
                                <Radio.Group
                                    value={builderState.tagMode}
                                    onChange={(e: RadioChangeEvent) =>
                                        setBuilderState((prev) => ({ ...prev, tagMode: e.target.value as 'any' | 'all' }))
                                    }
                                    style={{ marginTop: 8 }}
                                >
                                    <Radio value="any">{t('wizard.targetFilter.anyTag')}</Radio>
                                    <Radio value="all">{t('wizard.targetFilter.allTag')}</Radio>
                                </Radio.Group>
                            )}
                        </Form.Item>
                        <Form.Item label={t('wizard.targetFilter.targetTypes')}>
                            <Select
                                mode="multiple"
                                allowClear
                                loading={targetTypesLoading}
                                placeholder={t('wizard.targetFilter.targetTypePlaceholder')}
                                value={builderState.targetTypes}
                                onChange={(values: string[]) =>
                                    setBuilderState((prev) => ({ ...prev, targetTypes: values }))
                                }
                                options={(targetTypesData?.content || []).map((type) => ({
                                    label: type.name,
                                    value: type.key,
                                }))}
                            />
                            {builderState.targetTypes.length > 1 && (
                                <Radio.Group
                                    value={builderState.targetTypeMode}
                                    onChange={(e: RadioChangeEvent) =>
                                        setBuilderState((prev) => ({
                                            ...prev,
                                            targetTypeMode: e.target.value as 'any' | 'all',
                                        }))
                                    }
                                    style={{ marginTop: 8 }}
                                >
                                    <Radio value="any">{t('wizard.targetFilter.anyType')}</Radio>
                                    <Radio value="all">{t('wizard.targetFilter.allType')}</Radio>
                                </Radio.Group>
                            )}
                        </Form.Item>
                        <Form.Item label={t('wizard.targetFilter.status')}>
                            <Checkbox.Group
                                options={[
                                    { label: t('wizard.targetFilter.statusOnline'), value: 'online' },
                                    { label: t('wizard.targetFilter.statusOffline'), value: 'offline' },
                                ]}
                                value={builderState.statuses}
                                onChange={(values) =>
                                    setBuilderState((prev) => ({
                                        ...prev,
                                        statuses: values as Array<'online' | 'offline'>,
                                    }))
                                }
                            />
                        </Form.Item>
                        <Form.Item label={t('wizard.targetFilter.controllerId')}>
                            <Input
                                placeholder={t('wizard.targetFilter.controllerPlaceholder')}
                                value={builderState.controllerQuery}
                                onChange={(e) =>
                                    setBuilderState((prev) => ({ ...prev, controllerQuery: e.target.value }))
                                }
                            />
                        </Form.Item>
                        <Form.Item label={t('wizard.targetFilter.nameKeyword')}>
                            <Input
                                placeholder={t('wizard.targetFilter.namePlaceholder')}
                                value={builderState.searchKeyword}
                                onChange={(e) =>
                                    setBuilderState((prev) => ({ ...prev, searchKeyword: e.target.value }))
                                }
                            />
                        </Form.Item>
                        <Alert type="info" message={t('wizard.targetFilter.builderHint')} />
                    </Form>
                ) : (
                    <Form layout="vertical">
                        <Form.Item label={t('wizard.targetFilter.filterQuery')}>
                            <TextArea
                                rows={4}
                                value={formData.targetFilterQuery}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, targetFilterQuery: e.target.value }))
                                }
                                placeholder={t('wizard.targetFilter.filterPlaceholder')}
                            />
                        </Form.Item>
                        <Alert type="info" message={t('wizard.targetFilter.advancedHint')} />
                    </Form>
                )}
                {previewTargets.length > 0 && (
                    <Table
                        style={{ marginTop: 16 }}
                        size="small"
                        rowKey="controllerId"
                        pagination={false}
                        dataSource={previewTargets}
                        columns={[
                            { title: t('wizard.targetFilter.previewColumns.controllerId'), dataIndex: 'controllerId' },
                            { title: t('wizard.targetFilter.previewColumns.name'), dataIndex: 'name' },
                            { title: t('wizard.targetFilter.previewColumns.type'), dataIndex: 'targetTypeName' },
                        ]}
                    />
                )}
            </Card>
        );
    };

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
