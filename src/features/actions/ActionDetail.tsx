import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Descriptions,
    Tag,
    Button,
    Space,
    Typography,
    Timeline,
    Spin,
    Alert,
    Popconfirm,
    message,
} from 'antd';
import {
    ArrowLeftOutlined,
    StopOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useGetAction1 } from '@/api/generated/actions/actions';
import {
    useGetActionStatusList,
    useCancelAction,
    useUpdateAction,
    useUpdateActionConfirmation,
} from '@/api/generated/targets/targets';
import type { MgmtActionStatus } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'finished':
            return 'success';
        case 'error':
            return 'error';
        case 'running':
            return 'processing';
        case 'pending':
            return 'default';
        case 'canceled':
            return 'warning';
        case 'canceling':
            return 'warning';
        case 'wait_for_confirmation':
            return 'purple';
        default:
            return 'default';
    }
};

const ActionDetail: React.FC = () => {
    const { t } = useTranslation('actions');
    const { actionId } = useParams<{ actionId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    const actionIdNum = parseInt(actionId || '0', 10);

    // Fetch action details
    // Auto-refresh for running actions
    const isRunning = (status?: string) => ['running', 'pending', 'canceling'].includes(status || '');

    const { data: actionData, isLoading, error } = useGetAction1(actionIdNum, {
        query: {
            enabled: !!actionIdNum,
            refetchInterval: (query) => {
                const data = query.state.data;
                return isRunning(data?.status) ? 5000 : false;
            },
        },
    });

    // Fetch action status history
    // Note: This requires targetId which we may need to extract from actionData
    const targetId = actionData?._links?.target?.href?.split('/').pop() || '';
    const targetName = actionData?._links?.target?.name || targetId;
    const dsId = actionData?._links?.distributionset?.href?.split('/').pop() || '';
    const dsName = actionData?._links?.distributionset?.name || '';

    const { data: statusData, isLoading: statusLoading } = useGetActionStatusList(
        targetId,
        actionIdNum,
        { limit: 100 },
        {
            query: {
                enabled: !!targetId && !!actionIdNum,
                refetchInterval: isRunning(actionData?.status) ? 5000 : false,
            },
        }
    );

    // Mutations
    const cancelMutation = useCancelAction({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.cancelSuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.cancelError'));
            },
        },
    });

    const updateMutation = useUpdateAction({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.forceSuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.forceError'));
            },
        },
    });

    const confirmMutation = useUpdateActionConfirmation({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.confirmSuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.confirmError'));
            },
        },
    });

    const handleCancel = () => {
        if (targetId && actionIdNum) {
            cancelMutation.mutate({ targetId, actionId: actionIdNum });
        }
    };

    const handleForce = () => {
        if (targetId && actionIdNum) {
            updateMutation.mutate({
                targetId,
                actionId: actionIdNum,
                data: { forceType: 'forced' },
            });
        }
    };

    const handleConfirm = () => {
        if (targetId && actionIdNum) {
            confirmMutation.mutate({
                targetId,
                actionId: actionIdNum,
                data: { confirmation: 'confirmed' },
            });
        }
    };

    const handleDeny = () => {
        if (targetId && actionIdNum) {
            confirmMutation.mutate({
                targetId,
                actionId: actionIdNum,
                data: { confirmation: 'denied' },
            });
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error || !actionData) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    type="error"
                    message={t('detail.notFound')}
                    description={t('detail.notFoundDesc')}
                    action={
                        <Button onClick={() => navigate('/actions')}>
                            {t('detail.backToActions')}
                        </Button>
                    }
                />
            </div>
        );
    }

    const canCancel = ['pending', 'running'].includes(actionData.status || '');
    const canForce = actionData.status === 'running' && actionData.forceType !== 'forced';
    const canConfirm = actionData.status === 'wait_for_confirmation';

    // Find latest error message from status history
    const latestError = statusData?.content?.find((s: MgmtActionStatus) => s.type === 'error');
    const errorMessages = latestError?.messages || [];

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <Space>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/actions')}
                    >
                        {t('detail.back')}
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        {t('detail.pageTitle')} #{actionData.id}
                    </Title>
                    <Tag color={getStatusColor(actionData.status)} style={{ fontSize: 14 }}>
                        {actionData.status?.toUpperCase()}
                    </Tag>
                    {isRunning(actionData.status) && (
                        <Tag color="blue">LIVE</Tag>
                    )}
                </Space>

                {/* Action Controls (Admin Only) */}
                {isAdmin && (
                    <Card title={t('detail.controlsTitle')} size="small">
                        <Space>
                            {canForce && (
                                <Popconfirm
                                    title={t('detail.controls.forceConfirm')}
                                    description={t('detail.controls.forceDesc')}
                                    onConfirm={handleForce}
                                >
                                    <Button
                                        icon={<ThunderboltOutlined />}
                                        loading={updateMutation.isPending}
                                    >
                                        {t('detail.controls.force')}
                                    </Button>
                                </Popconfirm>
                            )}
                            {canCancel && (
                                <Popconfirm
                                    title={t('detail.controls.cancelConfirm')}
                                    description={t('detail.controls.cancelDesc')}
                                    onConfirm={handleCancel}
                                >
                                    <Button
                                        danger
                                        icon={<StopOutlined />}
                                        loading={cancelMutation.isPending}
                                    >
                                        {t('detail.controls.cancel')}
                                    </Button>
                                </Popconfirm>
                            )}
                            {canConfirm && (
                                <>
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        onClick={handleConfirm}
                                        loading={confirmMutation.isPending}
                                    >
                                        {t('detail.controls.confirm')}
                                    </Button>
                                    <Button
                                        danger
                                        icon={<CloseCircleOutlined />}
                                        onClick={handleDeny}
                                        loading={confirmMutation.isPending}
                                    >
                                        {t('detail.controls.deny')}
                                    </Button>
                                </>
                            )}
                            {!canForce && !canCancel && !canConfirm && (
                                <Text type="secondary">{t('detail.noActions')}</Text>
                            )}
                        </Space>
                    </Card>
                )}

                {/* Error Banner */}
                {actionData.status === 'error' && errorMessages.length > 0 && (
                    <Alert
                        type="error"
                        message={t('detail.errorBannerTitle')}
                        description={
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {errorMessages.map((msg: string, idx: number) => (
                                    <li key={idx}>{msg}</li>
                                ))}
                            </ul>
                        }
                        showIcon
                    />
                )}

                {/* Overview */}
                <Card title={t('detail.overviewTitle')}>
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label={t('detail.labels.id')}>{actionData.id}</Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.status')}>
                            <Tag color={getStatusColor(actionData.status)}>
                                {actionData.status?.toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.type')}>
                            <Tag color={actionData.type === 'forced' ? 'red' : 'blue'}>
                                {actionData.type?.toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.forceType')}>
                            {actionData.forceType || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.createdAt')}>
                            {actionData.createdAt
                                ? format(actionData.createdAt, 'yyyy-MM-dd HH:mm:ss')
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.lastModified')}>
                            {actionData.lastModifiedAt
                                ? format(actionData.lastModifiedAt, 'yyyy-MM-dd HH:mm:ss')
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.target')}>
                            {targetId ? (
                                <Link to={`/targets/${targetId}`}>{targetName}</Link>
                            ) : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.distributionSet')}>
                            {dsId ? (
                                <Link to={`/distributions/sets/${dsId}`}>{dsName}</Link>
                            ) : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* Status History Timeline */}
                <Card title={t('detail.statusHistoryTitle')} loading={statusLoading}>
                    {statusData?.content && statusData.content.length > 0 ? (
                        <Timeline
                            mode="left"
                            items={statusData.content.map((status: MgmtActionStatus) => ({
                                color: getStatusColor(status.type),
                                label: status.reportedAt
                                    ? format(status.reportedAt, 'yyyy-MM-dd HH:mm:ss')
                                    : '',
                                children: (
                                    <div>
                                        <Tag color={getStatusColor(status.type)}>
                                            {status.type?.toUpperCase()}
                                        </Tag>
                                        {status.messages && status.messages.length > 0 && (
                                            <div style={{ marginTop: 8 }}>
                                                {status.messages.map((msg: string, idx: number) => (
                                                    <Text key={idx} type="secondary" style={{ display: 'block' }}>
                                                        {msg}
                                                    </Text>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ),
                            }))}
                        />
                    ) : (
                        <Text type="secondary">{t('detail.noStatusHistory')}</Text>
                    )}
                </Card>
            </Space>
        </div>
    );
};

export default ActionDetail;

