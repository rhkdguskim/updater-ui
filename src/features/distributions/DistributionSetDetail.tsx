import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Button, message, Space, Tag } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import {
    useGetDistributionSet,
    useGetAssignedSoftwareModules,
    useAssignSoftwareModules,
} from '@/api/generated/distribution-sets/distribution-sets';
import { useAuthStore } from '@/stores/useAuthStore';
import { format } from 'date-fns';
import AssignModuleModal from './components/AssignModuleModal';
import SetMetadataTab from './components/SetMetadataTab';
import SetTagsTab from './components/SetTagsTab';
import type { MgmtSoftwareModuleAssignment, MgmtSoftwareModule } from '@/api/generated/model';
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
        <div>
            {isAdmin && (
                <div style={{ marginBottom: 16 }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAssignModalVisible(true)}
                    >
                        {t('detail.assignModule')}
                    </Button>
                </div>
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
                // Exclude already assigned modules to prevent duplicates if necessary,
                // though backend might handle it.
                excludedModuleIds={assignedModulesData?.content?.map((m) => m.id).filter((id): id is number => id !== undefined) || []}
            />
        </div>
    );

    return (
        <Card
            title={
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/distributions/sets')} type="text" />
                    {setData?.name} <Tag color="blue">{setData?.version}</Tag>
                </Space>
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
                ]}
            />
        </Card>
    );
};

export default DistributionSetDetail;
