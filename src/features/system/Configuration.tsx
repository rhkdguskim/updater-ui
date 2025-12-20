import React from 'react';
import { Card, Table, Typography, Spin, Alert, Tag, Space, Button } from 'antd';
import { ReloadOutlined, LockOutlined } from '@ant-design/icons';
import { useGetTenantConfiguration } from '@/api/generated/system-configuration/system-configuration';
import { useAuthStore } from '@/stores/useAuthStore';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const Configuration: React.FC = () => {
    const { t } = useTranslation('system');
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    const { data, isLoading, error, refetch } = useGetTenantConfiguration();

    // Configuration key descriptions
    const configDescriptions: Record<string, string> = {
        'pollingTime': t('descriptions.pollingTime'),
        'pollingOverdueTime': t('descriptions.pollingOverdueTime'),
        'authentication.targettoken.enabled': t('descriptions.authTargetToken'),
        'authentication.gatewaytoken.enabled': t('descriptions.authGatewayToken'),
        'rollout.approval.enabled': t('descriptions.rolloutApproval'),
        'repository.actions.autoclose.enabled': t('descriptions.actionsAutoclose'),
        'maintenanceWindowPollCount': t('descriptions.maintenanceWindowPollCount'),
        'anonymous.download.enabled': t('descriptions.anonymousDownload'),
        'multi.assignments.enabled': t('descriptions.multiAssignments'),
        'batch.assignments.enabled': t('descriptions.batchAssignments'),
        'action.cleanup.enabled': t('descriptions.actionCleanupEnabled'),
        'action.cleanup.actionExpiry': t('descriptions.actionCleanupExpiry'),
        'action.cleanup.actionStatus': t('descriptions.actionCleanupStatus'),
    };

    const formatValue = (value: unknown): React.ReactNode => {
        if (typeof value === 'boolean') {
            return (
                <Tag color={value ? 'success' : 'default'}>
                    {value ? t('values.enabled') : t('values.disabled')}
                </Tag>
            );
        }
        if (value === null || value === undefined) {
            return <Text type="secondary">-</Text>;
        }
        if (Array.isArray(value)) {
            return value.join(', ') || '-';
        }
        return String(value);
    };

    // Admin only access
    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (isLoading) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    type="error"
                    message={t('errors.loadFailed')}
                    description={t('errors.loadFailedDesc')}
                    showIcon
                />
            </div>
        );
    }

    // Transform config data to table format
    const configData = data ? Object.entries(data).map(([key, value]) => ({
        key,
        value: (value as { value?: unknown })?.value ?? value,
        description: configDescriptions[key] || key,
    })) : [];

    const columns = [
        {
            title: t('columns.key'),
            dataIndex: 'key',
            key: 'key',
            width: '35%',
            render: (key: string) => <Text code>{key}</Text>,
        },
        {
            title: t('columns.value'),
            dataIndex: 'value',
            key: 'value',
            width: '25%',
            render: formatValue,
        },
        {
            title: t('columns.description'),
            dataIndex: 'description',
            key: 'description',
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <Title level={2} style={{ margin: 0 }}>{t('pageTitle')}</Title>
                        <Tag icon={<LockOutlined />} color="blue">{t('readOnly')}</Tag>
                    </Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                        loading={isLoading}
                    >
                        {t('refresh')}
                    </Button>
                </div>

                <Card>
                    <Table
                        dataSource={configData}
                        columns={columns}
                        pagination={false}
                        rowKey="key"
                    />
                </Card>
            </Space>
        </div>
    );
};

export default Configuration;

