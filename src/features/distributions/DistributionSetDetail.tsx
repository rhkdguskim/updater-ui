import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Button, message, Space, Tag, Modal } from 'antd';
import {
    ArrowLeftOutlined,
    PlusOutlined,
    StopOutlined,
    CopyOutlined
} from '@ant-design/icons';
import {
    useGetDistributionSet,
    useGetAssignedSoftwareModules,
    useAssignSoftwareModules,
    useInvalidateDistributionSet,
    useCreateDistributionSets,
} from '@/api/generated/distribution-sets/distribution-sets';
import { useAuthStore } from '@/stores/useAuthStore';
import { format } from 'date-fns';
import AssignModuleModal from './components/AssignModuleModal';
import SetMetadataTab from './components/SetMetadataTab';
import SetTagsTab from './components/SetTagsTab';
import SetStatisticsTab from './components/SetStatisticsTab';
import SetTargetsTab from './components/SetTargetsTab';
import type { MgmtSoftwareModuleAssignment, MgmtSoftwareModule, MgmtDistributionSetRequestBodyPost } from '@/api/generated/model';
import type { TableProps } from 'antd';

import { useTranslation } from 'react-i18next';

const DistributionSetDetail: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const distributionSetId = parseInt(id || '0', 10);
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const [activeTab, setActiveTab] = useState('overview');
    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);

    // Fetch Distribution Set Details
    const { data: setData, isLoading: isSetLoading } = useGetDistributionSet(distributionSetId);

    // Fetch Assigned Modules
    const {
        data: assignedModulesData,
        isLoading: isModulesLoading,
        refetch: refetchModules
    } = useGetAssignedSoftwareModules(distributionSetId);

    // Assign Mutation
    const assignMutation = useAssignSoftwareModules({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.assignSuccess'));
                setIsAssignModalVisible(false);
                refetchModules();
            },
            onError: (error) => {
                message.error((error as Error).message || t('detail.assignError'));
            },
        },
    });

    const handleAssignModules = (moduleIds: number[]) => {
        const assignments: MgmtSoftwareModuleAssignment[] = moduleIds.map((id) => ({ id }));
        assignMutation.mutate({ distributionSetId, data: assignments });
    };

    // Invalidate Mutation
    const invalidateMutation = useInvalidateDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.invalidateSuccess') || 'Distribution set invalidated successfully');
                navigate('/distributions/sets');
            },
            onError: (error) => {
                message.error((error as Error).message || 'Failed to invalidate distribution set');
            }
        }
    });

    const handleInvalidate = () => {
        Modal.confirm({
            title: t('messages.invalidateConfirmTitle') || 'Invalidate Distribution Set',
            content: t('messages.invalidateConfirmDesc') || 'Once invalidated, this set cannot be used for new deployments. This action is permanent.',
            okText: t('actions.invalidate') || 'Invalidate',
            okType: 'danger',
            onOk: () => invalidateMutation.mutate({
                distributionSetId,
                data: {
                    actionCancelationType: 'soft',
                    cancelRollouts: true
                }
            })
        });
    };

    // Clone Logic (Manual)
    const createDsMutation = useCreateDistributionSets();

    const handleClone = async () => {
        if (!setData) return;
        try {
            const newName = `${setData.name}_copy`;
            const payload: MgmtDistributionSetRequestBodyPost = {
                name: newName,
                version: `${setData.version}_clone`,
                type: setData.type,
                description: setData.description,
                requiredMigrationStep: setData.requiredMigrationStep,
            };

            const response = await createDsMutation.mutateAsync({ data: [payload] });
            const newDsId = response[0]?.id;

            if (newDsId && assignedModulesData?.content) {
                const moduleIds = assignedModulesData.content.map(m => ({ id: m.id }));
                await assignMutation.mutateAsync({ distributionSetId: newDsId, data: moduleIds });
            }

            message.success(t('messages.cloneSuccess') || 'Distribution set cloned successfully');
            navigate(`/distributions/sets/${newDsId}`);
        } catch (error) {
            message.error('Failed to clone distribution set');
        }
    };

    const overviewTab = (
        <Descriptions bordered column={1}>
            <Descriptions.Item label={t('detail.labels.name')}>{setData?.name}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.version')}>{setData?.version}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.type')}>{setData?.typeName}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.description')}>{setData?.description}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.requiredMigration')}>
                <Tag color={setData?.requiredMigrationStep ? 'red' : 'green'}>
                    {setData?.requiredMigrationStep ? t('detail.values.yes') : t('detail.values.no')}
                </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.functionallyComplete')}>
                <Tag color={setData?.complete ? 'success' : 'warning'}>
                    {setData?.complete ? t('detail.values.yes') : t('detail.values.no')}
                </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.createdBy')}>{setData?.createdBy}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.createdAt')}>
                {setData?.createdAt ? format(setData.createdAt, 'yyyy-MM-dd HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.lastModifiedBy')}>{setData?.lastModifiedBy}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.lastModifiedAt')}>
                {setData?.lastModifiedAt ? format(setData.lastModifiedAt, 'yyyy-MM-dd HH:mm:ss') : '-'}
            </Descriptions.Item>
        </Descriptions>
    );

    const columns: TableProps<MgmtSoftwareModule>['columns'] = [
        {
            title: t('list.columns.name'),
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <a onClick={() => navigate(`/distributions/modules/${record.id}`)}>{text}</a>
            )
        },
        {
            title: t('list.columns.version'),
            dataIndex: 'version',
            key: 'version',
        },
        {
            title: t('list.columns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
        },
        {
            title: t('list.columns.vendor'),
            dataIndex: 'vendor',
            key: 'vendor',
        },
    ];

    const modulesTab = (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {isAdmin && (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAssignModalVisible(true)}
                >
                    {t('detail.assignModule')}
                </Button>
            )}
            <Table
                dataSource={assignedModulesData?.content || []}
                rowKey="id"
                loading={isModulesLoading}
                pagination={false}
                columns={columns}
            />
            <AssignModuleModal
                visible={isAssignModalVisible}
                onCancel={() => setIsAssignModalVisible(false)}
                onAssign={handleAssignModules}
                isAssigning={assignMutation.isPending}
                excludedModuleIds={assignedModulesData?.content?.map((m) => m.id).filter((id): id is number => id !== undefined) || []}
            />
        </Space>
    );

    return (
        <Card
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/distributions/sets')} type="text" />
                        {setData?.name} <Tag color="blue">{setData?.version}</Tag>
                    </Space>
                    {isAdmin && (
                        <Space>
                            <Button
                                icon={<CopyOutlined />}
                                onClick={handleClone}
                                loading={createDsMutation.isPending}
                            >
                                {t('actions.clone') || 'Clone'}
                            </Button>
                            <Button
                                danger
                                icon={<StopOutlined />}
                                onClick={handleInvalidate}
                                loading={invalidateMutation.isPending}
                            >
                                {t('actions.invalidate') || 'Invalidate'}
                            </Button>
                        </Space>
                    )}
                </div>
            }
            loading={isSetLoading}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: 'overview', label: t('detail.overview'), children: overviewTab },
                    { key: 'modules', label: t('detail.assignedModules'), children: modulesTab },
                    { key: 'metadata', label: t('detail.metadata'), children: <SetMetadataTab distributionSetId={distributionSetId} isAdmin={isAdmin} /> },
                    { key: 'tags', label: t('detail.tags'), children: <SetTagsTab distributionSetId={distributionSetId} isAdmin={isAdmin} /> },
                    { key: 'statistics', label: t('detail.statistics') || 'Statistics', children: <SetStatisticsTab distributionSetId={distributionSetId} /> },
                    { key: 'targets', label: t('detail.targets') || 'Targets', children: <SetTargetsTab distributionSetId={distributionSetId} /> },
                ]}
            />
        </Card>
    );
};

export default DistributionSetDetail;
