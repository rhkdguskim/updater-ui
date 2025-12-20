import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Button, Upload, message, Modal, Space, Tag, Tooltip } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, DownloadOutlined, FileOutlined, InboxOutlined } from '@ant-design/icons';
import {
    useGetSoftwareModule,
    useGetArtifacts,
    useUploadArtifact,
    useDeleteArtifact,
} from '@/api/generated/software-modules/software-modules';
import { useAuthStore } from '@/stores/useAuthStore';
import { format } from 'date-fns';
import type { MgmtArtifact } from '@/api/generated/model';
import ModuleMetadataTab from './components/ModuleMetadataTab';

import { useTranslation } from 'react-i18next';

const SoftwareModuleDetail: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const softwareModuleId = parseInt(id || '0', 10);
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch Module Details
    const { data: moduleData, isLoading: isModuleLoading } = useGetSoftwareModule(softwareModuleId);

    // Fetch Artifacts
    const { data: artifactsData, isLoading: isArtifactsLoading, refetch: refetchArtifacts } = useGetArtifacts(softwareModuleId);

    // Upload Artifact
    const uploadMutation = useUploadArtifact({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.uploadArtifactSuccess'));
                refetchArtifacts();
            },
            onError: () => {
                message.error(t('detail.uploadArtifactError'));
            },
        },
    });

    // Delete Artifact
    const deleteArtifactMutation = useDeleteArtifact({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.deleteArtifactSuccess'));
                refetchArtifacts();
            },
            onError: () => {
                message.error(t('detail.deleteArtifactError'));
            },
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        try {
            await uploadMutation.mutateAsync({
                softwareModuleId,
                data: { file: file as Blob },
                params: { filename: (file as File).name },
            });
            onSuccess('ok');
        } catch (err) {
            onError({ err });
        }
    };

    const handleDeleteArtifact = (artifactId: number) => {
        Modal.confirm({
            title: t('detail.deleteArtifactConfirmTitle'),
            content: t('detail.deleteArtifactConfirmDesc'),
            okText: t('actions.delete'),
            okType: 'danger',
            cancelText: t('common:actions.cancel'),
            onOk: () => deleteArtifactMutation.mutate({ softwareModuleId, artifactId }),
        });
    };

    const overviewTab = (
        <Descriptions bordered column={1}>
            <Descriptions.Item label={t('detail.labels.name')}>{moduleData?.name}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.version')}>{moduleData?.version}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.type')}>{moduleData?.typeName}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.vendor')}>{moduleData?.vendor}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.description')}>{moduleData?.description}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.createdBy')}>{moduleData?.createdBy}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.createdAt')}>
                {moduleData?.createdAt ? format(moduleData.createdAt, 'yyyy-MM-dd HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.lastModifiedBy')}>{moduleData?.lastModifiedBy}</Descriptions.Item>
            <Descriptions.Item label={t('detail.labels.lastModifiedAt')}>
                {moduleData?.lastModifiedAt ? format(moduleData.lastModifiedAt, 'yyyy-MM-dd HH:mm:ss') : '-'}
            </Descriptions.Item>
        </Descriptions>
    );

    const artifactsTab = (
        <div>
            {isAdmin && (
                <Upload.Dragger
                    customRequest={handleUpload}
                    showUploadList={false}
                    style={{ marginBottom: 16 }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">{t('detail.dragDropTitle')}</p>
                    <p className="ant-upload-hint">
                        {t('detail.dragDropHint')}
                    </p>
                </Upload.Dragger>
            )}
            <Table
                dataSource={artifactsData}
                rowKey="id"
                loading={isArtifactsLoading}
                pagination={false}
                columns={[
                    {
                        title: t('detail.artifactsColumns.filename'),
                        dataIndex: 'providedFilename',
                        key: 'providedFilename',
                        render: (text) => (
                            <Space>
                                <FileOutlined />
                                {text}
                            </Space>
                        ),
                    },
                    {
                        title: t('detail.artifactsColumns.size'),
                        dataIndex: 'size',
                        key: 'size',
                        render: (size) => size ? `${(size / 1024).toFixed(2)} KB` : '-',
                    },
                    {
                        title: t('detail.artifactsColumns.hashes'),
                        key: 'hashes',
                        render: (_, record: MgmtArtifact) => (
                            <Space direction="vertical" size="small">
                                <Tag>MD5: {record.hashes?.md5?.substring(0, 8)}...</Tag>
                                <Tag>SHA1: {record.hashes?.sha1?.substring(0, 8)}...</Tag>
                            </Space>
                        ),
                    },
                    {
                        title: t('detail.artifactsColumns.actions'),
                        key: 'actions',
                        render: (_, record: MgmtArtifact) => (
                            <Space>
                                <Tooltip title="Download">
                                    <Button
                                        icon={<DownloadOutlined />}
                                        type="text"
                                        // This is a placeholder as direct download link handling needs careful auth consideration
                                        onClick={() => message.info(t('detail.downloadNotImplemented'))}
                                    />
                                </Tooltip>
                                {isAdmin && record.id && (
                                    <Tooltip title={t('actions.delete')}>
                                        <Button
                                            icon={<DeleteOutlined />}
                                            danger
                                            type="text"
                                            onClick={() => handleDeleteArtifact(record.id!)}
                                        />
                                    </Tooltip>
                                )}
                            </Space>
                        ),
                    },
                ]}
            />
        </div>
    );

    return (
        <Card
            title={
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/distributions/modules')} type="text" />
                    {moduleData?.name} <Tag color="blue">{moduleData?.version}</Tag>
                </Space>
            }
            loading={isModuleLoading}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: 'overview', label: t('detail.overview'), children: overviewTab },
                    { key: 'artifacts', label: t('detail.artifacts'), children: artifactsTab },
                    { key: 'metadata', label: t('detail.metadata'), children: <ModuleMetadataTab softwareModuleId={softwareModuleId} isAdmin={isAdmin} /> },
                ]}
            />
        </Card>
    );
};

export default SoftwareModuleDetail;
