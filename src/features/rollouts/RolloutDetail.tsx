import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Descriptions,
    Button,
    Space,
    Typography,
    Table,
    Progress,
    Spin,
    Alert,
    Popconfirm,
    message,
    Row,
    Col,
    Statistic,
    Breadcrumb,
} from 'antd';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    CaretRightOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import {
    useGetRollout,
    useGetRolloutGroups,
    useStart,
    usePause,
    useResume,
    useApprove,
    useDeny,
    useRetryRollout,
    useDelete,
} from '@/api/generated/rollouts/rollouts';
import type { MgmtRolloutGroup } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageContainer, SectionCard } from '@/components/layout/PageLayout';
import { DetailPageHeader, StatusTag } from '@/components/common';

const { Text } = Typography;

const RolloutDetail: React.FC = () => {
    const { t } = useTranslation(['rollouts', 'common']);
    const { rolloutId } = useParams<{ rolloutId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    const rolloutIdNum = parseInt(rolloutId || '0', 10);

    // Fetch rollout details with real-time polling
    const { data: rolloutData, isLoading, error } = useGetRollout(rolloutIdNum, {
        query: {
            enabled: !!rolloutIdNum,
            refetchInterval: (query) => {
                const status = query.state.data?.status?.toLowerCase();
                // Poll every 2 seconds when status is dynamic (creating, starting, running)
                if (['creating', 'starting', 'running', 'paused', 'waiting_for_approval'].includes(status || '')) {
                    return 2000;
                }
                // Poll less frequently for stable states
                return 10000;
            },
            staleTime: 0,
        },
    });

    // Fetch deploy groups with polling for real-time action tracking
    const { data: groupsData, isLoading: groupsLoading } = useGetRolloutGroups(
        rolloutIdNum,
        { limit: 100 },
        {
            query: {
                enabled: !!rolloutIdNum,
                refetchInterval: rolloutData?.status === 'running' ? 2000 : 10000,
                staleTime: 0,
            }
        }
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

    // Retry mutation
    const retryMutation = useRetryRollout({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.retrySuccess'));
                queryClient.invalidateQueries();
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.retryError'));
            },
        },
    });

    // Delete mutation
    const deleteMutation = useDelete({
        mutation: {
            onSuccess: () => {
                message.success(t('detail.messages.deleteSuccess'));
                navigate('/rollouts');
            },
            onError: (err) => {
                message.error((err as Error).message || t('detail.messages.deleteError'));
            },
        },
    });

    const handleRetry = () => {
        if (rolloutIdNum) {
            retryMutation.mutate({ rolloutId: rolloutIdNum });
        }
    };

    const handleDelete = () => {
        if (rolloutIdNum) {
            deleteMutation.mutate({ rolloutId: rolloutIdNum });
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
            <PageContainer>
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
            </PageContainer>
        );
    }

    const canStart = rolloutData.status === 'ready';
    const canPause = rolloutData.status === 'running';
    const canResume = rolloutData.status === 'paused';
    const canApprove = rolloutData.status === 'waiting_for_approval';
    const canRetry = rolloutData.status === 'error';
    const canDelete = ['ready', 'finished', 'error'].includes(rolloutData.status || '');

    // Calculate overall progress
    const totalTargets = rolloutData.totalTargets || 0;
    const statusPerTarget = rolloutData.totalTargetsPerStatus as Record<string, number> || {};
    const finishedTargets = statusPerTarget.finished || 0;
    const errorTargets = statusPerTarget.error || 0;
    // If rollout is finished, always show 100%
    let overallProgress = rolloutData.status === 'finished'
        ? 100
        : (totalTargets > 0 ? Math.round((finishedTargets / totalTargets) * 100) : 0);

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
                <StatusTag status={status} />
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
                const rec = record as unknown as {
                    totalTargets?: number;
                    totalTargetsPerStatus?: Record<string, number>;
                    status?: string;
                };
                const total = rec.totalTargets || 0;
                const finished = rec.totalTargetsPerStatus?.finished || 0;
                let percent = total > 0 ? Math.round((finished / total) * 100) : 0;

                if (rec.status === 'finished') {
                    percent = 100;
                }
                return <Progress percent={percent} size="small" />;
            },
        },
    ];

    const headerActions = (
        <Space wrap>
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
            {canRetry && (
                <Popconfirm
                    title={t('detail.controls.retryConfirm')}
                    onConfirm={handleRetry}
                >
                    <Button
                        icon={<ReloadOutlined />}
                        loading={retryMutation.isPending}
                    >
                        {t('detail.controls.retry')}
                    </Button>
                </Popconfirm>
            )}
            {canDelete && (
                <Popconfirm
                    title={t('detail.controls.deleteConfirm')}
                    description={t('detail.controls.deleteDesc')}
                    onConfirm={handleDelete}
                >
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={deleteMutation.isPending}
                    >
                        {t('detail.controls.delete')}
                    </Button>
                </Popconfirm>
            )}
        </Space>
    );

    return (
        <PageContainer>
            {/* Breadcrumb */}
            <Breadcrumb
                items={[
                    { title: <Link to="/rollouts">{t('list.title')}</Link> },
                    { title: rolloutData.name },
                ]}
            />

            {/* Header */}
            <DetailPageHeader
                title={rolloutData.name}
                description={t('detail.description')}
                status={rolloutData.status}
                backLabel={t('detail.back')}
                onBack={() => navigate('/rollouts')}
                actions={headerActions}
            />

            {isAdmin && !canStart && !canPause && !canResume && !canApprove && !canRetry && !canDelete && (
                <SectionCard>
                    <Text type="secondary">{t('detail.noActions')}</Text>
                </SectionCard>
            )}

            <SectionCard title={t('detail.overviewTitle')}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Statistic title={t('detail.labels.totalTargets')} value={totalTargets} />
                    </Col>
                    <Col xs={24} md={8}>
                        <Statistic title={t('detail.labels.finishedTargets')} value={finishedTargets} />
                    </Col>
                    <Col xs={24} md={8}>
                        <Statistic title={t('detail.labels.errorTargets')} value={errorTargets} />
                    </Col>
                </Row>

                <div style={{ marginTop: 16 }}>
                    <Text type="secondary">{t('detail.labels.overallProgress')}</Text>
                    <Progress percent={overallProgress} style={{ marginTop: 8 }} />
                </div>

                <Descriptions bordered column={2} style={{ marginTop: 16 }}>
                    <Descriptions.Item label={t('detail.labels.id')}>{rolloutData.id}</Descriptions.Item>
                    <Descriptions.Item label={t('detail.labels.name')}>{rolloutData.name}</Descriptions.Item>
                    <Descriptions.Item label={t('detail.labels.status')}>
                        <StatusTag status={rolloutData.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label={t('detail.labels.createdAt')}>
                        {rolloutData.createdAt
                            ? dayjs(rolloutData.createdAt).format('YYYY-MM-DD HH:mm:ss')
                            : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('detail.labels.lastModified')}>
                        {rolloutData.lastModifiedAt
                            ? dayjs(rolloutData.lastModifiedAt).format('YYYY-MM-DD HH:mm:ss')
                            : '-'}
                    </Descriptions.Item>
                    {rolloutData.description && (
                        <Descriptions.Item label={t('detail.labels.description')} span={2}>
                            {rolloutData.description}
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </SectionCard>

            <SectionCard title={t('detail.deployGroupsTitle')} loading={groupsLoading}>
                <Table
                    dataSource={groupsData?.content || []}
                    columns={groupColumns}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: t('detail.emptyGroups') }}
                />
            </SectionCard>
        </PageContainer>
    );
};

export default RolloutDetail;
