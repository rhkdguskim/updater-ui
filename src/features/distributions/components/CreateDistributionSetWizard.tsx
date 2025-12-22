import React, { useState, useCallback } from 'react';
import {
    Modal,
    Steps,
    Form,
    Input,
    Select,
    Button,
    Space,
    Table,
    message,
    Descriptions,
    Tag,
    List,
    Badge,
    Card,
    Empty,
    Checkbox,
    Divider,
    Typography,
    Alert,
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    AppstoreAddOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
    useCreateDistributionSets,
    useAssignSoftwareModules,
    useCreateMetadata2,
} from '@/api/generated/distribution-sets/distribution-sets';
import { useGetDistributionSetTypes } from '@/api/generated/distribution-set-types/distribution-set-types';
import { useGetSoftwareModules, useCreateSoftwareModules } from '@/api/generated/software-modules/software-modules';
import { useGetTypes } from '@/api/generated/software-module-types/software-module-types';
import type {
    MgmtDistributionSetRequestBodyPost,
    MgmtMetadata,
    MgmtSoftwareModule,
    MgmtSoftwareModuleRequestBodyPost,
} from '@/api/generated/model';

const { Text } = Typography;

interface CreateDistributionSetWizardProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

interface MetadataEntry {
    key: string;
    value: string;
}

interface NewModuleEntry {
    id: string; // temp id
    name: string;
    version: string;
    type: string;
    typeName?: string;
    vendor?: string;
    description?: string;
}

type CreationPhase = 'idle' | 'creating_set' | 'creating_modules' | 'assigning_modules' | 'adding_metadata' | 'done' | 'error';

const CreateDistributionSetWizard: React.FC<CreateDistributionSetWizardProps> = ({
    visible,
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation('distributions');
    const [currentStep, setCurrentStep] = useState(0);
    const [basicInfoForm] = Form.useForm();
    const [metadataForm] = Form.useForm();
    const [newModuleForm] = Form.useForm();

    // DS Types
    const { data: dsTypesData, isLoading: isDsTypesLoading } = useGetDistributionSetTypes({ limit: 100 });

    // Software modules
    const { data: modulesData, isLoading: isModulesLoading } = useGetSoftwareModules({ limit: 500 });
    const { data: smTypesData, isLoading: isSmTypesLoading } = useGetTypes({ limit: 100 });

    // Selected existing modules
    const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);

    // New modules to create
    const [newModules, setNewModules] = useState<NewModuleEntry[]>([]);
    const [showNewModuleForm, setShowNewModuleForm] = useState(false);

    // Metadata state
    const [metadataList, setMetadataList] = useState<MetadataEntry[]>([]);

    // Creation state
    const [creationPhase, setCreationPhase] = useState<CreationPhase>('idle');

    // Mutations
    const createDistributionSetMutation = useCreateDistributionSets();
    const createModulesMutation = useCreateSoftwareModules();
    const assignModulesMutation = useAssignSoftwareModules();
    const createMetadataMutation = useCreateMetadata2();

    const resetWizard = useCallback(() => {
        setCurrentStep(0);
        basicInfoForm.resetFields();
        metadataForm.resetFields();
        newModuleForm.resetFields();
        setSelectedModuleIds([]);
        setNewModules([]);
        setShowNewModuleForm(false);
        setMetadataList([]);
        setCreationPhase('idle');
    }, [basicInfoForm, metadataForm, newModuleForm]);

    const handleCancel = () => {
        resetWizard();
        onCancel();
    };

    const handleNext = async () => {
        if (currentStep === 0) {
            try {
                await basicInfoForm.validateFields();
                setCurrentStep(1);
            } catch {
                // Validation failed
            }
        } else if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Add new module entry
    const handleAddNewModule = async () => {
        try {
            const values = await newModuleForm.validateFields();
            const typeInfo = smTypesData?.content?.find((t) => t.key === values.type);
            const id = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setNewModules([
                ...newModules,
                {
                    id,
                    name: values.name,
                    version: values.version,
                    type: values.type,
                    typeName: typeInfo?.name,
                    vendor: values.vendor,
                    description: values.description,
                },
            ]);
            newModuleForm.resetFields();
            setShowNewModuleForm(false);
        } catch {
            // Validation failed
        }
    };

    // Remove new module entry
    const handleRemoveNewModule = (id: string) => {
        setNewModules(newModules.filter((m) => m.id !== id));
    };

    // Add metadata entry
    const handleAddMetadata = async () => {
        try {
            const values = await metadataForm.validateFields();
            if (metadataList.some((m) => m.key === values.key)) {
                message.warning(t('wizard.duplicateKey'));
                return;
            }
            setMetadataList([...metadataList, { key: values.key, value: values.value }]);
            metadataForm.resetFields();
        } catch {
            // Validation failed
        }
    };

    // Remove metadata entry
    const handleRemoveMetadata = (key: string) => {
        setMetadataList(metadataList.filter((m) => m.key !== key));
    };

    // Final creation process
    const handleFinish = async () => {
        const basicValues = basicInfoForm.getFieldsValue();
        setCreationPhase('creating_set');

        try {
            // Step 1: Create Distribution Set
            const dsPayload: MgmtDistributionSetRequestBodyPost = {
                name: basicValues.name,
                version: basicValues.version,
                type: basicValues.type,
                description: basicValues.description,
                requiredMigrationStep: basicValues.requiredMigrationStep || false,
            };

            const dsResult = await createDistributionSetMutation.mutateAsync({ data: [dsPayload] });
            const newDsId = dsResult?.[0]?.id;

            if (!newDsId) {
                throw new Error('Failed to get created Distribution Set ID');
            }

            // Step 2: Create new modules if any
            const allModuleIds: number[] = [...selectedModuleIds];

            if (newModules.length > 0) {
                setCreationPhase('creating_modules');
                const modulesPayload: MgmtSoftwareModuleRequestBodyPost[] = newModules.map((m) => ({
                    name: m.name,
                    version: m.version,
                    type: m.type,
                    vendor: m.vendor,
                    description: m.description,
                    encrypted: false,
                }));

                const createdModules = await createModulesMutation.mutateAsync({ data: modulesPayload });
                createdModules?.forEach((m) => {
                    if (m.id) allModuleIds.push(m.id);
                });
            }

            // Step 3: Assign modules if any
            if (allModuleIds.length > 0) {
                setCreationPhase('assigning_modules');
                const assignments = allModuleIds.map((id) => ({ id }));
                await assignModulesMutation.mutateAsync({
                    distributionSetId: newDsId,
                    data: assignments,
                });
            }

            // Step 4: Add metadata if any
            if (metadataList.length > 0) {
                setCreationPhase('adding_metadata');
                const metadataPayload: MgmtMetadata[] = metadataList.map((m) => ({
                    key: m.key,
                    value: m.value,
                }));
                await createMetadataMutation.mutateAsync({
                    distributionSetId: newDsId,
                    data: metadataPayload,
                });
            }

            setCreationPhase('done');
            message.success(t('messages.createSetSuccess'));
            resetWizard();
            onSuccess();
        } catch (error) {
            setCreationPhase('error');
            message.error((error as Error).message || t('messages.createSetError'));
        }
    };

    const getCreationPhaseText = () => {
        switch (creationPhase) {
            case 'creating_set':
                return t('wizard.creatingSet');
            case 'creating_modules':
                return t('wizard.creatingModules');
            case 'assigning_modules':
                return t('wizard.assigningModules');
            case 'adding_metadata':
                return t('wizard.addingMetadata');
            default:
                return '';
        }
    };

    const isProcessing = creationPhase !== 'idle' && creationPhase !== 'done' && creationPhase !== 'error';

    // Step 1: Basic Information
    const renderStep1 = () => (
        <Form form={basicInfoForm} layout="vertical" preserve>
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
                    loading={isDsTypesLoading}
                    options={dsTypesData?.content?.filter((t) => t.key).map((t) => ({ label: t.name, value: t.key }))}
                />
            </Form.Item>
            <Form.Item name="description" label={t('modal.description')}>
                <Input.TextArea rows={3} placeholder={t('modal.placeholders.description')} />
            </Form.Item>
            <Form.Item name="requiredMigrationStep" valuePropName="checked">
                <Checkbox>{t('modal.requiredMigration')}</Checkbox>
            </Form.Item>
        </Form>
    );

    // Step 2: Assign Modules
    const renderStep2 = () => {
        const existingModules = modulesData?.content || [];
        const hasNoModules = existingModules.length === 0 && newModules.length === 0;

        return (
            <div>
                {hasNoModules && (
                    <Alert
                        message={t('wizard.noModulesExist')}
                        description={t('wizard.createModuleHint')}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Existing Modules Selection */}
                {existingModules.length > 0 && (
                    <>
                        <Text strong>{t('wizard.selectExistingModules')}</Text>
                        <Table
                            dataSource={existingModules}
                            rowKey="id"
                            size="small"
                            loading={isModulesLoading}
                            pagination={{ pageSize: 5, size: 'small' }}
                            rowSelection={{
                                selectedRowKeys: selectedModuleIds,
                                onChange: (keys) => setSelectedModuleIds(keys as number[]),
                            }}
                            columns={[
                                { title: t('list.columns.name'), dataIndex: 'name', key: 'name' },
                                {
                                    title: t('list.columns.version'),
                                    dataIndex: 'version',
                                    key: 'version',
                                    render: (v) => <Tag color="blue">{v}</Tag>,
                                },
                                {
                                    title: t('list.columns.type'),
                                    dataIndex: 'typeName',
                                    key: 'typeName',
                                    render: (v) => <Tag color="cyan">{v}</Tag>,
                                },
                            ]}
                            style={{ marginTop: 8, marginBottom: 16 }}
                        />
                    </>
                )}

                <Divider />

                {/* New Modules to Create */}
                <Space style={{ marginBottom: 16 }}>
                    <Text strong>{t('wizard.newModulesToCreate')}</Text>
                    <Button
                        type="dashed"
                        icon={<AppstoreAddOutlined />}
                        onClick={() => setShowNewModuleForm(true)}
                        size="small"
                    >
                        {t('wizard.addNewModule')}
                    </Button>
                </Space>

                {showNewModuleForm && (
                    <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                        <Form form={newModuleForm} layout="vertical" size="small">
                            <Space style={{ width: '100%' }} direction="vertical">
                                <Space style={{ width: '100%' }} wrap>
                                    <Form.Item
                                        name="name"
                                        rules={[{ required: true, message: t('modal.placeholders.name') }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input placeholder={t('modal.name')} style={{ width: 150 }} />
                                    </Form.Item>
                                    <Form.Item
                                        name="version"
                                        rules={[{ required: true, message: t('modal.placeholders.version') }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input placeholder={t('modal.version')} style={{ width: 100 }} />
                                    </Form.Item>
                                    <Form.Item
                                        name="type"
                                        rules={[{ required: true, message: t('modal.placeholders.type') }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select
                                            placeholder={t('modal.type')}
                                            loading={isSmTypesLoading}
                                            options={smTypesData?.content?.map((t) => ({ label: t.name, value: t.key }))}
                                            style={{ width: 150 }}
                                        />
                                    </Form.Item>
                                    <Form.Item name="vendor" style={{ marginBottom: 0 }}>
                                        <Input placeholder={t('modal.vendor')} style={{ width: 120 }} />
                                    </Form.Item>
                                </Space>
                                <Space>
                                    <Button type="primary" size="small" onClick={handleAddNewModule}>
                                        {t('wizard.add')}
                                    </Button>
                                    <Button size="small" onClick={() => setShowNewModuleForm(false)}>
                                        {t('common:actions.cancel')}
                                    </Button>
                                </Space>
                            </Space>
                        </Form>
                    </Card>
                )}

                {newModules.length > 0 ? (
                    <List
                        size="small"
                        bordered
                        dataSource={newModules}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    <Button
                                        key="delete"
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveNewModule(item.id)}
                                        size="small"
                                    />,
                                ]}
                            >
                                <Space>
                                    <Tag color="green">{t('values.new')}</Tag>
                                    <span>{item.name}</span>
                                    <Tag color="blue">{item.version}</Tag>
                                    <Tag color="cyan">{item.typeName || item.type}</Tag>
                                </Space>
                            </List.Item>
                        )}
                    />
                ) : (
                    !showNewModuleForm && (
                        <Empty description={t('wizard.noNewModules')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )
                )}
            </div>
        );
    };

    // Step 3: Metadata
    const renderStep3 = () => (
        <div>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Form form={metadataForm} layout="inline" style={{ marginBottom: 8 }}>
                    <Form.Item
                        name="key"
                        rules={[{ required: true, message: t('metadataTab.placeholderKey') }]}
                        style={{ flex: 1 }}
                    >
                        <Input placeholder={t('metadataTab.key')} />
                    </Form.Item>
                    <Form.Item
                        name="value"
                        rules={[{ required: true, message: t('metadataTab.placeholderValue') }]}
                        style={{ flex: 2 }}
                    >
                        <Input placeholder={t('metadataTab.value')} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMetadata}>
                            {t('wizard.add')}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {metadataList.length > 0 ? (
                <Table
                    dataSource={metadataList}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                        { title: t('metadataTab.key'), dataIndex: 'key', key: 'key' },
                        { title: t('metadataTab.value'), dataIndex: 'value', key: 'value', ellipsis: true },
                        {
                            title: '',
                            key: 'action',
                            width: 60,
                            render: (_, record: MetadataEntry) => (
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleRemoveMetadata(record.key)}
                                />
                            ),
                        },
                    ]}
                />
            ) : (
                <Empty description={t('wizard.noMetadata')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </div>
    );

    // Step 4: Review
    const renderStep4 = () => {
        const values = basicInfoForm.getFieldsValue();
        const selectedType = dsTypesData?.content?.find((t) => t.key === values.type);
        const selectedModules = (modulesData?.content || []).filter((m: MgmtSoftwareModule) =>
            selectedModuleIds.includes(m.id!)
        );

        return (
            <div>
                <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label={t('modal.name')}>{values.name}</Descriptions.Item>
                    <Descriptions.Item label={t('modal.version')}>
                        <Tag color="blue">{values.version}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('modal.type')}>
                        <Tag color="cyan">{selectedType?.name || values.type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('modal.description')}>{values.description || '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('modal.requiredMigration')}>
                        {values.requiredMigrationStep ? t('values.yes') : t('values.no')}
                    </Descriptions.Item>
                </Descriptions>

                <Card size="small" title={t('wizard.step2Title')} style={{ marginBottom: 16 }}>
                    {selectedModules.length > 0 || newModules.length > 0 ? (
                        <List
                            size="small"
                            dataSource={[
                                ...selectedModules.map((m: MgmtSoftwareModule) => ({
                                    key: `existing-${m.id}`,
                                    name: m.name,
                                    version: m.version,
                                    typeName: m.typeName,
                                    isNew: false,
                                })),
                                ...newModules.map((m) => ({
                                    key: m.id,
                                    name: m.name,
                                    version: m.version,
                                    typeName: m.typeName || m.type,
                                    isNew: true,
                                })),
                            ]}
                            renderItem={(item) => (
                                <List.Item>
                                    <Space>
                                        {item.isNew && <Tag color="green">{t('values.new')}</Tag>}
                                        <span>{item.name}</span>
                                        <Tag color="blue">{item.version}</Tag>
                                        <Tag color="cyan">{item.typeName}</Tag>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Empty description={t('wizard.noModulesSelected')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                </Card>

                <Card size="small" title={t('wizard.step3Title')}>
                    {metadataList.length > 0 ? (
                        <List
                            size="small"
                            dataSource={metadataList}
                            renderItem={(item) => (
                                <List.Item>
                                    <Space>
                                        <Tag color="blue">{item.key}</Tag>
                                        <span>{item.value}</span>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Empty description={t('wizard.noMetadata')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                </Card>

                {isProcessing && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <Badge status="processing" text={getCreationPhaseText()} />
                    </div>
                )}
            </div>
        );
    };

    const steps = [
        { title: t('wizard.step1Title') },
        { title: t('wizard.dsStep2Title') },
        { title: t('wizard.step3Title'), description: t('wizard.optionalStep') },
        { title: t('wizard.step4Title') },
    ];



    return (
        <Modal
            title={t('modal.createSetTitle')}
            open={visible}
            onCancel={handleCancel}
            width={800}
            footer={
                <Space>
                    <Button onClick={handleCancel} disabled={isProcessing}>
                        {t('common:actions.cancel')}
                    </Button>
                    {currentStep > 0 && (
                        <Button onClick={handlePrev} disabled={isProcessing}>
                            {t('wizard.prev')}
                        </Button>
                    )}
                    {currentStep < 3 && (
                        <Button type="primary" onClick={handleNext}>
                            {t('wizard.next')}
                        </Button>
                    )}
                    {currentStep === 3 && (
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={handleFinish}
                            loading={isProcessing}
                        >
                            {t('wizard.finish')}
                        </Button>
                    )}
                </Space>
            }
        >
            <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} size="small" />
            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>{renderStep1()}</div>
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>{renderStep2()}</div>
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>{renderStep3()}</div>
            <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>{renderStep4()}</div>
        </Modal>
    );
};

export default CreateDistributionSetWizard;
