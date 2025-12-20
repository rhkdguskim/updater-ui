import React, { useMemo, useState } from 'react';
import {
    Card,
    Tree,
    type TreeDataNode,
    Button,
    Space,
    Spin,
    Empty,
    Typography,
    Descriptions,
    Tag,
    message,
    Modal,
    Form,
    Input,
    Select,
    Radio,
    Row,
    Col,
} from 'antd';
const { Text } = Typography;
import {
    PlusOutlined,
    ReloadOutlined,
    ArrowRightOutlined,
    SearchOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import {
    useGetActions,
    useGetAction1,
} from '@/api/generated/actions/actions';
import {
    useGetRollouts,
    useGetRollout,
    getRolloutGroups,
    useStart,
    usePause,
    useResume,
    useApprove,
    useDeny,
} from '@/api/generated/rollouts/rollouts';
import {
    useCancelAction,
    useUpdateAction,
    usePostAssignedDistributionSet,
} from '@/api/generated/targets/targets';
import {
    useUpdateActionConfirmation,
} from '@/api/generated/targets/targets';
import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import type {
    MgmtDistributionSet,
    MgmtDistributionSetAssignment,
} from '@/api/generated/model';
import { KPICard, DelayedActionTable } from '../dashboard/components';
import JobStatusTimeline from './components/JobStatusTimeline';
import ActivityLogs from './components/ActivityLogs';
import { Tabs } from 'antd';

const LayoutWrapper = styled.div`
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
`;

const SidePanel = styled(Card)`
    width: 320px;
    flex-shrink: 0;
`;

const ContentPanel = styled(Card)`
    flex: 1;
    min-width: 320px;
    .ant-card-body {
        padding: 16px;
    }
`;

const KPIContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
`;

const SearchWrapper = styled.div`
    margin-bottom: 12px;
`;

type SelectedNode = {
    type: 'action' | 'rollout';
    id: number;
} | null;

const statusColorMap: Record<string, string> = {
    finished: 'green',
    running: 'blue',
    pending: 'orange',
    waiting: 'orange',
    waiting_for_approval: 'orange',
    error: 'red',
    canceled: 'default',
    pause: 'orange',
};

interface CreateActionModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const CreateActionModal: React.FC<CreateActionModalProps> = ({
    open,
    onClose,
    onCreated,
}) => {
    const { t } = useTranslation('jobs');
    const [form] = Form.useForm();
    const { data: dsData, isLoading: dsLoading } = useGetDistributionSets({
        limit: 200,
    });
    const mutation = usePostAssignedDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('createAction.success'));
                form.resetFields();
                onClose();
                onCreated();
            },
            onError: (err) => {
                message.error((err as Error).message || 'Failed to create action');
            },
        },
    });

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const assignment: MgmtDistributionSetAssignment = {
                id: values.distributionSetId,
                type: values.assignType,
            };
            mutation.mutate({
                targetId: values.controllerId,
                data: [assignment],
            });
        } catch {
            // ignore validation errors
        }
    };

    return (
        <Modal
            open={open}
            title={t('createAction.title')}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={mutation.isPending}
            okText={t('createAction.submit')}
            cancelText={t('createAction.cancel')}
        >
            <Form
                layout="vertical"
                form={form}
                initialValues={{ assignType: 'soft' }}
            >
                <Form.Item
                    label={t('createAction.controllerId')}
                    name="controllerId"
                    rules={[{ required: true }]}
                >
                    <Input placeholder={t('createAction.controllerPlaceholder')} />
                </Form.Item>
                <Form.Item
                    label={t('createAction.distributionSet')}
                    name="distributionSetId"
                    rules={[{ required: true }]}
                >
                    <Select
                        loading={dsLoading}
                        options={(dsData?.content || []).map((ds: MgmtDistributionSet) => ({
                            label: `${ds.name} (v${ds.version})`,
                            value: ds.id,
                        }))}
                        showSearch
                        optionFilterProp="label"
                    />
                </Form.Item>
                <Form.Item
                    label={t('createAction.assignType')}
                    name="assignType"
                >
                    <Radio.Group>
                        <Radio value="soft">Soft</Radio>
                        <Radio value="forced">Forced</Radio>
                        <Radio value="downloadonly">Download Only</Radio>
                    </Radio.Group>
                </Form.Item>
            </Form>
        </Modal>
    );
};

const JobManagement: React.FC = () => {
    const { t } = useTranslation('jobs');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [treeSearchTerm, setTreeSearchTerm] = useState('');
    const [activeDetailTab, setActiveDetailTab] = useState('overview');
    const [rolloutGroups, setRolloutGroups] = useState<Record<number, any[]>>({});

    const {
        data: actionsData,
        isLoading: actionsLoading,
        refetch: refetchActions,
    } = useGetActions({
        limit: 100,
    }, {
        query: { refetchInterval: 10000 } // Poll every 10s
    });

    const {
        data: rolloutsData,
        isLoading: rolloutsLoading,
        refetch: refetchRollouts,
    } = useGetRollouts({
        limit: 100,
    }, {
        query: { refetchInterval: 15000 } // Poll every 15s
    });

    const {
        data: actionDetail,
        isLoading: actionDetailLoading,
        refetch: refetchActionDetail,
    } = useGetAction1(selectedNode?.id || 0, {
        query: { enabled: selectedNode?.type === 'action' },
    });

    const {
        data: rolloutDetail,
        isLoading: rolloutDetailLoading,
        refetch: refetchRolloutDetail,
    } = useGetRollout(selectedNode?.id || 0, {
        query: { enabled: selectedNode?.type === 'rollout' },
    });

    const cancelMutation = useCancelAction({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.cancelSuccess'));
                queryClient.invalidateQueries();
                refetchActionDetail();
                refetchActions();
            },
            onError: (err) => {
                message.error((err as Error).message || 'Failed to cancel action');
            },
        },
    });

    const forceMutation = useUpdateAction({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.forceSuccess'));
                queryClient.invalidateQueries();
                refetchActionDetail();
                refetchActions();
            },
            onError: (err) => {
                message.error((err as Error).message || 'Failed to force action');
            },
        },
    });

    const confirmMutation = useUpdateActionConfirmation({
        mutation: {
            onSuccess: (_, variables) => {
                if (variables.data?.confirmation === 'confirmed') {
                    message.success(t('messages.confirmSuccess'));
                } else {
                    message.success(t('messages.denySuccess'));
                }
                queryClient.invalidateQueries();
                refetchActionDetail();
            },
            onError: (err) => {
                message.error((err as Error).message || 'Failed to update confirmation');
            },
        },
    });

    const rolloutMutationOptions = {
        onSuccess: () => {
            message.success(t('messages.rolloutActionSuccess'));
            queryClient.invalidateQueries();
            refetchRollouts();
            refetchRolloutDetail();
        },
        onError: () => {
            message.error(t('messages.rolloutActionError'));
        },
    };

    const startMutation = useStart({ mutation: rolloutMutationOptions });
    const pauseMutation = usePause({ mutation: rolloutMutationOptions });
    const resumeMutation = useResume({ mutation: rolloutMutationOptions });
    const approveMutation = useApprove({ mutation: rolloutMutationOptions });
    const denyMutation = useDeny({ mutation: rolloutMutationOptions });

    const fetchRolloutGroups = async (rolloutId: number) => {
        try {
            const data = await queryClient.fetchQuery({
                queryKey: [`/rest/v1/rollouts/${rolloutId}/deploygroups`],
                queryFn: () => getRolloutGroups(rolloutId),
            });
            setRolloutGroups(prev => ({ ...prev, [rolloutId]: data.content || [] }));
        } catch (error) {
            console.error('Failed to fetch rollout groups', error);
        }
    };

    const onLoadData = async ({ key, children }: any) => {
        if (children) return;
        if (key.startsWith('rollout-')) {
            const id = Number(key.replace('rollout-', ''));
            await fetchRolloutGroups(id);
        }
    };

    const handleConfirmAction = (confirmed: boolean) => {
        if (!selectedNode || !actionDetail) return;
        const targetId = extractTargetId(actionDetail._links?.target?.href);
        if (!targetId) return;

        confirmMutation.mutate({
            targetId,
            actionId: selectedNode.id,
            data: {
                confirmation: confirmed ? 'confirmed' : 'denied',
            }
        }, {
            onSuccess: () => {
                message.success(`Action ${confirmed ? 'confirmed' : 'denied'}`);
                refetchActions();
            },
            onError: () => message.error('Failed to update confirmation')
        });
    };

    const treeData = useMemo(() => {
        const sortedActions = [...(actionsData?.content || [])].sort(
            (a, b) => (b.lastModifiedAt || 0) - (a.lastModifiedAt || 0)
        );
        const sortedRollouts = [...(rolloutsData?.content || [])].sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );

        const filteredActions = sortedActions.filter(a =>
            a.id?.toString().includes(treeSearchTerm) ||
            a.status?.toLowerCase().includes(treeSearchTerm.toLowerCase())
        );

        const filteredRollouts = sortedRollouts.filter(r =>
            r.name.toLowerCase().includes(treeSearchTerm.toLowerCase()) ||
            r.status?.toLowerCase().includes(treeSearchTerm.toLowerCase())
        );

        const actionNodes: TreeDataNode[] = filteredActions.map((action) => ({
            key: `action-${action.id}`,
            title: (
                <Space size={6}>
                    <Tag color={statusColorMap[action.status || ''] || 'default'}>
                        {action.status?.toUpperCase() || 'UNKNOWN'}
                    </Tag>
                    <span>#{action.id}</span>
                </Space>
            ),
            isLeaf: true,
        }));

        const rolloutNodes: TreeDataNode[] = filteredRollouts.map((rollout) => ({
            key: `rollout-${rollout.id}`,
            title: (
                <Space size={6}>
                    <Tag color={statusColorMap[rollout.status || ''] || 'default'}>
                        {rollout.status?.toUpperCase()}
                    </Tag>
                    <span>{rollout.name}</span>
                </Space>
            ),
            isLeaf: false, // Allow expanding to see groups
            children: rolloutGroups[rollout.id!]?.map(group => ({
                key: `group-${rollout.id}-${group.id}`,
                title: (
                    <Space size={4}>
                        <Tag color="cyan">GROUP</Tag>
                        <span>{group.name}</span>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            ({group.successPercentage || 0}%)
                        </Text>
                    </Space>
                ),
                isLeaf: true,
            })),
        }));

        return [
            {
                key: 'actions-root',
                title: `${t('tree.actions')} (${filteredActions.length})`,
                selectable: false,
                children: actionNodes,
                defaultExpanded: true,
            },
            {
                key: 'rollouts-root',
                title: `${t('tree.rollouts')} (${filteredRollouts.length})`,
                selectable: false,
                children: rolloutNodes,
                defaultExpanded: true,
            },
        ];
    }, [actionsData, rolloutsData, t, treeSearchTerm, rolloutGroups]);

    const handleSelect = (keys: React.Key[]) => {
        const key = keys[0]?.toString();
        if (!key) {
            setSelectedNode(null);
            setActiveDetailTab('dashboard');
            return;
        }
        if (key.startsWith('action-')) {
            const id = Number(key.replace('action-', ''));
            setSelectedNode({ type: 'action', id });
            setActiveDetailTab('overview');
        } else if (key.startsWith('rollout-')) {
            const id = Number(key.replace('rollout-', ''));
            setSelectedNode({ type: 'rollout', id });
            setActiveDetailTab('overview');
        }
    };

    const selectedKeys = selectedNode ? [`${selectedNode.type}-${selectedNode.id}`] : [];

    const extractTargetId = (href?: string) => {
        if (!href) return '';
        const parts = href.split('/');
        return parts[parts.length - 1];
    };

    const renderActionDetail = () => {
        if (actionDetailLoading) {
            return <Spin />;
        }

        if (!actionDetail) {
            return <Empty description={t('detail.placeholder')} />;
        }

        const targetId = extractTargetId(actionDetail._links?.target?.href);
        const actionId = actionDetail.id;
        const isAdmin = role === 'Admin';

        const handleForce = () => {
            if (!targetId || !actionId) return;
            forceMutation.mutate({
                targetId,
                actionId,
                data: { forceType: 'forced' },
            });
        };

        const handleCancel = () => {
            if (!targetId || !actionId) return;
            cancelMutation.mutate({ targetId, actionId });
        };

        return (
            <>
                <Space style={{ marginBottom: 16 }}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        {t('detail.actionTitle', { id: actionId })}
                    </Typography.Title>
                    <Tag color={statusColorMap[actionDetail.status || ''] || 'default'}>
                        {actionDetail.status?.toUpperCase()}
                    </Tag>
                </Space>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label={t('detail.target')}>
                        {actionDetail._links?.target?.name || targetId || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('detail.distribution')}>
                        {actionDetail._links?.distributionset?.name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('detail.forceType')}>
                        {actionDetail.forceType || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('details.lastStatusCode')}>{actionDetail.lastStatusCode}</Descriptions.Item>
                </Descriptions>

                {actionDetail.status === 'waiting_for_confirmation' && (
                    <div style={{ marginTop: 24, padding: 16, backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t('detail.confirmWait')}</Text>
                            <Text type="secondary">{t('detail.confirmWaitDesc')}</Text>
                            <Space style={{ marginTop: 8 }}>
                                <Button type="primary" onClick={() => handleConfirmAction(true)}>{t('actions.confirm')}</Button>
                                <Button danger onClick={() => handleConfirmAction(false)}>{t('actions.deny')}</Button>
                            </Space>
                        </Space>
                    </div>
                )}
                <Descriptions.Item label={t('detail.createdAt')}>
                    {actionDetail.createdAt ? dayjs(actionDetail.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.lastModified')}>
                    {actionDetail.lastModifiedAt ? dayjs(actionDetail.lastModifiedAt).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Space style={{ marginTop: 16 }} wrap>
                    <Button icon={<ArrowRightOutlined />} onClick={() => navigate(`/actions/${actionId}`)}>
                        {t('actions.openDetail')}
                    </Button>
                    {isAdmin && (
                        <>
                            <Button type="default" onClick={handleForce} loading={forceMutation.isPending}>
                                {t('actions.force')}
                            </Button>
                            <Button danger onClick={handleCancel} loading={cancelMutation.isPending}>
                                {t('actions.cancel')}
                            </Button>
                        </>
                    )}
                </Space>
            </>
        );
    };

    const renderRolloutDetail = () => {
        if (rolloutDetailLoading) {
            return <Spin />;
        }
        if (!rolloutDetail) {
            return <Empty description={t('detail.placeholder')} />;
        }
        const rolloutId = rolloutDetail.id!;
        const status = rolloutDetail.status || '';
        const canStart = status === 'ready';
        const canPause = status === 'running';
        const canResume = status === 'paused';
        const canApprove = status === 'waiting_for_approval';
        const disableControls = role !== 'Admin';

        const handleRolloutAction = (action: 'start' | 'pause' | 'resume' | 'approve' | 'deny') => {
            const payload = { rolloutId };
            switch (action) {
                case 'start':
                    startMutation.mutate(payload);
                    break;
                case 'pause':
                    pauseMutation.mutate(payload);
                    break;
                case 'resume':
                    resumeMutation.mutate(payload);
                    break;
                case 'approve':
                    approveMutation.mutate(payload);
                    break;
                case 'deny':
                    denyMutation.mutate(payload);
                    break;
            }
        };

        return (
            <>
                <Space style={{ marginBottom: 16 }}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        {t('detail.rolloutTitle', { id: rolloutId })}
                    </Typography.Title>
                    <Tag color={statusColorMap[status] || 'default'}>{status.toUpperCase()}</Tag>
                </Space>
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label={t('detail.description')}>
                        {rolloutDetail.description || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('detail.targetFilter')}>
                        {rolloutDetail.targetFilterQuery}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('detail.totalTargets')}>
                        {rolloutDetail.totalTargets ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('detail.createdAt')}>
                        {rolloutDetail.createdAt ? dayjs(rolloutDetail.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                </Descriptions>
                <Space style={{ marginTop: 16 }} wrap>
                    <Button icon={<ArrowRightOutlined />} onClick={() => navigate(`/rollouts/${rolloutId}`)}>
                        {t('actions.openDetail')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => handleRolloutAction('start')}
                        disabled={!canStart || disableControls}
                        loading={startMutation.isPending}
                    >
                        {t('rollouts.start')}
                    </Button>
                    <Button
                        onClick={() => handleRolloutAction('pause')}
                        disabled={!canPause || disableControls}
                        loading={pauseMutation.isPending}
                    >
                        {t('rollouts.pause')}
                    </Button>
                    <Button
                        onClick={() => handleRolloutAction('resume')}
                        disabled={!canResume || disableControls}
                        loading={resumeMutation.isPending}
                    >
                        {t('rollouts.resume')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => handleRolloutAction('approve')}
                        disabled={!canApprove || disableControls}
                        loading={approveMutation.isPending}
                    >
                        {t('rollouts.approve')}
                    </Button>
                    <Button
                        danger
                        onClick={() => handleRolloutAction('deny')}
                        disabled={!canApprove || disableControls}
                        loading={denyMutation.isPending}
                    >
                        {t('rollouts.deny')}
                    </Button>
                </Space>
            </>
        );
    };

    const renderDetail = () => {
        if (!selectedNode) {
            return <Empty description={t('detail.placeholder')} />;
        }
        if (selectedNode.type === 'action') {
            return renderActionDetail();
        }
        return renderRolloutDetail();
    };

    return (
        <>
            <Typography.Title level={3} style={{ marginBottom: 16 }}>
                {t('title')}
            </Typography.Title>

            <KPIContainer>
                <KPICard
                    title={t('dashboard.openActions')}
                    value={(actionsData?.content || []).filter(a => a.status === 'running' || a.status === 'pending').length}
                    icon={<SyncOutlined />}
                    color="#1890ff"
                />
                <KPICard
                    title={t('dashboard.runningRollouts')}
                    value={(rolloutsData?.content || []).filter(r => r.status === 'running').length}
                    icon={<SyncOutlined spin />}
                    color="#52c41a"
                />
                <KPICard
                    title={t('dashboard.waitingApproval')}
                    value={(rolloutsData?.content || []).filter(r => r.status === 'waiting_for_approval').length}
                    icon={<ClockCircleOutlined />}
                    color="#faad14"
                />
                <KPICard
                    title={t('dashboard.failedJobs')}
                    value={(actionsData?.content || []).filter(a => a.status === 'error').length}
                    icon={<ExclamationCircleOutlined />}
                    color="#ff4d4f"
                />
            </KPIContainer>

            <LayoutWrapper>
                <SidePanel
                    title={t('tree.actions')}
                    extra={
                        <Space>
                            <Button icon={<ReloadOutlined />} size="small" onClick={() => { refetchActions(); refetchRollouts(); }}>
                                {t('tree.refresh')}
                            </Button>
                        </Space>
                    }
                >
                    <SearchWrapper>
                        <Input
                            placeholder={t('tree.search')}
                            prefix={<SearchOutlined />}
                            onChange={(e) => setTreeSearchTerm(e.target.value)}
                            allowClear
                        />
                    </SearchWrapper>
                    <Tree
                        treeData={treeData}
                        selectable
                        selectedKeys={selectedKeys}
                        onSelect={handleSelect}
                        loadData={onLoadData}
                        showLine
                        switcherIcon={null}
                        height={480}
                        defaultExpandAll
                    />
                    <Space style={{ marginTop: 16, width: '100%' }} direction="vertical">
                        <Button type="primary" icon={<PlusOutlined />} block onClick={() => setCreateModalOpen(true)}>
                            {t('tree.createAction')}
                        </Button>
                        <Button block onClick={() => navigate('/rollouts/create')}>
                            {t('tree.createRollout')}
                        </Button>
                    </Space>
                </SidePanel>

                <ContentPanel>
                    {actionsLoading || rolloutsLoading ? <Spin /> : (
                        <Tabs
                            activeKey={activeDetailTab}
                            onChange={setActiveDetailTab}
                            items={[
                                {
                                    key: 'dashboard',
                                    label: t('dashboard.title'),
                                    children: (
                                        <div style={{ marginTop: 16 }}>
                                            <Row gutter={[16, 16]}>
                                                <Col span={24}>
                                                    <DelayedActionTable />
                                                </Col>
                                                <Col span={24}>
                                                    <ActivityLogs />
                                                </Col>
                                            </Row>
                                        </div>
                                    )
                                },
                                {
                                    key: 'overview',
                                    label: t('tabs.overview'),
                                    children: renderDetail(),
                                    disabled: !selectedNode
                                },
                                {
                                    key: 'timeline',
                                    label: t('tabs.timeline'),
                                    children: selectedNode?.type === 'action' ? (
                                        <JobStatusTimeline
                                            targetId={extractTargetId(actionDetail?._links?.target?.href)}
                                            actionId={selectedNode.id}
                                        />
                                    ) : (
                                        <Empty description={t('detail.timelineOnlyAction')} />
                                    ),
                                    disabled: !selectedNode
                                },
                                {
                                    key: 'logs',
                                    label: t('tabs.logs'),
                                    children: <ActivityLogs />,
                                    disabled: !selectedNode
                                }
                            ]}
                        />
                    )}
                </ContentPanel>
            </LayoutWrapper>

            <CreateActionModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreated={() => {
                    refetchActions();
                }}
            />
        </>
    );
};

export default JobManagement;
