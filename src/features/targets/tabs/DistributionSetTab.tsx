import React from 'react';
import { Descriptions, Typography, Skeleton, Empty, Tag, Card, List, Button, Space } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import type { MgmtDistributionSet } from '@/api/generated/model';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface DistributionSetTabProps {
    installedDS: MgmtDistributionSet | null | undefined;
    assignedDS: MgmtDistributionSet | null | undefined;
    loading: boolean;
    onAssign?: () => void;
    canAssign?: boolean;
}

import { useTranslation } from 'react-i18next';
// ...

const DSCard: React.FC<{ ds: MgmtDistributionSet | null | undefined; title: string; type: 'installed' | 'assigned' }> = ({
    ds,
    title,
    type,
}) => {
    const { t } = useTranslation('targets');
    if (!ds) {
        return (
            <Card title={title} style={{ marginBottom: 16 }}>
                <Empty description={type === 'installed' ? t('ds.noInstalled') : t('ds.noAssigned')} />
            </Card>
        );
    }

    return (
        <Card
            title={
                <>
                    {title}
                    {type === 'installed' && <Tag color="green" style={{ marginLeft: 8 }}>{t('ds.current')}</Tag>}
                    {type === 'assigned' && <Tag color="blue" style={{ marginLeft: 8 }}>{t('ds.pending')}</Tag>}
                </>
            }
            style={{ marginBottom: 16 }}
        >
            <Descriptions column={2} size="small">
                <Descriptions.Item label={t('table.name')}>
                    <Text strong>{ds.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Version">
                    <Tag color="cyan">v{ds.version}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('form.description')} span={2}>
                    {ds.description || <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label={t('table.type')}>
                    {ds.type ? <Tag>{ds.type}</Tag> : <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label={t('ds.requiredMigration')}>
                    <Tag color={ds.requiredMigrationStep ? 'orange' : 'default'}>
                        {ds.requiredMigrationStep ? t('ds.yes') : t('ds.no')}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('overview.created')}>
                    {ds.createdAt ? dayjs(ds.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('ds.modules')}>
                    {ds.modules?.length || 0} module(s)
                </Descriptions.Item>
            </Descriptions>

            {ds.modules && ds.modules.length > 0 && (
                <>
                    <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
                        {t('ds.softwareModules')}
                    </Title>
                    <List
                        size="small"
                        dataSource={ds.modules}
                        renderItem={(module) => (
                            <List.Item>
                                <Text>{module.name}</Text>
                                <Tag style={{ marginLeft: 8 }}>{module.type}</Tag>
                                <Tag color="blue">v{module.version}</Tag>
                            </List.Item>
                        )}
                    />
                </>
            )}
        </Card>
    );
};

const DistributionSetTab: React.FC<DistributionSetTabProps> = ({
    installedDS,
    assignedDS,
    loading,
    onAssign,
    canAssign,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    if (loading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    const hasAnyDS = installedDS || assignedDS;

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {canAssign && (
                <div style={{ textAlign: 'right' }}>
                    <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        onClick={onAssign}
                    >
                        {t('assign.title')}
                    </Button>
                </div>
            )}

            {!hasAnyDS && !canAssign ? (
                <Empty description={t('ds.noConfigured')} />
            ) : (
                <>
                    <DSCard ds={installedDS} title={t('ds.installed')} type="installed" />
                    <DSCard ds={assignedDS} title={t('ds.assigned')} type="assigned" />
                </>
            )}
        </Space>
    );
};

export default DistributionSetTab;
