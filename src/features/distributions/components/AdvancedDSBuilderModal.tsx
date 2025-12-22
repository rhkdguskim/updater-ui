import React, { useState, useMemo } from 'react';
import { Modal, Form, Input, Select, Checkbox, message, Row, Col, Table, Tag, Space, Typography, Divider, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateDistributionSets, useAssignSoftwareModules } from '@/api/generated/distribution-sets/distribution-sets';
import { useGetDistributionSetTypes } from '@/api/generated/distribution-set-types/distribution-set-types';
import { useGetSoftwareModules } from '@/api/generated/software-modules/software-modules';
import { useGetTypes as useGetSoftwareModuleTypes } from '@/api/generated/software-module-types/software-module-types';
import type { MgmtDistributionSetRequestBodyPost } from '@/api/generated/model';
import { SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AdvancedDSBuilderModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const AdvancedDSBuilderModal: React.FC<AdvancedDSBuilderModalProps> = ({
    visible,
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation(['distributions', 'common']);
    const [form] = Form.useForm();

    const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // API Data
    const { data: dsTypesData, isLoading: isDsTypesLoading } = useGetDistributionSetTypes({ limit: 100 });
    const { data: smTypesData } = useGetSoftwareModuleTypes({ limit: 100 });
    const { data: modulesData, isLoading: isModulesLoading } = useGetSoftwareModules({ limit: 1000 });

    const createDsMutation = useCreateDistributionSets();
    const assignModulesMutation = useAssignSoftwareModules();

    const modules = useMemo(() => modulesData?.content || [], [modulesData]);
    const smTypes = useMemo(() => smTypesData?.content || [], [smTypesData]);

    const filteredModules = useMemo(() => {
        return modules.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.version.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = activeTab === 'all' || m.type === activeTab;
            return matchesSearch && matchesType;
        });
    }, [modules, searchTerm, activeTab]);

    const selectedModules = useMemo(() =>
        modules.filter(m => selectedModuleIds.includes(m.id)),
        [modules, selectedModuleIds]
    );

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            // 1. Create Distribution Set
            const payload: MgmtDistributionSetRequestBodyPost = {
                name: values.name,
                version: values.version,
                type: values.type,
                description: values.description,
                requiredMigrationStep: values.requiredMigrationStep,
            };

            const dsResponse = await createDsMutation.mutateAsync({ data: [payload] });
            const createdDsId = dsResponse[0]?.id;

            if (!createdDsId) throw new Error('Failed to get created DS ID');

            // 2. Assign Modules if any selected
            if (selectedModuleIds.length > 0) {
                await assignModulesMutation.mutateAsync({
                    distributionSetId: createdDsId,
                    data: selectedModuleIds.map(id => ({ id }))
                });
            }

            message.success(t('messages.createSetSuccess'));
            form.resetFields();
            setSelectedModuleIds([]);
            onSuccess();
        } catch (error) {
            console.error('Advanced DS Builder failed:', error);
            message.error((error as Error).message || t('messages.createSetError'));
        }
    };

    const columns = [
        {
            title: t('list.columns.name'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('list.columns.version'),
            dataIndex: 'version',
            key: 'version',
            render: (v: string) => <Tag color="blue">{v}</Tag>
        },
        {
            title: t('list.columns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
            render: (v: string) => <Tag color="cyan">{v}</Tag>
        }
    ];

    const tabItems = [
        { label: t('builder.allModules'), key: 'all' },
        ...smTypes.map((type) => ({
            label: type.name || '',
            key: type.key || ''
        }))
    ];

    return (
        <Modal
            title={t('builder.title')}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={createDsMutation.isPending || assignModulesMutation.isPending}
            width={1000}
            destroyOnHidden
        >
            <Row gutter={24}>
                {/* Left Column: Basic Info */}
                <Col span={10}>
                    <Title level={5}>{t('builder.basicInfo')}</Title>
                    <Divider style={{ margin: '12px 0' }} />
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
                                loading={isDsTypesLoading}
                                options={dsTypesData?.content?.map((t) => ({ label: t.name, value: t.key }))}
                            />
                        </Form.Item>
                        <Form.Item name="description" label={t('modal.description')}>
                            <Input.TextArea rows={3} placeholder={t('modal.placeholders.description')} />
                        </Form.Item>
                        <Form.Item name="requiredMigrationStep" valuePropName="checked">
                            <Checkbox>{t('modal.requiredMigration')}</Checkbox>
                        </Form.Item>
                    </Form>
                </Col>

                {/* Right Column: Module Composition */}
                <Col span={14}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={5}>{t('builder.moduleComposition')}</Title>
                        <Text type="secondary">{t('moduleList.selectedCount', { count: selectedModuleIds.length })}</Text>
                    </div>
                    <Divider style={{ margin: '12px 0' }} />

                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder={t('builder.searchPlaceholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />

                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={tabItems}
                            size="small"
                        />

                        <Table
                            rowSelection={{
                                type: 'checkbox',
                                selectedRowKeys: selectedModuleIds,
                                onChange: (keys) => setSelectedModuleIds(keys as number[]),
                            }}
                            columns={columns}
                            dataSource={filteredModules}
                            rowKey="id"
                            size="small"
                            pagination={{ pageSize: 5 }}
                            loading={isModulesLoading}
                            scroll={{ y: 240 }}
                        />

                        {selectedModules.length > 0 && (
                            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                                <Text strong>{t('builder.selectionPreview')}</Text>
                                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {selectedModules.map(m => (
                                        <Tag
                                            key={m.id}
                                            closable
                                            onClose={() => setSelectedModuleIds(ids => ids.filter(id => id !== m.id))}
                                        >
                                            {m.name} ({m.version})
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Space>
                </Col>
            </Row>
        </Modal>
    );
};

export default AdvancedDSBuilderModal;
