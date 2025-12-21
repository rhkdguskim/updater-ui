import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
    Radio,
    Row,
    Col,
    Select,
    Tooltip,
    Popconfirm,
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
    FilterOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
    useUpdateActionConfirmation,
    useGetTargets,
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

const FilterBar = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
`;

const SegmentWrapper = styled.div`
    margin-bottom: 12px;
    border: 1px dashed #d9d9d9;
    padding: 8px;
    border-radius: 8px;
`;

const ContextBanner = styled.div`
    border: 1px solid #e0e6f1;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    background: #f8fbff;
`;

type SelectedNode = {
    type: 'action' | 'rollout';
    id: number;
} | {
    type: 'segment';
    id: string;
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

interface JobSegment {
    id: string;
    name: string;
    description?: string;
    scope: 'actions' | 'rollouts' | 'all';
    statusFilters?: string[];
    timeWindow?: '24h' | '7d' | '30d' | 'all';
    query?: string;
}

const SEGMENT_STORAGE_KEY = 'job-management-segments-v1';

const getStatusLabel = (status: string | undefined, t: TFunction<'jobs'>) => {
    if (!status) return t('status.unknown', { defaultValue: 'UNKNOWN' });
    const key = status.toLowerCase();
    const translated = t(`status.${key}`, { defaultValue: '' });
    return translated || status.toUpperCase();
};

const STATUS_OPTIONS = [
    'pending',
    'scheduled',
    'retrieving',
    'running',
    'waiting_for_confirmation',
    'waiting_for_approval',
    'paused',
    'finished',
    'error',
    'canceled',
];

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
    const { data: targetsData, isLoading: targetsLoading } = useGetTargets({
        limit: 200,
    });
    const mutation = usePostAssignedDistributionSet({
        mutation: {
            onError: (err) => {
                message.error((err as Error).message || 'Failed to create action');
            },
        },
    });

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const targetIds: string[] = values.targets || [];
            if (!targetIds.length) {
                message.warning(t('createAction.targetsRequired'));
                return;
            }
            const assignment: MgmtDistributionSetAssignment = {
                id: values.distributionSetId,
                type: values.assignType,
            };
            await Promise.all(
                targetIds.map((targetId) =>
                    mutation.mutateAsync({
                        targetId,
                        data: [assignment],
                    })
                )
            );
            message.success(t('createAction.successMulti', { count: targetIds.length }));
            form.resetFields();
            onClose();
            onCreated();
        } catch (error) {
            if ((error as { errorFields?: unknown }).errorFields) {
                return;
            }
            if (error instanceof Error) {
                message.error(error.message);
            }
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
                initialValues={{ assignType: 'soft', targets: [] }}
            >
                <Form.Item
                    label={t('createAction.targets')}
                    name="targets"
                    rules={[{ required: true, message: t('createAction.targetsRequired') }]}
                >
                    <Select
                        mode="multiple"
                        loading={targetsLoading}
                        showSearch
                        optionFilterProp="label"
                        placeholder={t('createAction.targetsPlaceholder')}
                        options={(targetsData?.content || []).map((target) => ({
                            label: `${target.name || target.controllerId} (${target.controllerId})`,
                            value: target.controllerId,
                        }))}
                    />
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

interface CreateSegmentModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (segment: JobSegment) => void;
}

const CreateSegmentModal: React.FC<CreateSegmentModalProps> = ({ open, onClose, onSave }) => {
    const { t } = useTranslation('jobs');
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const segment: JobSegment = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: values.name,
                description: values.description,
                scope: values.scope,
                statusFilters: values.statusFilters,
                timeWindow: values.timeWindow,
                query: values.query,
            };
            onSave(segment);
            form.resetFields();
            onClose();
        } catch {
            // ignore
        }
    };

    return (
        <Modal
            title={t('segments.modal.title')}
            open={open}
            onOk={handleSubmit}
            onCancel={onClose}
            okText={t('segments.modal.save')}
            cancelText={t('segments.modal.cancel')}
        >
            <Form layout="vertical" form={form} initialValues={{ scope: 'all', timeWindow: '24h' }}>
                <Form.Item
                    label={t('segments.modal.name')}
                    name="name"
                    rules={[{ required: true, message: t('segments.modal.nameRequired') }]}
                >
                    <Input placeholder={t('segments.modal.namePlaceholder')} />
                </Form.Item>
                <Form.Item label={t('segments.modal.description')} name="description">
                    <Input.TextArea placeholder={t('segments.modal.descriptionPlaceholder')} rows={2} />
                </Form.Item>
                <Form.Item
                    label={t('segments.modal.scope')}
                    name="scope"
                    rules={[{ required: true }]}
                >
                    <Select
                        options={[
                            { label: t('segments.modal.scopeAll'), value: 'all' },
                            { label: t('segments.modal.scopeActions'), value: 'actions' },
                            { label: t('segments.modal.scopeRollouts'), value: 'rollouts' },
                        ]}
                    />
                </Form.Item>
                <Form.Item label={t('segments.modal.statusFilters')} name="statusFilters">
                    <Select
                        mode="multiple"
                        allowClear
                        options={STATUS_OPTIONS.map((status) => ({
                            label: status.toUpperCase(),
                            value: status,
                        }))}
                        placeholder={t('segments.modal.statusPlaceholder')}
                    />
                </Form.Item>
                <Form.Item label={t('segments.modal.timeWindow')} name="timeWindow">
                    <Select
                        options={[
                            { label: t('filters.timeOptions.24h'), value: '24h' },
                            { label: t('filters.timeOptions.7d'), value: '7d' },
                            { label: t('filters.timeOptions.30d'), value: '30d' },
                            { label: t('filters.timeOptions.all'), value: 'all' },
                        ]}
                    />
                </Form.Item>
                <Form.Item label={t('segments.modal.query')} name="query">
                    <Input placeholder={t('segments.modal.queryPlaceholder')} />
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
    const [segmentModalOpen, setSegmentModalOpen] = useState(false);
    const [treeSearchTerm, setTreeSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
    const [activeDetailTab, setActiveDetailTab] = useState('overview');
    const [rolloutGroups, setRolloutGroups] = useState<Record<number, any[]>>({});
    const [segments, setSegments] = useState<JobSegment[]>([]);
    const activeSegment = selectedNode?.type === 'segment'
        ? segments.find((segment) => segment.id === selectedNode.id)
        : null;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem(SEGMENT_STORAGE_KEY);
            if (saved) {
                setSegments(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('Failed to parse saved segments', error);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(SEGMENT_STORAGE_KEY, JSON.stringify(segments));
        } catch (error) {
            console.warn('Failed to persist segments', error);
        }
    }, [segments]);

    const handleSegmentSave = (segment: JobSegment) => {
        setSegments((prev) => [...prev, segment]);
        message.success(t('segments.toast.saved'));
    };

    const handleSegmentDelete = useCallback((segmentId: string) => {
        setSegments((prev) => prev.filter((segment) => segment.id !== segmentId));
        if (selectedNode?.type === 'segment' && selectedNode.id === segmentId) {
            setSelectedNode(null);
            setActiveDetailTab('dashboard');
        }
        message.success(t('segments.toast.deleted'));
    }, [selectedNode, t]);

    const clearFilters = () => {
        setStatusFilter([]);
        setTimeFilter('24h');
        setTreeSearchTerm('');
        if (selectedNode?.type === 'segment') {
            setSelectedNode(null);
        }
    };

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

    const selectedActionId = selectedNode?.type === 'action' ? selectedNode.id : 0;
    const selectedRolloutId = selectedNode?.type === 'rollout' ? selectedNode.id : 0;

    const {
        data: actionDetail,
        isLoading: actionDetailLoading,
        refetch: refetchActionDetail,
    } = useGetAction1(selectedActionId, {
        query: { enabled: selectedNode?.type === 'action' },
    });

    const {
        data: rolloutDetail,
        isLoading: rolloutDetailLoading,
        refetch: refetchRolloutDetail,
    } = useGetRollout(selectedRolloutId, {
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
        if (!selectedNode || selectedNode.type !== 'action' || !actionDetail) return;
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

    const displayQuery = (activeSegment?.query?.trim() || treeSearchTerm.trim());

    const {
        treeData,
        filteredActions,
        filteredRollouts,
        derivedStatusFilter,
        derivedTimeFilter,
        derivedQuery,
    } = useMemo(() => {
        const sortedActions = [...(actionsData?.content || [])].sort(
            (a, b) => (b.lastModifiedAt || 0) - (a.lastModifiedAt || 0)
        );
        const sortedRollouts = [...(rolloutsData?.content || [])].sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );

        const derivedStatusFilter = (activeSegment?.statusFilters && activeSegment.statusFilters.length > 0)
            ? activeSegment.statusFilters
            : statusFilter;
        const derivedTimeFilter = activeSegment?.timeWindow || timeFilter;
        const derivedQueryLower = displayQuery.toLowerCase();

        const now = dayjs();
        let threshold = 0;
        if (derivedTimeFilter !== 'all') {
            if (derivedTimeFilter === '24h') {
                threshold = now.subtract(24, 'hour').valueOf();
            } else if (derivedTimeFilter === '7d') {
                threshold = now.subtract(7, 'day').valueOf();
            } else if (derivedTimeFilter === '30d') {
                threshold = now.subtract(30, 'day').valueOf();
            }
        }

        const matchQuery = (haystack?: string | number) => {
            if (!derivedQueryLower) return true;
            return haystack?.toString().toLowerCase().includes(derivedQueryLower);
        };

        const matchStatus = (status?: string) => {
            if (!derivedStatusFilter || derivedStatusFilter.length === 0) return true;
            return derivedStatusFilter.includes((status || '').toLowerCase());
        };

        const matchTime = (timestamp?: number | null) => {
            if (!timestamp || derivedTimeFilter === 'all') return true;
            return timestamp >= threshold;
        };

        const allowActions = !activeSegment || activeSegment.scope === 'all' || activeSegment.scope === 'actions';
        const allowRollouts = !activeSegment || activeSegment.scope === 'all' || activeSegment.scope === 'rollouts';

        const filteredActions = allowActions
            ? sortedActions.filter((action) => {
                const textMatches =
                    matchQuery(action.id) ||
                    matchQuery(action._links?.target?.name) ||
                    matchQuery(action._links?.distributionset?.name) ||
                    matchQuery(action.status);
                const statusMatches = matchStatus(action.status);
                const timeMatches = matchTime(action.lastModifiedAt || action.createdAt);
                return textMatches && statusMatches && timeMatches;
            })
            : [];

        const filteredRollouts = allowRollouts
            ? sortedRollouts.filter((rollout) => {
                const textMatches =
                    matchQuery(rollout.name) ||
                    matchQuery(rollout.status) ||
                    matchQuery(rollout.targetFilterQuery);
                const statusMatches = matchStatus(rollout.status);
                const timeMatches = matchTime(rollout.createdAt);
                return textMatches && statusMatches && timeMatches;
            })
            : [];

        const actionNodes: TreeDataNode[] = filteredActions.map((action) => ({
            key: `action-${action.id}`,
            title: (
                <Space size={6}>
                    <Tag color={statusColorMap[action.status || ''] || 'default'}>
                        {getStatusLabel(action.status, t)}
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
                        {getStatusLabel(rollout.status, t)}
                    </Tag>
                    <span>{rollout.name}</span>
                </Space>
            ),
            isLeaf: false,
            children: rolloutGroups[rollout.id!]?.map((group) => ({
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

        const segmentNodes: TreeDataNode[] = segments.map((segment) => ({
            key: `segment-${segment.id}`,
            title: (
                <Space size={6}>
                    <Tag color="geekblue">{t('segments.node')}</Tag>
                    <span>{segment.name}</span>
                    <Tooltip title={t('segments.delete')}>
                        <Popconfirm
                            title={t('segments.delete')}
                            description={t('segments.deleteConfirm', { name: segment.name })}
                            okText={t('segments.deleteConfirmOk')}
                            cancelText={t('segments.deleteConfirmCancel')}
                            onConfirm={(e) => {
                                e?.stopPropagation();
                                handleSegmentDelete(segment.id);
                            }}
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
            isLeaf: true,
        }));

        const treeData: TreeDataNode[] = [];

        if (segments.length > 0) {
            treeData.push({
                key: 'segments-root',
                title: `${t('segments.title')} (${segments.length})`,
                selectable: false,
                children: segmentNodes,
            });
        }

        treeData.push(
            {
                key: 'actions-root',
                title: `${t('tree.actions')} (${filteredActions.length})`,
                selectable: false,
                children: actionNodes,
            },
            {
                key: 'rollouts-root',
                title: `${t('tree.rollouts')} (${filteredRollouts.length})`,
                selectable: false,
                children: rolloutNodes,
            }
        );

        return {
            treeData,
            filteredActions,
            filteredRollouts,
            derivedStatusFilter,
            derivedTimeFilter,
            derivedQuery: displayQuery,
        };
    }, [
        actionsData,
        rolloutsData,
        rolloutGroups,
        segments,
        activeSegment,
        statusFilter,
        timeFilter,
        displayQuery,
        t,
        handleSegmentDelete,
    ]);

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
        } else if (key.startsWith('segment-')) {
            const id = key.replace('segment-', '');
            setSelectedNode({ type: 'segment', id });
            setActiveDetailTab('overview');
        }
    };

    const selectedKeys = selectedNode ? [`${selectedNode.type}-${selectedNode.id}`] : [];

    const extractTargetId = (href?: string) => {
        if (!href) return '';
        const parts = href.split('/');
        return parts[parts.length - 1];
    };

    const renderContextBanner = () => {
        const statusLabel = derivedStatusFilter.length > 0
            ? derivedStatusFilter.map((status) => status.toUpperCase()).join(', ')
            : t('segments.detail.anyStatus');
        const timeLabel = t(`filters.timeOptions.${derivedTimeFilter}`);
        const scopeLabel = activeSegment
            ? t(`segments.modal.scopeLabel.${activeSegment.scope}`)
            : t('filters.scope.all');
        const queryLabel = derivedQuery ? derivedQuery : t('segments.detail.anyQuery');
        let bannerTitle = t('context.globalTitle');
        if (selectedNode?.type === 'action') {
            bannerTitle = t('context.currentAction', { id: selectedNode.id });
        } else if (selectedNode?.type === 'rollout') {
            bannerTitle = t('context.currentRollout', { id: selectedNode.id });
        } else if (activeSegment) {
            bannerTitle = activeSegment.name;
        }

        return (
            <ContextBanner>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{bannerTitle}</Text>
                    {activeSegment?.description && (
                        <Text type="secondary">{activeSegment.description}</Text>
                    )}
                    <Space wrap>
                        <Tag color="blue">{t('context.statusTag', { value: statusLabel })}</Tag>
                        <Tag color="purple">{t('context.timeTag', { value: timeLabel })}</Tag>
                        <Tag color="geekblue">{t('context.scopeTag', { value: scopeLabel })}</Tag>
                        <Tag color="magenta">{t('context.queryTag', { value: queryLabel })}</Tag>
                    </Space>
                </Space>
            </ContextBanner>
        );
    };

    const renderSegmentDetail = () => {
        if (!activeSegment) {
            return <Empty description={t('detail.placeholder')} />;
        }
        const runningActions = filteredActions.filter((action) => (action.status || '').toLowerCase() === 'running').length;
        const blockedActions = filteredActions.filter((action) => (action.status || '').toLowerCase() === 'error').length;
        const waitingRollouts = filteredRollouts.filter((rollout) => (rollout.status || '').toLowerCase() === 'waiting_for_approval').length;

        return (
            <>
                <Space style={{ marginBottom: 12 }}>
                    <Typography.Title level={4} style={{ margin: 0 }}>{activeSegment.name}</Typography.Title>
                    <Tag color="geekblue">{t('segments.node')}</Tag>
                </Space>
                {activeSegment.description && (
                    <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                        {activeSegment.description}
                    </Text>
                )}
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label={t('segments.detail.scope')}>
                        {t(`segments.modal.scopeLabel.${activeSegment.scope}`)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('segments.detail.status')}>
                        {activeSegment.statusFilters?.length
                            ? activeSegment.statusFilters.map((status) => status.toUpperCase()).join(', ')
                            : t('segments.detail.anyStatus')}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('segments.detail.timeWindow')}>
                        {t(`filters.timeOptions.${activeSegment.timeWindow || '24h'}`)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('segments.detail.query')}>
                        {activeSegment.query || t('segments.detail.anyQuery')}
                    </Descriptions.Item>
                </Descriptions>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} md={8}>
                        <Card size="small" bordered>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                                {filteredActions.length}
                            </Typography.Title>
                            <Text type="secondary">{t('segments.metrics.actions')}</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card size="small" bordered>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                                {runningActions}
                            </Typography.Title>
                            <Text type="secondary">{t('segments.metrics.runningActions')}</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card size="small" bordered>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                                {blockedActions}
                            </Typography.Title>
                            <Text type="secondary">{t('segments.metrics.blockedActions')}</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card size="small" bordered>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                                {filteredRollouts.length}
                            </Typography.Title>
                            <Text type="secondary">{t('segments.metrics.rollouts')}</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card size="small" bordered>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                                {waitingRollouts}
                            </Typography.Title>
                            <Text type="secondary">{t('segments.metrics.waitingRollouts')}</Text>
                        </Card>
                    </Col>
                </Row>
            </>
        );
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
                        {getStatusLabel(actionDetail.status, t)}
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
                    <Descriptions.Item label={t('detail.lastStatusCode')}>{actionDetail.lastStatusCode}</Descriptions.Item>
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
                    <Tag color={statusColorMap[status] || 'default'}>{getStatusLabel(status, t)}</Tag>
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

    const renderOverviewContent = () => (
        <>
            {renderContextBanner()}
            {selectedNode?.type === 'segment' ? renderSegmentDetail() : renderDetail()}
        </>
    );

    return (
        <>
            <Typography.Title level={3} style={{ marginBottom: 16 }}>
                {t('title')}
            </Typography.Title>

            <KPIContainer>
                <KPICard
                    title={t('dashboard.openActions')}
                    value={filteredActions.filter(a => ['running', 'pending', 'scheduled', 'retrieving'].includes((a.status || '').toLowerCase())).length}
                    icon={<SyncOutlined />}
                    color="#1890ff"
                    description={activeSegment ? t('context.segmentView') : t('context.globalView')}
                />
                <KPICard
                    title={t('dashboard.runningRollouts')}
                    value={filteredRollouts.filter(r => (r.status || '').toLowerCase() === 'running').length}
                    icon={<SyncOutlined spin />}
                    color="#52c41a"
                    description={t('filters.scope.rollout')}
                />
                <KPICard
                    title={t('dashboard.waitingApproval')}
                    value={filteredRollouts.filter(r => (r.status || '').toLowerCase() === 'waiting_for_approval').length}
                    icon={<ClockCircleOutlined />}
                    color="#faad14"
                    badgeLabel={filteredRollouts.some(r => (r.status || '').toLowerCase() === 'waiting_for_approval') ? t('kpi.alertBadge') : undefined}
                />
                <KPICard
                    title={t('dashboard.failedJobs')}
                    value={filteredActions.filter(a => (a.status || '').toLowerCase() === 'error').length}
                    icon={<ExclamationCircleOutlined />}
                    color="#ff4d4f"
                    description={t('filters.scope.action')}
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
                            value={treeSearchTerm}
                        />
                    </SearchWrapper>
                    <FilterBar>
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder={t('filters.status')}
                            value={statusFilter}
                            onChange={(values) => setStatusFilter(values)}
                            style={{ minWidth: 180, flex: 1 }}
                            maxTagCount="responsive"
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <Select.Option key={status} value={status}>
                                    {status.toUpperCase()}
                                </Select.Option>
                            ))}
                        </Select>
                        <Select
                            value={timeFilter}
                            onChange={(value) => setTimeFilter(value)}
                            style={{ width: 140 }}
                        >
                            <Select.Option value="24h">{t('filters.timeOptions.24h')}</Select.Option>
                            <Select.Option value="7d">{t('filters.timeOptions.7d')}</Select.Option>
                            <Select.Option value="30d">{t('filters.timeOptions.30d')}</Select.Option>
                            <Select.Option value="all">{t('filters.timeOptions.all')}</Select.Option>
                        </Select>
                        <Tooltip title={t('filters.reset')}>
                            <Button icon={<FilterOutlined />} onClick={clearFilters} />
                        </Tooltip>
                    </FilterBar>
                    <SegmentWrapper>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                                <Text strong>{t('segments.title')}</Text>
                                <Button type="link" size="small" onClick={() => setSegmentModalOpen(true)}>
                                    {t('segments.add')}
                                </Button>
                            </Space>
                            {segments.length === 0 ? (
                                <Text type="secondary">{t('segments.empty')}</Text>
                            ) : (
                                <Space wrap>
                                    {segments.map((segment) => (
                                        <Tag
                                            key={segment.id}
                                            color={activeSegment?.id === segment.id ? 'blue' : 'default'}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setSelectedNode({ type: 'segment', id: segment.id })}
                                        >
                                            {segment.name}
                                        </Tag>
                                    ))}
                                </Space>
                            )}
                        </Space>
                    </SegmentWrapper>
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
                                    children: renderOverviewContent(),
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
            <CreateSegmentModal
                open={segmentModalOpen}
                onClose={() => setSegmentModalOpen(false)}
                onSave={handleSegmentSave}
            />
        </>
    );
};

export default JobManagement;
