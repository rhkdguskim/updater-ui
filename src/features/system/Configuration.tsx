import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Typography,
    Spin,
    Alert,
    Tag,
    Space,
    Button,
    Switch,
    Input,
    InputNumber,
    Form,
    Row,
    Col,
    Tooltip,
    message,
} from 'antd';
import {
    ReloadOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import {
    useGetTenantConfiguration,
    useUpdateTenantConfiguration,
} from '@/api/generated/system-configuration/system-configuration';
import { useAuthStore } from '@/stores/useAuthStore';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer, HeaderRow } from '@/components/layout/PageLayout';

const { Title, Text, Paragraph } = Typography;

// Configuration group definitions
interface ConfigItem {
    key: string;
    type: 'boolean' | 'string' | 'number' | 'time' | 'array';
    descKey: string;
}

interface ConfigGroup {
    titleKey: string;
    descKey: string;
    items: ConfigItem[];
}

const CONFIG_GROUPS: ConfigGroup[] = [
    {
        titleKey: 'groups.pollingConnection',
        descKey: 'groups.pollingConnectionDesc',
        items: [
            { key: 'pollingTime', type: 'time', descKey: 'descriptions.pollingTime' },
            { key: 'pollingOverdueTime', type: 'time', descKey: 'descriptions.pollingOverdueTime' },
            { key: 'minPollingTime', type: 'time', descKey: 'descriptions.minPollingTime' },
            { key: 'maintenanceWindowPollCount', type: 'number', descKey: 'descriptions.maintenanceWindowPollCount' },
        ],
    },
    {
        titleKey: 'groups.authSecurity',
        descKey: 'groups.authSecurityDesc',
        items: [
            { key: 'authentication.targettoken.enabled', type: 'boolean', descKey: 'descriptions.authTargetToken' },
            { key: 'authentication.gatewaytoken.enabled', type: 'boolean', descKey: 'descriptions.authGatewayToken' },
            { key: 'authentication.gatewaytoken.key', type: 'string', descKey: 'descriptions.authGatewayTokenKey' },
            { key: 'authentication.header.enabled', type: 'boolean', descKey: 'descriptions.authHeader' },
            { key: 'authentication.header.authority', type: 'string', descKey: 'descriptions.authHeaderAuthority' },
        ],
    },
    {
        titleKey: 'groups.rolloutPolicy',
        descKey: 'groups.rolloutPolicyDesc',
        items: [
            { key: 'rollout.approval.enabled', type: 'boolean', descKey: 'descriptions.rolloutApproval' },
            { key: 'user.confirmation.flow.enabled', type: 'boolean', descKey: 'descriptions.userConfirmationFlow' },
        ],
    },
    {
        titleKey: 'groups.repoMaintenance',
        descKey: 'groups.repoMaintenanceDesc',
        items: [
            { key: 'repository.actions.autoclose.enabled', type: 'boolean', descKey: 'descriptions.actionsAutoclose' },
            { key: 'action.cleanup.enabled', type: 'boolean', descKey: 'descriptions.actionCleanupEnabled' },
            { key: 'action.cleanup.actionExpiry', type: 'number', descKey: 'descriptions.actionCleanupExpiry' },
            { key: 'action.cleanup.actionStatus', type: 'array', descKey: 'descriptions.actionCleanupStatus' },
            { key: 'implicit.lock.enabled', type: 'boolean', descKey: 'descriptions.implicitLock' },
        ],
    },
    {
        titleKey: 'groups.downloadSettings',
        descKey: 'groups.downloadSettingsDesc',
        items: [
            { key: 'anonymous.download.enabled', type: 'boolean', descKey: 'descriptions.anonymousDownload' },
        ],
    },
    {
        titleKey: 'groups.assignmentSettings',
        descKey: 'groups.assignmentSettingsDesc',
        items: [
            { key: 'multi.assignments.enabled', type: 'boolean', descKey: 'descriptions.multiAssignments' },
            { key: 'batch.assignments.enabled', type: 'boolean', descKey: 'descriptions.batchAssignments' },
        ],
    },
];

// Helper to extract value from API response
const extractValue = (configValue: unknown): unknown => {
    if (configValue && typeof configValue === 'object' && 'value' in configValue) {
        return (configValue as { value?: unknown }).value;
    }
    return configValue;
};

// Validate time format HH:mm:ss
const isValidTimeFormat = (value: string): boolean => {
    const timeRegex = /^([0-9]{2}):([0-5][0-9]):([0-5][0-9])$/;
    return timeRegex.test(value);
};

const Configuration: React.FC = () => {
    const { t } = useTranslation('system');
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const [messageApi, contextHolder] = message.useMessage();

    const { data, isLoading, error, refetch } = useGetTenantConfiguration();
    const updateMutation = useUpdateTenantConfiguration();

    const [isEditMode, setIsEditMode] = useState(false);
    const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Initialize edited values from API data
    useEffect(() => {
        if (data) {
            const initialValues: Record<string, unknown> = {};
            Object.entries(data).forEach(([key, value]) => {
                initialValues[key] = extractValue(value);
            });
            setEditedValues(initialValues);
        }
    }, [data]);



    // Calculate dynamic groups
    const allGroups = useMemo(() => {
        if (!data) return CONFIG_GROUPS;

        const knownKeys = new Set(CONFIG_GROUPS.flatMap(g => g.items.map(i => i.key)));
        const allKeys = Object.keys(data);
        const unknownKeys = allKeys.filter(key => !knownKeys.has(key));

        if (unknownKeys.length === 0) return CONFIG_GROUPS;

        const unknownGroup: ConfigGroup = {
            titleKey: 'groups.otherSettings',
            descKey: 'groups.otherSettingsDesc',
            items: unknownKeys.map(key => {
                const value = (data as any)[key]?.value ?? (data as any)[key];
                const type = typeof value === 'boolean' ? 'boolean'
                    : typeof value === 'number' ? 'number'
                        : Array.isArray(value) ? 'array'
                            : 'string';
                return {
                    key,
                    type,
                    descKey: key // Use key as description if translation missing
                } as ConfigItem;
            })
        };

        return [...CONFIG_GROUPS, unknownGroup];
    }, [data]);

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

    const handleValueChange = (key: string, value: unknown, type: string) => {
        setEditedValues((prev) => ({ ...prev, [key]: value }));

        // Validate
        const errors = { ...validationErrors };
        if (type === 'time' && typeof value === 'string') {
            if (value && !isValidTimeFormat(value)) {
                errors[key] = t('validation.invalidTime');
            } else {
                delete errors[key];
            }
        } else if (type === 'number') {
            if (value !== null && value !== undefined && isNaN(Number(value))) {
                errors[key] = t('validation.invalidNumber');
            } else {
                delete errors[key];
            }
        } else {
            delete errors[key];
        }
        setValidationErrors(errors);
    };

    const handleSave = async () => {
        // Check for validation errors
        if (Object.keys(validationErrors).length > 0) {
            messageApi.error(t('validation.invalidNumber'));
            return;
        }

        // Prepare update payload - only include changed values
        const changedValues: Record<string, unknown> = {};
        Object.entries(editedValues).forEach(([key, value]) => {
            const originalValue = extractValue(data?.[key as keyof typeof data]);
            // Allow saving if value changed (removed configuredKeys check to support dynamic keys)
            if (JSON.stringify(value) !== JSON.stringify(originalValue)) {
                changedValues[key] = value;
            }
        });

        if (Object.keys(changedValues).length === 0) {
            messageApi.info(t('messages.noChanges'));
            return;
        }

        try {
            await updateMutation.mutateAsync({ data: changedValues as Parameters<typeof updateMutation.mutateAsync>[0]['data'] });
            messageApi.success(t('messages.saveSuccess'));
            setIsEditMode(false);
            refetch();
        } catch {
            messageApi.error(t('messages.saveError'));
        }
    };

    const handleCancel = () => {
        // Reset to original values
        if (data) {
            const initialValues: Record<string, unknown> = {};
            Object.entries(data).forEach(([key, value]) => {
                initialValues[key] = extractValue(value);
            });
            setEditedValues(initialValues);
        }
        setValidationErrors({});
        setIsEditMode(false);
    };

    const renderValue = (item: ConfigItem): React.ReactNode => {
        const value = editedValues[item.key];
        const hasError = validationErrors[item.key];

        if (isEditMode) {
            switch (item.type) {
                case 'boolean':
                    return (
                        <Switch
                            checked={Boolean(value)}
                            onChange={(checked) => handleValueChange(item.key, checked, item.type)}
                            checkedChildren={t('values.enabled')}
                            unCheckedChildren={t('values.disabled')}
                        />
                    );
                case 'number':
                    return (
                        <Form.Item
                            validateStatus={hasError ? 'error' : undefined}
                            help={hasError}
                            style={{ margin: 0 }}
                        >
                            <InputNumber
                                value={value as number}
                                onChange={(val) => handleValueChange(item.key, val, item.type)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                case 'time':
                    return (
                        <Form.Item
                            validateStatus={hasError ? 'error' : undefined}
                            help={hasError}
                            style={{ margin: 0 }}
                        >
                            <Input
                                value={value as string}
                                onChange={(e) => handleValueChange(item.key, e.target.value, item.type)}
                                placeholder="HH:mm:ss"
                            />
                        </Form.Item>
                    );
                case 'array':
                    return (
                        <Input
                            value={Array.isArray(value) ? value.join(', ') : String(value || '')}
                            onChange={(e) =>
                                handleValueChange(
                                    item.key,
                                    e.target.value.split(',').map((v) => v.trim()),
                                    item.type
                                )
                            }
                            placeholder={t('placeholders.array')}
                        />
                    );
                default:
                    return (
                        <Input
                            value={String(value || '')}
                            onChange={(e) => handleValueChange(item.key, e.target.value, item.type)}
                        />
                    );
            }
        }

        // Read-only mode
        if (typeof value === 'boolean') {
            return (
                <Tag color={value ? 'success' : 'default'} icon={value ? <CheckCircleOutlined /> : undefined}>
                    {value ? t('values.enabled') : t('values.disabled')}
                </Tag>
            );
        }

        if (value === null || value === undefined) {
            return <Text type="secondary">-</Text>;
        }

        if (Array.isArray(value)) {
            return value.length > 0 ? (
                <Space wrap>
                    {value.map((v, i) => (
                        <Tag key={i}>{String(v)}</Tag>
                    ))}
                </Space>
            ) : (
                <Text type="secondary">-</Text>
            );
        }

        return <Text code>{String(value)}</Text>;
    };

    const renderConfigItem = (item: ConfigItem) => {
        const exists = item.key in (data || {});
        if (!exists) return null;

        return (
            <Row
                key={item.key}
                gutter={16}
                align="middle"
                style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                }}
            >
                <Col xs={24} sm={24} md={10}>
                    <Space direction="vertical" size={0}>
                        <Text code style={{ fontSize: 12 }}>
                            {item.key}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {t(item.descKey)}
                        </Text>
                    </Space>
                </Col>
                <Col xs={24} sm={24} md={14}>
                    <div style={{ marginTop: 8 }}>{renderValue(item)}</div>
                </Col>
            </Row>
        );
    };

    const renderGroup = (group: ConfigGroup, index: number) => {
        // Check if any item in group exists in data
        const hasVisibleItems = group.items.some((item) => item.key in (data || {}));
        if (!hasVisibleItems) return null;

        return (
            <Card
                key={index}
                title={
                    <Space>
                        <span>{t(group.titleKey)}</span>
                        <Tooltip title={t(group.descKey)}>
                            <InfoCircleOutlined style={{ color: '#999' }} />
                        </Tooltip>
                    </Space>
                }
                style={{ marginBottom: 16 }}
                styles={{
                    header: {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '8px 8px 0 0',
                    },
                }}
                headStyle={{
                    color: 'white',
                }}
            >
                <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    {t(group.descKey)}
                </Paragraph>
                {group.items.map(renderConfigItem)}
            </Card>
        );
    };

    return (
        <PageContainer>
            {contextHolder}

            <HeaderRow>
                <Space direction="vertical" size={0}>
                    <Title level={2} style={{ margin: 0 }}>
                        {t('pageTitle')}
                    </Title>
                    <Space size={4}>
                        {isEditMode ? (
                            <Tag color="orange" style={{ margin: 0 }}>{t('editMode')}</Tag>
                        ) : (
                            <Tag color="blue" style={{ margin: 0 }}>{t('readOnly')}</Tag>
                        )}
                    </Space>
                </Space>
                <Space>
                    {isEditMode ? (
                        <>
                            <Button icon={<CloseOutlined />} onClick={handleCancel}>
                                {t('cancel')}
                            </Button>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                loading={updateMutation.isPending}
                                disabled={Object.keys(validationErrors).length > 0}
                            >
                                {updateMutation.isPending ? t('saving') : t('save')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                                loading={isLoading}
                            >
                                {t('refresh')}
                            </Button>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => setIsEditMode(true)}
                            >
                                {t('edit')}
                            </Button>
                        </>
                    )}
                </Space>
            </HeaderRow>

            <div style={{ overflowY: 'auto', flex: 1 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        {allGroups.filter((_, i) => i % 2 === 0).map((group, i) =>
                            renderGroup(group, i * 2)
                        )}
                    </Col>
                    <Col xs={24} lg={12}>
                        {allGroups.filter((_, i) => i % 2 === 1).map((group, i) =>
                            renderGroup(group, i * 2 + 1)
                        )}
                    </Col>
                </Row>
            </div>
        </PageContainer>
    );
};

export default Configuration;
