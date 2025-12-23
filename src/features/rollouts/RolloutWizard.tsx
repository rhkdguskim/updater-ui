import React, { useState, useMemo, useEffect } from 'react';
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
    Row,
    Col,
    Flex,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCreate, useStart, getRollouts } from '@/api/generated/rollouts/rollouts';
import { useGetDistributionSets, useGetAssignedSoftwareModules } from '@/api/generated/distribution-sets/distribution-sets';
import { useGetArtifacts } from '@/api/generated/software-modules/software-modules';
import { useGetTargets } from '@/api/generated/targets/targets';
import { useGetTargetTags } from '@/api/generated/target-tags/target-tags';
import { useGetTargetTypes } from '@/api/generated/target-types/target-types';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { buildCondition, combineWithAnd, combineWithOr, escapeValue } from '@/utils/fiql';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
`;

const HeaderRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
`;

const TitleGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;


const ActionsBar = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
`;

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
    allTargets: boolean;
    tags: string[];
    tagMode: 'any' | 'all';
    targetTypes: string[];
    targetTypeMode: 'any' | 'all';
    updateStatuses: string[];
    pollingStatuses: Array<'online' | 'offline'>;
    controllerQuery: string;
    searchKeyword: string;
}

const buildFiqlFromBuilder = (state: TargetFilterBuilderState) => {
    // All targets - use wildcard
    if (state.allTargets) {
        return 'controllerId==*';
    }

    const clauses: string[] = [];

    // Tags: tag=="name"
    if (state.tags.length > 0) {
        const tagConditions = state.tags.map(t => buildCondition({ field: 'tag.name', operator: '==', value: t }));
        if (state.tagMode === 'any') {
            clauses.push(`(${combineWithOr(tagConditions)})`);
        } else {
            clauses.push(combineWithAnd(tagConditions));
        }
    }

    // Target Types: targettype.name=="name"
    if (state.targetTypes.length > 0) {
        const typeConditions = state.targetTypes.map(t => buildCondition({ field: 'targettype.name', operator: '==', value: t }));
        if (state.targetTypeMode === 'any') {
            clauses.push(`(${combineWithOr(typeConditions)})`);
        } else {
            clauses.push(combineWithAnd(typeConditions));
        }
    }

    // Update Status: updateStatus=="in_sync"
    if (state.updateStatuses.length > 0) {
        const statusConditions = state.updateStatuses.map(s => buildCondition({ field: 'updateStatus', operator: '==', value: s }));
        if (statusConditions.length === 1) {
            clauses.push(statusConditions[0]);
        } else {
            clauses.push(`(${combineWithOr(statusConditions)})`);
        }
    }

    // Polling Status (Online/Offline): pollStatus.overdue==true/false
    if (state.pollingStatuses.length === 1) {
        const isOnline = state.pollingStatuses[0] === 'online';
        clauses.push(buildCondition({ field: 'pollStatus.overdue', operator: '==', value: !isOnline }));
    }

    if (state.controllerQuery.trim()) {
        clauses.push(`controllerId==*${state.controllerQuery.trim()}*`);
    }
    if (state.searchKeyword.trim()) {
        clauses.push(`name==*${state.searchKeyword.trim()}*`);
    }

    return combineWithAnd(clauses);
};

interface RolloutWizardProps {
    isModal?: boolean;
    onClose?: () => void;
    onSuccess?: (rolloutId: number) => void;
}

const ArtifactPreview: React.FC<{ distributionSetId: number }> = ({ distributionSetId }) => {
    const { t } = useTranslation(['distributions', 'common']);
    const { data: modulesData, isLoading } = useGetAssignedSoftwareModules(distributionSetId);

    if (isLoading) return <Spin size="small" />;
    const modules = modulesData?.content || [];
    if (modules.length === 0) return <Text type="secondary">{t('common:messages.noData')}</Text>;

    return (
        <div style={{ padding: '8px 24px' }}>
            <Typography.Title level={5}>{t('list.softwareModules')}</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
                {modules.map((mod: any) => (
                    <div key={mod.id}>
                        <Text strong>{mod.name} ({mod.version})</Text>
                        <ModuleArtifacts softwareModuleId={mod.id} />
                    </div>
                ))}
            </Space>
        </div>
    );
};

const ModuleArtifacts: React.FC<{ softwareModuleId: number }> = ({ softwareModuleId }) => {
    const { data: artifactsData, isLoading } = useGetArtifacts(softwareModuleId);

    if (isLoading) return <Spin size="small" style={{ marginLeft: 8 }} />;
    const artifacts = artifactsData || [];
    if (artifacts.length === 0) return null;

    return (
        <ul style={{ margin: '4px 0 8px 16px', fontSize: '12px', color: '#666' }}>
            {artifacts.map((art: any) => (
                <li key={art.sha1}>{art.filename} ({Math.round((art.size || 0) / 1024)} KB)</li>
            ))}
        </ul>
    );
};

export const RolloutWizard: React.FC<RolloutWizardProps> = ({ isModal, onClose, onSuccess }) => {
    const { t } = useTranslation(['rollouts', 'common']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<WizardFormData>({
        name: '',
        amountGroups: 1,
        successThreshold: 80,
        errorThreshold: 20,
        startImmediately: false,
    });

    const [isCheckingName, setIsCheckingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);

    const [dsSearchValue, setDsSearchValue] = useState('');
    const [dsSearchField, setDsSearchField] = useState('name');
    const [filterMode, setFilterMode] = useState<'builder' | 'advanced'>('builder');
    const [builderState, setBuilderState] = useState<TargetFilterBuilderState>({
        allTargets: false,
        tags: [],
        tagMode: 'any',
        targetTypes: [],
        targetTypeMode: 'any',
        updateStatuses: [],
        pollingStatuses: [],
        controllerQuery: '',
        searchKeyword: '',
    });

    useEffect(() => {
        if (filterMode === 'builder') {
            const timer = setTimeout(() => {
                const fiql = buildFiqlFromBuilder(builderState);
                setFormData((prev) => ({ ...prev, targetFilterQuery: fiql }));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [builderState, filterMode]);

    // Form instances for each step
    const [basicInfoForm] = Form.useForm();
    const [groupSettingsForm] = Form.useForm();

    const amountGroupsValue = Form.useWatch('amountGroups', groupSettingsForm);
    // Fetch distribution sets
    const dsQuery = useMemo(() => {
        const clauses: string[] = [];
        if (dsSearchValue) {
            clauses.push(`${dsSearchField}==*${dsSearchValue}*`);
        }
        // Hawkbit doesn't easily support multi-tag filtering in a single GET /distributionsets query
        // typically you query by tag. We'll simplify for now to name/version/type.
        return clauses.join(';');
    }, [dsSearchValue, dsSearchField]);

    const { data: dsData, isLoading: dsLoading } = useGetDistributionSets({
        limit: 50,
        q: dsQuery || undefined,
    });

    // Fetch target metadata for builder
    const { data: targetTagsData, isLoading: targetTagsLoading } = useGetTargetTags({ limit: 200 });
    const { data: targetTypesData, isLoading: targetTypesLoading } = useGetTargetTypes({ limit: 200 });

    // Fetch targets for preview
    const { data: targetsData, isLoading: isLoadingTargets, refetch: refetchTargets } = useGetTargets(
        {
            q: formData.targetFilterQuery === 'controllerId==*' ? undefined : formData.targetFilterQuery,
            limit: 5, // Limit for preview table
        },
        {
            query: {
                enabled: false, // Only fetch on demand
            },
        }
    );

    // Create mutation
    const createMutation = useCreate({
        mutation: {
            onSuccess: async (data) => {
                message.success(t('wizard.messages.createSuccess'));
                queryClient.invalidateQueries();

                if (data.id) {
                    const rolloutId = data.id;

                    if (formData.startImmediately) {
                        // Trigger start attempt in background, but don't block navigation
                        const tryStart = async () => {
                            try {
                                startMutation.mutate({ rolloutId });
                            } catch (e) {
                                console.error('Auto-start polling failed', e);
                            }
                        };
                        tryStart();
                    }

                    // Navigate immediately regardless of startImmediately
                    if (isModal && onSuccess) {
                        onSuccess(rolloutId);
                    } else {
                        navigate(`/rollouts/${rolloutId}`);
                    }
                }
            },
            onError: (err: unknown) => {
                console.error('Rollout creation error:', err);
                const error = err as { response?: { data?: { message?: string; exceptionClass?: string }; status?: number }; message?: string };
                const errorMessage = error.response?.data?.message
                    || error.response?.data?.exceptionClass
                    || error.message
                    || t('wizard.messages.createError');
                message.error(errorMessage);
            },
        },
    });

    const startMutation = useStart({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.startSuccess'));
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

    const handleNext = async () => {
        if (currentStep === 0) {
            try {
                const values = await basicInfoForm.validateFields();
                setIsCheckingName(true);
                setNameError(null);

                // Use current form value directly for validation
                const existingRollouts = await getRollouts({ q: `name==${escapeValue(values.name)}` });
                if (existingRollouts && existingRollouts.total && existingRollouts.total > 0) {
                    setNameError(t('wizard.basicInfo.nameDuplicate', { defaultValue: 'Rollout name already exists' }));
                    setIsCheckingName(false);
                    return;
                }

                setIsCheckingName(false);
                setFormData((prev) => ({ ...prev, ...values }));
                setCurrentStep(currentStep + 1);
            } catch (err) {
                console.error('Validation error', err);
                setIsCheckingName(false);
            }
        } else if (currentStep === 1) {
            if (!formData.distributionSetId) {
                message.warning(t('wizard.distributionSet.selectionRequired'));
                return;
            }
            setCurrentStep(currentStep + 1);
        } else if (currentStep === 2) {
            // Ensure targetFilterQuery is up to date if using builder
            if (filterMode === 'builder') {
                const fiql = buildFiqlFromBuilder(builderState);
                setFormData(prev => ({ ...prev, targetFilterQuery: fiql }));
            }
            setCurrentStep(currentStep + 1);
        } else if (currentStep === 3) {
            try {
                const values = await groupSettingsForm.validateFields();
                setFormData((prev) => ({ ...prev, ...values }));
                setCurrentStep(currentStep + 1);
            } catch {
            }
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleCreate = () => {
        if (!builderState.allTargets && !formData.targetFilterQuery?.trim()) {
            message.warning(t('wizard.targetFilter.required'));
            setCurrentStep(2);
            return;
        }

        const finalQuery = builderState.allTargets && !formData.targetFilterQuery?.trim()
            ? 'controllerId==*'
            : formData.targetFilterQuery?.trim();

        const payload: any = {
            name: formData.name,
            description: formData.description || '',
            distributionSetId: formData.distributionSetId,
            amountGroups: formData.amountGroups,
            successCondition: {
                condition: 'THRESHOLD',
                expression: formData.successThreshold.toString(),
            },
            errorCondition: {
                condition: 'THRESHOLD',
                expression: formData.errorThreshold.toString(),
            },
        };

        // Only include targetFilterQuery if it's not empty/null
        if (finalQuery && finalQuery.trim() !== '') {
            payload.targetFilterQuery = finalQuery;
        }

        createMutation.mutate({ data: payload });
    };

    const renderBasicInfoStep = () => (
        <Card title={t('wizard.basicInfo.title')} style={isModal ? { boxShadow: 'none', border: 'none', background: 'transparent' } : undefined}>
            <Form
                form={basicInfoForm}
                layout="vertical"
                initialValues={{ name: formData.name, description: formData.description }}
            >
                <Form.Item
                    name="name"
                    label={t('wizard.basicInfo.name')}
                    rules={[{ required: true, message: t('wizard.basicInfo.nameRequired') }]}
                    validateStatus={nameError ? 'error' : undefined}
                    help={nameError}
                >
                    <Input
                        placeholder={t('wizard.basicInfo.namePlaceholder')}
                        onChange={() => setNameError(null)}
                    />
                </Form.Item>
                <Form.Item name="description" label={t('wizard.basicInfo.description')}>
                    <TextArea rows={4} placeholder={t('wizard.basicInfo.descriptionPlaceholder')} />
                </Form.Item>
            </Form>
            {isCheckingName && <Spin size="small" tip="Checking name..." />}
        </Card>
    );


    const renderDistributionSetStep = () => (
        <Card title={t('wizard.distributionSet.title')} style={isModal ? { boxShadow: 'none', border: 'none', background: 'transparent' } : undefined}>
            <div style={{ marginBottom: 16 }}>
                <Space.Compact style={{ width: '100%' }}>
                    <Select
                        value={dsSearchField}
                        onChange={setDsSearchField}
                        options={[
                            { label: t('wizard.distributionSet.searchName', { defaultValue: 'Name' }), value: 'name' },
                            { label: t('wizard.distributionSet.searchVersion', { defaultValue: 'Version' }), value: 'version' },
                            { label: t('wizard.distributionSet.searchDescription', { defaultValue: 'Description' }), value: 'description' },
                        ]}
                        style={{ width: 120 }}
                    />
                    <Input.Search
                        placeholder={t('wizard.distributionSet.searchPlaceholder')}
                        allowClear
                        onSearch={(val) => setDsSearchValue(val)}
                        style={{ width: '100%' }}
                        enterButton
                    />
                </Space.Compact>
            </div>
            <Table
                loading={dsLoading}
                dataSource={dsData?.content || []}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
                expandable={{
                    expandedRowRender: (record) => <ArtifactPreview distributionSetId={record.id} />,
                    rowExpandable: (record) => !!record.id,
                }}
                rowSelection={{
                    type: 'radio',
                    selectedRowKeys: formData.distributionSetId ? [formData.distributionSetId] : [],
                    onChange: (_, selectedRows) => {
                        const row = selectedRows[0];
                        setFormData((prev) => ({
                            ...prev,
                            distributionSetId: row.id,
                            distributionSetName: `${row.name} (${row.version})`,
                        }));
                    },
                }}
                columns={[
                    { title: t('wizard.distributionSet.columns.name'), dataIndex: 'name' },
                    { title: t('wizard.distributionSet.columns.version'), dataIndex: 'version', width: 100 },
                    {
                        title: t('wizard.distributionSet.columns.type'),
                        dataIndex: 'type',
                        width: 120,
                        render: (type: string) => <Tag>{type}</Tag>,
                    },
                ]}
            />
        </Card>
    );

    const renderTargetFilterStep = () => {

        const previewColumns = [
            { title: t('wizard.targetFilter.previewColumns.controllerId'), dataIndex: 'controllerId' },
            { title: t('wizard.targetFilter.previewColumns.name'), dataIndex: 'name' },
            { title: t('wizard.targetFilter.previewColumns.type'), dataIndex: 'targetTypeName' },
        ];

        return (
            <Card title={t('wizard.targetFilter.title')} style={isModal ? { boxShadow: 'none', border: 'none', background: 'transparent' } : undefined}>
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
                </Space>

                {filterMode === 'builder' ? (
                    <div style={{ marginBottom: 24 }}>
                        <Alert
                            message={t('wizard.targetFilter.builderHint')}
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <Form layout="vertical">
                            <Form.Item>
                                <Checkbox
                                    checked={builderState.allTargets}
                                    onChange={(e) => setBuilderState(prev => ({ ...prev, allTargets: e.target.checked }))}
                                >
                                    <Text strong>{t('wizard.targetFilter.allTargets')}</Text>
                                </Checkbox>
                            </Form.Item>

                            {!builderState.allTargets && (
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Form.Item label={t('wizard.targetFilter.tags')}>
                                            <Select
                                                mode="multiple"
                                                placeholder={t('wizard.targetFilter.selectTags')}
                                                value={builderState.tags}
                                                loading={targetTagsLoading}
                                                onChange={(val) => setBuilderState(prev => ({ ...prev, tags: val }))}
                                                options={(targetTagsData?.content || []).map(tag => ({
                                                    label: (
                                                        <Space>
                                                            {tag.colour && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: tag.colour }} />}
                                                            {tag.name}
                                                        </Space>
                                                    ),
                                                    value: tag.name
                                                }))}
                                            />
                                            {builderState.tags.length > 1 && (
                                                <Radio.Group
                                                    value={builderState.tagMode}
                                                    onChange={(e) => setBuilderState(prev => ({ ...prev, tagMode: e.target.value }))}
                                                    size="small"
                                                    style={{ marginTop: 8 }}
                                                >
                                                    <Radio value="any">{t('wizard.targetFilter.anyTag')}</Radio>
                                                    <Radio value="all">{t('wizard.targetFilter.allTag')}</Radio>
                                                </Radio.Group>
                                            )}
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t('wizard.targetFilter.targetTypes')}>
                                            <Select
                                                mode="multiple"
                                                placeholder={t('wizard.targetFilter.selectTypes')}
                                                value={builderState.targetTypes}
                                                loading={targetTypesLoading}
                                                onChange={(val) => setBuilderState(prev => ({ ...prev, targetTypes: val }))}
                                                options={(targetTypesData?.content || []).map(type => ({ label: type.name, value: type.name }))}
                                            />
                                            {builderState.targetTypes.length > 1 && (
                                                <Radio.Group
                                                    value={builderState.targetTypeMode}
                                                    onChange={(e) => setBuilderState(prev => ({ ...prev, targetTypeMode: e.target.value }))}
                                                    size="small"
                                                    style={{ marginTop: 8 }}
                                                >
                                                    <Radio value="any">{t('wizard.targetFilter.anyType')}</Radio>
                                                    <Radio value="all">{t('wizard.targetFilter.allType')}</Radio>
                                                </Radio.Group>
                                            )}
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t('wizard.targetFilter.pollingStatus')}>
                                            <Checkbox.Group
                                                value={builderState.pollingStatuses}
                                                onChange={(val) => setBuilderState(prev => ({ ...prev, pollingStatuses: val as any[] }))}
                                            >
                                                <Space>
                                                    <Checkbox value="online">{t('wizard.targetFilter.statusOnline')}</Checkbox>
                                                    <Checkbox value="offline">{t('wizard.targetFilter.statusOffline')}</Checkbox>
                                                </Space>
                                            </Checkbox.Group>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t('wizard.targetFilter.updateStatus')}>
                                            <Select
                                                mode="multiple"
                                                placeholder={t('wizard.targetFilter.updateStatusPlaceholder')}
                                                value={builderState.updateStatuses}
                                                onChange={(val) => setBuilderState(prev => ({ ...prev, updateStatuses: val }))}
                                                options={[
                                                    { label: t('wizard.targetFilter.updateStatusInSync'), value: 'in_sync' },
                                                    { label: t('wizard.targetFilter.updateStatusPending'), value: 'pending' },
                                                    { label: t('wizard.targetFilter.updateStatusError'), value: 'error' },
                                                ]}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t('wizard.targetFilter.controllerId')}>
                                            <Input
                                                placeholder={t('wizard.targetFilter.controllerPlaceholder')}
                                                value={builderState.controllerQuery}
                                                onChange={(e) => setBuilderState(prev => ({ ...prev, controllerQuery: e.target.value }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t('wizard.targetFilter.nameKeyword')}>
                                            <Input
                                                placeholder={t('wizard.targetFilter.namePlaceholder')}
                                                value={builderState.searchKeyword}
                                                onChange={(e) => setBuilderState(prev => ({ ...prev, searchKeyword: e.target.value }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}
                        </Form>
                    </div>
                ) : (
                    <Form layout="vertical">
                        <Form.Item label={t('wizard.targetFilter.filterQuery')}>
                            <TextArea
                                rows={4}
                                value={formData.targetFilterQuery}
                                onChange={(e) => setFormData(prev => ({ ...prev, targetFilterQuery: e.target.value }))}
                                placeholder={t('wizard.targetFilter.filterPlaceholder')}
                            />
                        </Form.Item>
                    </Form>
                )}

                <div style={{ borderTop: '1px solid var(--ant-color-border-secondary, #f0f0f0)', paddingTop: 16 }}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                        <Text strong>{t('wizard.targetFilter.preview')}</Text>
                        <Button size="small" icon={<ReloadOutlined />} onClick={() => refetchTargets()} loading={isLoadingTargets}>
                            {t('common:refresh')}
                        </Button>
                    </Flex>
                    <div style={{ marginBottom: 24 }}>
                        <Text strong>{t('wizard.targetFilter.targetCount', { count: targetsData?.total || 0 })}</Text>
                        <Table
                            dataSource={targetsData?.content || []}
                            columns={previewColumns}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            loading={isLoadingTargets}
                            style={{ marginTop: 8 }}
                            footer={() => (
                                <div style={{ textAlign: 'right', fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                                    {t('pagination.total', { count: targetsData?.total || 0 })}
                                </div>
                            )}
                        />
                    </div>
                </div>
            </Card>
        );
    };

    const renderGroupSettingsStep = (amountGroupsFromWatch: number) => {
        const amountGroups = amountGroupsFromWatch || formData.amountGroups;
        const totalTargets = targetsData?.total || 0;

        const groupSize = Math.floor(totalTargets / amountGroups);
        const remainder = totalTargets % amountGroups;

        return (
            <Card title={t('wizard.groupSettings.title')} style={isModal ? { boxShadow: 'none', border: 'none', background: 'transparent' } : undefined}>
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
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item name="amountGroups" label={t('wizard.groupSettings.amountGroups')} rules={[{ required: true }]}>
                                <InputNumber min={1} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <div style={{ marginTop: 30 }}>
                                <Text type="secondary">
                                    {t('wizard.groupSettings.preview', {
                                        defaultValue: 'Group Distribution Preview: {{count}} groups, approx. {{size}} targets/group',
                                        count: amountGroups,
                                        size: groupSize,
                                    })}
                                </Text>
                            </div>
                        </Col>
                    </Row>

                    <Alert
                        message={t('wizard.groupSettings.distributionHint', {
                            defaultValue: 'Targets will be divided into {{count}} groups. {{exact}} groups of {{size}}, and {{extraCount}} groups of {{extraSize}}.',
                            count: amountGroups,
                            exact: amountGroups - remainder,
                            size: groupSize,
                            extraCount: remainder,
                            extraSize: groupSize + (remainder > 0 ? 1 : 0),
                        })}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form.Item name="successThreshold" label={t('wizard.groupSettings.successThreshold')} rules={[{ required: true }]}>
                        <InputNumber min={0} max={100} formatter={value => `${value}%`} parser={value => value?.replace('%', '') as any} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="errorThreshold" label={t('wizard.groupSettings.errorThreshold')} rules={[{ required: true }]}>
                        <InputNumber min={0} max={100} formatter={value => `${value}%`} parser={value => value?.replace('%', '') as any} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="startImmediately" valuePropName="checked">
                        <Checkbox>{t('wizard.groupSettings.startImmediately')}</Checkbox>
                    </Form.Item>
                </Form>
            </Card>
        );
    };

    const renderReviewStep = () => (
        <Card title={t('wizard.review.title')} style={isModal ? { boxShadow: 'none', border: 'none', background: 'transparent' } : undefined}>
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label={t('wizard.review.name')}>{formData.name}</Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.description')}>{formData.description || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.distributionSet')}>{formData.distributionSetName}</Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.targetFilter')}>
                    {formData.targetFilterQuery ? (
                        <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>
                            {formData.targetFilterQuery}
                        </code>
                    ) : (
                        <Tag color="green">{t('wizard.review.allTargets')}</Tag>
                    )}
                </Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.groups')}>{formData.amountGroups}</Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.successThreshold')}>{formData.successThreshold}%</Descriptions.Item>
                <Descriptions.Item label={t('wizard.review.errorThreshold')}>{formData.errorThreshold}%</Descriptions.Item>
                <Descriptions.Item label={t('wizard.groupSettings.startImmediately')}>
                    {formData.startImmediately ? (
                        <Tag color="blue">{t('common:yes', { defaultValue: 'Yes' })}</Tag>
                    ) : (
                        <Tag>{t('common:no', { defaultValue: 'No' })}</Tag>
                    )}
                </Descriptions.Item>
            </Descriptions>
        </Card>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return renderBasicInfoStep();
            case 1: return renderDistributionSetStep();
            case 2: return renderTargetFilterStep();
            case 3: return renderGroupSettingsStep(amountGroupsValue);
            case 4: return renderReviewStep();
            default: return null;
        }
    };

    const mainContent = (
        <Flex vertical gap={24} style={{ height: '100%' }}>
            <Card className="steps-card" styles={{ body: { padding: '16px 24px' } }}>
                <Steps
                    current={currentStep}
                    items={steps}
                    direction={isModal ? "horizontal" : "vertical"}
                    size="small"
                    style={!isModal ? { minHeight: 300 } : undefined}
                    responsive={false}
                />
            </Card>

            <Flex vertical gap={20} style={{ flex: 1, minHeight: 0 }}>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    {renderStepContent()}
                </div>
                <ActionsBar>
                    <Space>
                        {currentStep > 0 && <Button onClick={handlePrev}>{t('wizard.buttons.previous')}</Button>}
                        {currentStep < steps.length - 1 ? (
                            <Button type="primary" onClick={handleNext}>{t('wizard.buttons.next')}</Button>
                        ) : (
                            <Button type="primary" onClick={handleCreate} loading={createMutation.isPending || startMutation.isPending}>
                                {t('wizard.buttons.create')}
                            </Button>
                        )}
                        {isModal ? (
                            <Button onClick={onClose}>{t('common:cancel')}</Button>
                        ) : (
                            <Button onClick={() => navigate('/rollouts')}>{t('common:cancel')}</Button>
                        )}
                    </Space>
                </ActionsBar>
            </Flex>
        </Flex>
    );

    if (isModal) {
        return (
            <div style={{ padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {mainContent}
            </div>
        );
    }

    return (
        <PageContainer>
            <HeaderRow>
                <TitleGroup>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rollouts')}>
                        {t('detail.back')}
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>{t('wizard.title')}</Title>
                </TitleGroup>
            </HeaderRow>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {isModal ? mainContent : (
                    <Row gutter={[24, 24]} style={{ height: '100%' }}>
                        <Col xs={24} md={6}>
                            <Card style={{ borderRadius: 12 }}>
                                <Steps
                                    current={currentStep}
                                    items={steps}
                                    direction="vertical"
                                    size="small"
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={18} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {renderStepContent()}
                            <ActionsBar>
                                <Space>
                                    {currentStep > 0 && <Button onClick={handlePrev}>{t('wizard.buttons.previous')}</Button>}
                                    {currentStep < steps.length - 1 ? (
                                        <Button type="primary" onClick={handleNext}>{t('wizard.buttons.next')}</Button>
                                    ) : (
                                        <Button type="primary" onClick={handleCreate} loading={createMutation.isPending || startMutation.isPending}>
                                            {t('wizard.buttons.create')}
                                        </Button>
                                    )}
                                    <Button onClick={() => navigate('/rollouts')}>{t('common:cancel')}</Button>
                                </Space>
                            </ActionsBar>
                        </Col>
                    </Row>
                )}
            </div>
        </PageContainer>
    );
};

export default RolloutWizard;
