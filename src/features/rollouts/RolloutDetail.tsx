import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Descriptions,
    Tag,
    Button,
    Space,
    Typography,
    Table,
    Progress,
    Spin,
    Alert,
    Popconfirm,
    message,
} from 'antd';
import {
    ArrowLeftOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    CaretRightOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import {
    useGetRollout,
    useGetRolloutGroups,
    useStart,
    usePause,
    useResume,
    useApprove,
    useDeny,
} from '@/api/generated/rollouts/rollouts';
import type { MgmtRolloutGroup } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'finished':
            return 'success';
        case 'running':
            return 'processing';
        case 'paused':
            return 'warning';
        case 'ready':
            return 'cyan';
        case 'creating':
            return 'default';
        case 'starting':
            return 'blue';
        case 'error':
            return 'error';
        case 'waiting_for_approval':
            return 'purple';
        case 'scheduled':
            return 'default';
        default:
            return 'default';
    }
};

const RolloutDetail: React.FC = () => {
    const { t } = useTranslation('rollouts');
    const { rolloutId } = useParams<{ rolloutId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    const rolloutIdNum = parseInt(rolloutId || '0', 10);

    // Fetch rollout details
    const { data: rolloutData, isLoading, error } = useGetRollout(rolloutIdNum, {
        query: { enabled: !!rolloutIdNum },
    });

    // Fetch deploy groups
    const { data: groupsData, isLoading: groupsLoading } = useGetRolloutGroups(
        rolloutIdNum,
        { limit: 100 },
        { query: { enabled: !!rolloutIdNum } }
    );

    // Mutations
    const startMutation = useStart({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.startSuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.startError'));
            },
        },
    });

    const pauseMutation = usePause({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.pauseSuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.pauseError'));
            },
        },
    });

    const resumeMutation = useResume({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.resumeSuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.resumeError'));
            },
        },
    });

    const approveMutation = useApprove({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.approveSuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.approveError'));
            },
        },
    });

    const denyMutation = useDeny({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.denySuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.denyError'));
            },
        },
    });

    // Handlers
    const handleStart = () => {
        if (rolloutIdNum) {
            startMutation.mutate({ rolloutId: rolloutIdNum });
        }
    };

    const handlePause = () => {
        if (rolloutIdNum) {
            pauseMutation.mutate({ rolloutId: rolloutIdNum });
        }
    };

    const handleResume = () => {
        if (rolloutIdNum) {
            resumeMutation.mutate({ rolloutId: rolloutIdNum });
        }
    };

    const handleApprove = () => {
        if (rolloutIdNum) {
            approveMutation.mutate({ rolloutId: rolloutIdNum });
        }
    };

    const handleDeny = () => {
        if (rolloutIdNum) {
            denyMutation.mutate({ rolloutId: rolloutIdNum });
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error || !rolloutData) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    type="error"
                    message={t('detail.notFound')}
                    description={t('detail.notFoundDesc')}
                    action={
                        <Button onClick={() => navigate('/rollouts')}>
                            {t('detail.backToRollouts')}
                        </Button>
                    }
                />
            </div>
        );
    }

    const canStart = rolloutData.status === 'ready';
    const canPause = rolloutData.status === 'running';
    const canResume = rolloutData.status === 'paused';
    const canApprove = rolloutData.status === 'waiting_for_approval';

    // Calculate overall progress
    const totalTargets = rolloutData.totalTargets || 0;
    const statusPerTarget = rolloutData.totalTargetsPerStatus as Record<string, number> || {};
    const finishedTargets = statusPerTarget.finished || 0;
    const overallProgress = totalTargets > 0 ? Math.round((finishedTargets / totalTargets) * 100) : 0;

    const groupColumns: TableProps<MgmtRolloutGroup>['columns'] = [
        {
            title: t('columns.id'),
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: t('columns.name'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('columns.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: t('columns.totalTargets'),
            key: 'totalTargets',
            width: 120,
            render: (_, record) => (record as unknown as { totalTargets?: number }).totalTargets || 0,
        },
        {
            title: t('columns.progress'),
            key: 'progress',
            width: 200,
            render: (_, record) => {
                const rec = record as unknown as { totalTargets?: number; totalTargetsPerStatus?: Record<string, number> };
                const total = rec.totalTargets || 0;
                const finished = rec.totalTargetsPerStatus?.finished || 0;
                const percent = total > 0 ? Math.round((finished / total) * 100) : 0;
                return <Progress percent={percent} size="small" />;
            },
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <Space>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/rollouts')}
                    >
                        {t('detail.back')}
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        {rolloutData.name}
                    </Title>
                    <Tag color={getStatusColor(rolloutData.status)} style={{ fontSize: 14 }}>
                        {rolloutData.status?.toUpperCase().replace(/_/g, ' ')}
                    </Tag>
                </Space>

                {/* Rollout Controls (Admin Only) */}
                {isAdmin && (
                    <Card title={t('detail.controlsTitle')} size="small">
                        <Space>
                            {canStart && (
                                <Popconfirm
                                    title={t('detail.controls.startConfirm')}
                                    onConfirm={handleStart}
                                >
                                    <Button
                                        type="primary"
                                        icon={<PlayCircleOutlined />}
                                        loading={startMutation.isPending}
                                    >
                                        {t('detail.controls.start')}
                                    </Button>
                                </Popconfirm>
                            )}
                            {canPause && (
                                <Popconfirm
                                    title={t('detail.controls.pauseConfirm')}
                                    onConfirm={handlePause}
                                >
                                    <Button
                                        icon={<PauseCircleOutlined />}
                                        loading={pauseMutation.isPending}
                                    >
                                        {t('detail.controls.pause')}
                                    </Button>
                                </Popconfirm>
                            )}
                            {canResume && (
                                <Button
                                    icon={<CaretRightOutlined />}
                                    onClick={handleResume}
                                    loading={resumeMutation.isPending}
                                >
                                    {t('detail.controls.resume')}
                                </Button>
                            )}
                            {canApprove && (
                                <>
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        onClick={handleApprove}
                                        loading={approveMutation.isPending}
                                    >
                                        {t('detail.controls.approve')}
                                    </Button>
                                    <Button
                                        danger
                                        icon={<CloseCircleOutlined />}
                                        onClick={handleDeny}
                                        loading={denyMutation.isPending}
                                    >
                                        {t('detail.controls.deny')}
                                    </Button>
                                </>
                            )}
                            {!canStart && !canPause && !canResume && !canApprove && (
                                <Text type="secondary">{t('detail.noActions')}</Text>
                            )}
                        </Space>
                    </Card>
                )}

                {/* Overview */}
                <Card title={t('detail.overviewTitle')}>
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label={t('detail.labels.id')}>{rolloutData.id}</Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.name')}>{rolloutData.name}</Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.status')}>
                            <Tag color={getStatusColor(rolloutData.status)}>
                                {rolloutData.status?.toUpperCase().replace(/_/g, ' ')}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.totalTargets')}>
                            {rolloutData.totalTargets}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.overallProgress')} span={2}>
                            <Progress percent={overallProgress} />
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.createdAt')}>
                            {rolloutData.createdAt
                                ? format(rolloutData.createdAt, 'yyyy-MM-dd HH:mm:ss')
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('detail.labels.lastModified')}>
                            {rolloutData.lastModifiedAt
                                ? format(rolloutData.lastModifiedAt, 'yyyy-MM-dd HH:mm:ss')
                                : '-'}
                        </Descriptions.Item>
                        {rolloutData.description && (
                            <Descriptions.Item label={t('detail.labels.description')} span={2}>
                                {rolloutData.description}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Card>

                {/* Deploy Groups */}
                <Card title={t('detail.deployGroupsTitle')} loading={groupsLoading}>
                    <Table
                        dataSource={groupsData?.content || []}
                        columns={groupColumns}
                        rowKey="id"
                        pagination={false}
                    />
                </Card>
            </Space>
        </div>
    );
};

export default RolloutDetail;
