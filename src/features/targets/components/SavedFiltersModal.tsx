import React, { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message, Select, Switch, InputNumber, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    useCreateFilter,
    useDeleteFilter,
    useGetFilters,
    useUpdateFilter,
    usePostAssignedDistributionSet1,
    useDeleteAssignedDistributionSet,
} from '@/api/generated/target-filter-queries/target-filter-queries';
import type { MgmtTargetFilterQuery } from '@/api/generated/model';
import type { MgmtDistributionSetAutoAssignment } from '@/api/generated/model';
import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import { useTranslation } from 'react-i18next';
import { buildWildcardSearch } from '@/utils/fiql';

const { Text } = Typography;

interface SavedFiltersModalProps {
    open: boolean;
    canEdit: boolean;
    onApply: (filter: MgmtTargetFilterQuery) => void;
    onClose: () => void;
}

const SavedFiltersModal: React.FC<SavedFiltersModalProps> = ({
    open,
    canEdit,
    onApply,
    onClose,
}) => {
    const { t } = useTranslation('targets');
    const [form] = Form.useForm();
    const [formOpen, setFormOpen] = useState(false);
    const [editingFilter, setEditingFilter] = useState<MgmtTargetFilterQuery | null>(null);
    const [autoAssignOnly, setAutoAssignOnly] = useState(false);
    const [distributionSetQuery, setDistributionSetQuery] = useState('');
    const [distributionSetLimit, setDistributionSetLimit] = useState(50);

    const { data, isLoading, refetch } = useGetFilters({ limit: 200, sort: 'name:ASC' });
    const { data: distributionSetsData, isLoading: distributionSetsLoading } = useGetDistributionSets({
        limit: distributionSetLimit,
        sort: 'name:ASC',
        q: distributionSetQuery || undefined,
    });

    const createMutation = useCreateFilter({
        mutation: {
            onSuccess: () => {
                message.success(t('savedFilters.createSuccess'));
            },
            onError: (error) => {
                message.error((error as Error).message || t('savedFilters.createError'));
            },
        },
    });

    const updateMutation = useUpdateFilter({
        mutation: {
            onSuccess: () => {
                message.success(t('savedFilters.updateSuccess'));
            },
            onError: (error) => {
                message.error((error as Error).message || t('savedFilters.updateError'));
            },
        },
    });

    const deleteMutation = useDeleteFilter({
        mutation: {
            onSuccess: () => {
                message.success(t('savedFilters.deleteSuccess'));
                refetch();
            },
            onError: (error) => {
                message.error((error as Error).message || t('savedFilters.deleteError'));
            },
        },
    });

    const autoAssignMutation = usePostAssignedDistributionSet1({
        mutation: {
            onSuccess: () => {
                message.success(t('savedFilters.autoAssign.saveSuccess'));
            },
            onError: (error) => {
                message.error((error as Error).message || t('savedFilters.autoAssign.saveError'));
            },
        },
    });

    const autoAssignDeleteMutation = useDeleteAssignedDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('savedFilters.autoAssign.removeSuccess'));
            },
            onError: (error) => {
                message.error((error as Error).message || t('savedFilters.autoAssign.removeError'));
            },
        },
    });

    const filters = useMemo(() => data?.content || [], [data?.content]);
    const filteredFilters = useMemo(() => {
        if (!autoAssignOnly) {
            return filters;
        }
        return filters.filter((filter) => Boolean(filter.autoAssignDistributionSet));
    }, [filters, autoAssignOnly]);
    const distributionSetOptions = useMemo(() => {
        const options = (distributionSetsData?.content || []).map((ds) => ({
            value: ds.id,
            label: `${ds.name} (v${ds.version})`,
        }));
        if (editingFilter?.autoAssignDistributionSet && !options.some((option) => option.value === editingFilter.autoAssignDistributionSet)) {
            options.unshift({
                value: editingFilter.autoAssignDistributionSet,
                label: `ID ${editingFilter.autoAssignDistributionSet}`,
            });
        }
        return options;
    }, [distributionSetsData?.content, editingFilter?.autoAssignDistributionSet]);
    const hasMoreDistributionSets = useMemo(() => {
        if (!distributionSetsData) {
            return false;
        }
        if (typeof distributionSetsData.total === 'number') {
            return distributionSetsData.total > (distributionSetsData.content?.length || 0);
        }
        return (distributionSetsData.content?.length || 0) >= distributionSetLimit;
    }, [distributionSetsData, distributionSetLimit]);

    const openCreate = () => {
        setEditingFilter(null);
        form.resetFields();
        form.setFieldsValue({
            autoAssignEnabled: false,
            autoAssignActionType: 'soft',
        });
        setFormOpen(true);
    };

    const openEdit = (filter: MgmtTargetFilterQuery) => {
        setEditingFilter(filter);
        form.setFieldsValue({
            name: filter.name,
            query: filter.query,
            autoAssignEnabled: Boolean(filter.autoAssignDistributionSet),
            autoAssignDistributionSet: filter.autoAssignDistributionSet,
            autoAssignActionType: filter.autoAssignActionType || 'soft',
            autoAssignWeight: filter.autoAssignWeight,
            autoAssignConfirmationRequired: filter.confirmationRequired,
        });
        setFormOpen(true);
    };

    const handleDistributionSetSearch = (value: string) => {
        const query = value.trim() ? buildWildcardSearch('name', value) : '';
        setDistributionSetQuery(query);
        setDistributionSetLimit(50);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = { name: values.name, query: values.query };
            const enableAutoAssign = values.autoAssignEnabled;
            let savedFilter: MgmtTargetFilterQuery | undefined;

            if (editingFilter?.id) {
                savedFilter = await updateMutation.mutateAsync({
                    filterId: editingFilter.id,
                    data: payload,
                });
            } else {
                savedFilter = await createMutation.mutateAsync({ data: payload });
            }

            const filterId = savedFilter?.id ?? editingFilter?.id;
            if (!filterId) {
                return;
            }

            if (enableAutoAssign) {
                const autoAssignPayload: MgmtDistributionSetAutoAssignment = {
                    id: values.autoAssignDistributionSet,
                    type: values.autoAssignActionType,
                    weight: values.autoAssignWeight,
                    confirmationRequired: values.autoAssignConfirmationRequired,
                };
                await autoAssignMutation.mutateAsync({
                    filterId,
                    data: autoAssignPayload,
                });
            } else if (editingFilter?.autoAssignDistributionSet) {
                await autoAssignDeleteMutation.mutateAsync({ filterId });
            }

            setFormOpen(false);
            setEditingFilter(null);
            form.resetFields();
            refetch();
        } catch {
            // Validation error
        }
    };

    const columns = [
        {
            title: t('savedFilters.columns.name'),
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <Text strong>{name || '-'}</Text>,
        },
        {
            title: t('savedFilters.columns.query'),
            dataIndex: 'query',
            key: 'query',
            render: (query: string) => <Text code>{query || '-'}</Text>,
        },
        {
            title: t('savedFilters.columns.autoAssign'),
            dataIndex: 'autoAssignDistributionSet',
            key: 'autoAssignDistributionSet',
            render: (_: number | undefined, record: MgmtTargetFilterQuery) => {
                if (!record.autoAssignDistributionSet) {
                    return <Text type="secondary">-</Text>;
                }
                const ds = distributionSetsData?.content?.find((item) => item.id === record.autoAssignDistributionSet);
                return (
                    <Tag color="blue">
                        {ds ? `${ds.name} v${ds.version}` : `ID ${record.autoAssignDistributionSet}`}
                    </Tag>
                );
            },
        },
        {
            title: t('savedFilters.columns.updated'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            render: (value: number | undefined) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: t('savedFilters.columns.actions'),
            key: 'actions',
            render: (_: unknown, record: MgmtTargetFilterQuery) => (
                <Space>
                    <Button size="small" onClick={() => onApply(record)}>
                        {t('savedFilters.apply')}
                    </Button>
                    {canEdit && (
                        <>
                            <Button size="small" onClick={() => openEdit(record)}>
                                {t('savedFilters.edit')}
                            </Button>
                            <Popconfirm
                                title={t('savedFilters.deleteConfirmTitle')}
                                description={t('savedFilters.deleteConfirmDesc')}
                                onConfirm={() => deleteMutation.mutate({ filterId: record.id })}
                            >
                                <Button size="small" danger>
                                    {t('savedFilters.delete')}
                                </Button>
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Modal
                title={t('savedFilters.title')}
                open={open}
                onCancel={onClose}
                footer={
                    <Space>
                        <Button onClick={onClose}>{t('savedFilters.close')}</Button>
                        {canEdit && (
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                                {t('savedFilters.create')}
                            </Button>
                        )}
                    </Space>
                }
                width={900}
                destroyOnHidden
            >
                <Space style={{ marginBottom: 12 }}>
                    <Switch checked={autoAssignOnly} onChange={setAutoAssignOnly} />
                    <Text>{t('savedFilters.autoAssignOnly')}</Text>
                </Space>
                {filteredFilters.length === 0 ? (
                    <Tag>{t('savedFilters.empty')}</Tag>
                ) : (
                    <Table
                        rowKey="id"
                        dataSource={filteredFilters}
                        columns={columns}
                        loading={isLoading}
                        pagination={false}
                    />
                )}
            </Modal>

            <Modal
                title={editingFilter ? t('savedFilters.editTitle') : t('savedFilters.createTitle')}
                open={formOpen}
                onCancel={() => {
                    setFormOpen(false);
                    setEditingFilter(null);
                    form.resetFields();
                }}
                onOk={handleSubmit}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
                destroyOnHidden
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label={t('savedFilters.fields.name')}
                        rules={[{ required: true, message: t('savedFilters.validation.name') }]}
                    >
                        <Input placeholder={t('savedFilters.placeholders.name')} />
                    </Form.Item>
                    <Form.Item
                        name="query"
                        label={t('savedFilters.fields.query')}
                        rules={[{ required: true, message: t('savedFilters.validation.query') }]}
                    >
                        <Input.TextArea rows={3} placeholder={t('savedFilters.placeholders.query')} />
                    </Form.Item>

                    <Divider />

                    <Form.Item
                        name="autoAssignEnabled"
                        label={t('savedFilters.autoAssign.title')}
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, next) => prev.autoAssignEnabled !== next.autoAssignEnabled}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('autoAssignEnabled') ? (
                                <>
                                    <Form.Item
                                        name="autoAssignDistributionSet"
                                        label={t('savedFilters.autoAssign.distributionSet')}
                                        rules={[{ required: true, message: t('savedFilters.autoAssign.validation.distributionSet') }]}
                                    >
                                        <Select
                                            placeholder={t('savedFilters.autoAssign.distributionSetPlaceholder')}
                                            loading={distributionSetsLoading}
                                            options={distributionSetOptions}
                                            showSearch
                                            filterOption={false}
                                            onSearch={handleDistributionSetSearch}
                                            allowClear
                                            onClear={() => handleDistributionSetSearch('')}
                                            dropdownRender={(menu) => (
                                                <>
                                                    {menu}
                                                    <Divider style={{ margin: '8px 0' }} />
                                                    <Button
                                                        type="text"
                                                        block
                                                        disabled={!hasMoreDistributionSets}
                                                        onClick={() => setDistributionSetLimit((prev) => prev + 50)}
                                                    >
                                                        {t('savedFilters.autoAssign.loadMore')}
                                                    </Button>
                                                </>
                                            )}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="autoAssignActionType"
                                        label={t('savedFilters.autoAssign.actionType')}
                                        rules={[{ required: true, message: t('savedFilters.autoAssign.validation.actionType') }]}
                                    >
                                        <Select
                                            options={[
                                                { value: 'soft', label: t('assign.soft') },
                                                { value: 'forced', label: t('assign.forced') },
                                                { value: 'timeforced', label: t('assign.timeforced') },
                                                { value: 'downloadonly', label: t('assign.downloadOnly') },
                                            ]}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="autoAssignWeight"
                                        label={t('savedFilters.autoAssign.weight')}
                                    >
                                        <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item
                                        name="autoAssignConfirmationRequired"
                                        label={t('savedFilters.autoAssign.confirmationRequired')}
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>
                                </>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SavedFiltersModal;
