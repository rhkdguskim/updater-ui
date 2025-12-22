import React, { useState } from 'react';
import { Card, Table, Typography, Space, Button, message, Tag, Breadcrumb } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import { useGetDistributionSetTags, useAssignDistributionSets, useUnassignDistributionSets } from '@/api/generated/distribution-set-tags/distribution-set-tags';
import { useTranslation } from 'react-i18next';
import { LeftOutlined } from '@ant-design/icons';
import type { MgmtTag } from '@/api/generated/model';

const { Title, Text } = Typography;

const DistributionBulkAssign: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const navigate = useNavigate();

    const [selectedSetIds, setSelectedSetIds] = useState<number[]>([]);
    const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

    // Fetch DS
    const { data: dsData, isLoading: dsLoading } = useGetDistributionSets({ limit: 100 });

    // Fetch Tags
    const { data: tagsData } = useGetDistributionSetTags({ limit: 100 });
    const tags = (tagsData?.content as MgmtTag[]) || [];

    const assignMutation = useAssignDistributionSets();
    const unassignMutation = useUnassignDistributionSets();

    const handleBulkAssign = async () => {
        if (selectedSetIds.length === 0 || !selectedTagId) {
            message.warning(t('bulkAssignment.warningSelectBoth'));
            return;
        }

        try {
            await assignMutation.mutateAsync({
                distributionsetTagId: selectedTagId,
                data: selectedSetIds
            });
            message.success(t('bulkAssignment.assignSuccess'));
            setSelectedSetIds([]);
        } catch (error) {
            message.error(t('bulkAssignment.assignError'));
        }
    };

    const handleBulkUnassign = async () => {
        if (selectedSetIds.length === 0 || !selectedTagId) {
            message.warning(t('bulkAssignment.warningSelectBoth'));
            return;
        }

        try {
            await unassignMutation.mutateAsync({
                distributionsetTagId: selectedTagId,
                data: selectedSetIds
            });
            message.success(t('bulkAssignment.unassignSuccess'));
            setSelectedSetIds([]);
        } catch (error) {
            message.error(t('bulkAssignment.unassignError'));
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
        },
        {
            title: t('list.columns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
        }
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Breadcrumb
                items={[
                    { title: t('pageTitle'), href: '/distributions' },
                    { title: t('list.title'), href: '/distributions/sets' },
                    { title: t('bulkAssignment.title') },
                ]}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={3} style={{ margin: 0 }}>
                    <Button
                        type="text"
                        icon={<LeftOutlined />}
                        onClick={() => navigate('/distributions/sets')}
                        style={{ marginRight: 8 }}
                    />
                    {t('bulkAssignment.bulkTagAssignment')}
                </Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
                <Card title={t('bulkAssignment.step1')}>
                    <Table
                        rowSelection={{
                            type: 'checkbox',
                            selectedRowKeys: selectedSetIds,
                            onChange: (keys) => setSelectedSetIds(keys as number[]),
                        }}
                        columns={columns}
                        dataSource={dsData?.content || []}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        loading={dsLoading}
                        size="small"
                    />
                </Card>

                <Card title={t('bulkAssignment.step2')}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Text strong>{t('bulkAssignment.availableTags')}</Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {tags.map(tag => (
                                <Tag.CheckableTag
                                    key={tag.id}
                                    checked={selectedTagId === tag.id}
                                    onChange={(checked) => setSelectedTagId(checked ? tag.id! : null)}
                                    style={{
                                        border: selectedTagId === tag.id ? `1px solid ${tag.colour}` : '1px solid transparent',
                                        backgroundColor: selectedTagId === tag.id ? tag.colour : undefined,
                                        color: selectedTagId === tag.id ? 'white' : undefined,
                                        padding: '4px 8px'
                                    }}
                                >
                                    {tag.name}
                                </Tag.CheckableTag>
                            ))}
                            {tags.length === 0 && <Text type="secondary">{t('bulkAssignment.noTagsFound')}</Text>}
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <Button
                                type="primary"
                                block
                                style={{ marginBottom: 12 }}
                                onClick={handleBulkAssign}
                                loading={assignMutation.isPending}
                                disabled={selectedSetIds.length === 0 || !selectedTagId}
                            >
                                {t('bulkAssignment.assign')}
                            </Button>
                            <Button
                                danger
                                block
                                onClick={handleBulkUnassign}
                                loading={unassignMutation.isPending}
                                disabled={selectedSetIds.length === 0 || !selectedTagId}
                            >
                                {t('bulkAssignment.unassign')}
                            </Button>
                        </div>

                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {t('bulkAssignment.selectedCount', { count: selectedSetIds.length })}
                        </Text>
                    </Space>
                </Card>
            </div>
        </Space>
    );
};

export default DistributionBulkAssign;
