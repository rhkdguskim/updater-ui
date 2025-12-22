import React, { useCallback, useMemo, useState } from 'react';
import { Card, Table, Tag, Space, Button, Select, Typography, Input, Tooltip, message, Popconfirm } from 'antd';
import {
    ReloadOutlined,
    SearchOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    StopOutlined,
    ThunderboltOutlined,
    FilterOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetActions } from '@/api/generated/actions/actions';
import type { MgmtAction } from '@/api/generated/model';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { keepPreviousData } from '@tanstack/react-query';
import { PageContainer, HeaderRow } from '@/components/layout/PageLayout';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

// Animations
const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

const StatsCard = styled(Card) <{ $accentColor?: string; $delay?: number }>`
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    cursor: pointer;
    min-height: 70px;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: ${props => props.$accentColor || 'var(--gradient-primary)'};
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
    }
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 12px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const FilterBar = styled(Card)`
    border-radius: 10px;
    margin-bottom: 8px;

    .ant-card-body {
        padding: 8px 12px;
    }
`;

const LiveIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;

    &::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        animation: ${pulse} 1.5s ease-in-out infinite;
    }
`;

const BulkActionBar = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
    border-radius: 12px;
    margin-bottom: 16px;
`;

const COLORS = {
    running: '#3b82f6',
    pending: '#f59e0b',
    finished: '#10b981',
    error: '#ef4444',
};

const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'finished') return 'success';
    if (s === 'error' || s === 'failed') return 'error';
    if (s === 'running' || s === 'retrieving') return 'processing';
    if (s === 'pending' || s === 'scheduled') return 'default';
    if (s === 'canceled' || s === 'canceling') return 'warning';
    if (s === 'wait_for_confirmation' || s === 'waiting_for_confirmation') return 'purple';
    return 'default';
};

const getStatusIcon = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'finished') return <CheckCircleOutlined />;
    if (s === 'error' || s === 'failed') return <CloseCircleOutlined />;
    if (s === 'running' || s === 'retrieving') return <SyncOutlined spin />;
    if (s === 'pending' || s === 'scheduled' || s === 'wait_for_confirmation' || s === 'waiting_for_confirmation') return <ClockCircleOutlined />;
    if (s === 'canceled' || s === 'canceling') return <StopOutlined />;
    return <ClockCircleOutlined />;
};

const isActionErrored = (action: MgmtAction) => {
    const status = action.status?.toLowerCase() || '';
    const detail = action.detailStatus?.toLowerCase() || '';
    const hasErrorStatus = status === 'error' || status === 'failed';
    const hasErrorDetail = detail.includes('error') || detail.includes('failed');
    const hasErrorCode = typeof action.lastStatusCode === 'number' && action.lastStatusCode >= 400;
    return hasErrorStatus || hasErrorDetail || hasErrorCode;
};

const getActionDisplayStatus = (action: MgmtAction) => {
    if (isActionErrored(action)) return 'error';
    return action.status;
};

const isActiveStatus = (status?: string) => {
    const normalized = status?.toLowerCase() || '';
    return ['running', 'pending', 'canceling', 'wait_for_confirmation', 'waiting_for_confirmation', 'scheduled', 'retrieving'].includes(normalized);
};

const ActionList: React.FC = () => {
    const { t } = useTranslation(['actions', 'common']);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
    const [statusFilter, setStatusFilter] = useState<string[]>(() => {
        const initial = searchParams.get('status');
        return initial ? [initial] : [];
    });
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);

    const offset = (pagination.current - 1) * pagination.pageSize;

    // Build query filter
    const buildQuery = useCallback(() => {
        const filters: string[] = [];
        if (statusFilter.length > 0) {
            filters.push(`status=in=(${statusFilter.join(',')})`);
        }
        if (searchQuery) {
            // Search by target name or ID
            filters.push(`target.name==*${searchQuery}*`);
        }
        return filters.length > 0 ? filters.join(';') : undefined;
    }, [statusFilter, searchQuery]);

    // Check if any running actions exist for auto-refresh
    const hasRunningActions = (content?: MgmtAction[]) =>
        content?.some((a) => isActiveStatus(a.status));

    const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useGetActions(
        {
            offset,
            limit: pagination.pageSize,
            q: buildQuery(),
        },
        {
            query: {
                refetchInterval: (query) => {
                    return hasRunningActions(query.state.data?.content) ? 5000 : 30000;
                },
                placeholderData: keepPreviousData,
                refetchOnWindowFocus: true,
                staleTime: 5000,
            },
        }
    );

    const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).fromNow() : '-';
    const isActivePolling = hasRunningActions(data?.content);

    const summaryCounts = useMemo(() => {
        const content = data?.content || [];
        const counts = {
            total: data?.total ?? content.length,
            active: 0,
            errors: 0,
            completed: 0,
        };
        content.forEach((action) => {
            if (isActiveStatus(action.status)) {
                counts.active += 1;
            }
            if (isActionErrored(action)) {
                counts.errors += 1;
            }
            if ((action.status || '').toLowerCase() === 'finished') {
                counts.completed += 1;
            }
        });
        return counts;
    }, [data?.content, data?.total]);

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setStatusFilter([]);
        setPagination((prev) => ({ ...prev, current: 1 }));
        setSearchParams({});
    }, [setSearchParams]);

    const getStatusLabel = useCallback((status?: string) => {
        if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
    }, [t]);

    const getTypeLabel = useCallback((type?: string) => {
        if (!type) return '-';
        const key = type.toLowerCase();
        return t(`actions:typeLabels.${key}`, { defaultValue: type.toUpperCase() });
    }, [t]);

    // Extract target ID from action links
    const getTargetId = useCallback((action: MgmtAction) => {
        let targetId = action._links?.target?.href?.split('/').pop();
        if (!targetId && action._links?.self?.href) {
            const match = action._links.self.href.match(/targets\/([^/]+)\/actions/);
            if (match) targetId = match[1];
        }
        return targetId;
    }, []);

    // Extract distribution set info
    const getDistributionInfo = useCallback((action: MgmtAction) => {
        const dsLink = action._links?.distributionset || action._links?.distributionSet;
        if (!dsLink) return null;
        const id = dsLink.href?.split('/').pop();
        const name = dsLink.name || dsLink.title || id;
        return { id, name };
    }, []);

    const columns: TableProps<MgmtAction>['columns'] = [
        {
            title: t('columns.target', { defaultValue: 'Target' }),
            key: 'target',
            width: 180,
            render: (_, record) => {
                const targetId = getTargetId(record);
                if (!targetId) return <Text type="secondary">-</Text>;
                return (
                    <a
                        onClick={(e) => { e.stopPropagation(); navigate(`/targets/${targetId}`); }}
                        style={{ cursor: 'pointer' }}
                    >
                        <Text strong ellipsis style={{ maxWidth: 160 }}>{targetId}</Text>
                    </a>
                );
            },
        },
        {
            title: t('columns.status'),
            dataIndex: 'status',
            key: 'status',
            width: 160,
            filters: [
                { text: t('filter.pending'), value: 'pending' },
                { text: t('filter.running'), value: 'running' },
                { text: t('filter.finished'), value: 'finished' },
                { text: t('filter.error'), value: 'error' },
                { text: t('filter.canceled'), value: 'canceled' },
            ],
            render: (_, record) => {
                const displayStatus = getActionDisplayStatus(record);
                return (
                    <Tag color={getStatusColor(displayStatus)} icon={getStatusIcon(displayStatus)} style={{ borderRadius: 999 }}>
                        {getStatusLabel(displayStatus)}
                    </Tag>
                );
            },
        },
        {
            title: t('columns.type'),
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => (
                <Tag color={type === 'forced' ? 'red' : 'blue'} style={{ borderRadius: 8 }}>
                    {getTypeLabel(type)}
                </Tag>
            ),
        },
        {
            title: t('columns.distributionSet'),
            key: 'distributionSet',
            width: 200,
            render: (_, record) => {
                const ds = getDistributionInfo(record);
                if (!ds) return <Text type="secondary">-</Text>;
                return (
                    <a
                        onClick={(e) => { e.stopPropagation(); navigate(`/distributions/sets/${ds.id}`); }}
                        style={{ cursor: 'pointer' }}
                    >
                        <Text ellipsis style={{ maxWidth: 180 }}>{ds.name}</Text>
                    </a>
                );
            },
        },
        {
            title: t('columns.createdAt', { defaultValue: 'Created' }),
            key: 'createdAt',
            width: 120,
            render: (_, record) => (
                <Tooltip title={record.createdAt ? dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}>
                    <Text type="secondary">{record.createdAt ? dayjs(record.createdAt).fromNow() : '-'}</Text>
                </Tooltip>
            ),
        },
        {
            title: t('columns.actions'),
            key: 'actions',
            width: 80,
            fixed: 'right',
            render: (_, record) => (
                <Tooltip title={t('actions.view')}>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={(e) => { e.stopPropagation(); navigate(`/actions/${record.id}`); }}
                    />
                </Tooltip>
            ),
        },
    ];

    const handleTableChange: TableProps<MgmtAction>['onChange'] = (paginationConfig) => {
        setPagination({
            current: paginationConfig.current || 1,
            pageSize: paginationConfig.pageSize || 20,
        });
    };

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, []);

    const handleStatusChange = useCallback((value: string[]) => {
        setStatusFilter(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
        if (value.length > 0) {
            setSearchParams({ status: value.join(',') });
        } else {
            setSearchParams({});
        }
    }, [setSearchParams]);

    const handleBulkCancel = useCallback(() => {
        // TODO: Implement bulk cancel API
        message.info(t('bulk.cancelComingSoon', { defaultValue: 'Bulk cancel will be available soon.' }));
    }, [t]);

    const handleClearSelection = useCallback(() => {
        setSelectedActionIds([]);
    }, []);

    const statusOptions = useMemo(() => [
        { value: 'pending', label: t('filter.pending') },
        { value: 'running', label: t('filter.running') },
        { value: 'finished', label: t('filter.finished') },
        { value: 'error', label: t('filter.error') },
        { value: 'canceled', label: t('filter.canceled') },
        { value: 'wait_for_confirmation', label: t('filter.waitForConfirmation') },
    ], [t]);

    return (
        <PageContainer>
            <HeaderRow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Title level={2} style={{ margin: 0 }}>{t('pageTitle')}</Title>
                    <Space size={12}>
                        <Text type="secondary">{t('subtitle')}</Text>
                        <LiveIndicator>
                            {isActivePolling ? t('polling.live', { defaultValue: 'Live (5s)' }) : t('polling.idle', { defaultValue: 'Idle (30s)' })}
                        </LiveIndicator>
                    </Space>
                </div>
                <Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('lastUpdated', { defaultValue: 'Updated' })}: {lastUpdated}
                    </Text>
                    <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading || isFetching}>
                        {t('refresh')}
                    </Button>
                </Space>
            </HeaderRow>

            {/* Stats Cards */}
            <StatsGrid>
                <StatsCard $accentColor="linear-gradient(135deg, #64748b 0%, #94a3b8 100%)" $delay={1}>
                    <Text type="secondary" style={{ fontSize: 13 }}>{t('summary.total')}</Text>
                    <Title level={3} style={{ margin: '4px 0 0', color: '#475569' }}>{summaryCounts.total}</Title>
                </StatsCard>
                <StatsCard $accentColor={`linear-gradient(135deg, ${COLORS.running} 0%, #6366f1 100%)`} $delay={2}>
                    <Text type="secondary" style={{ fontSize: 13 }}>{t('summary.active')}</Text>
                    <Title level={3} style={{ margin: '4px 0 0', color: COLORS.running }}>{summaryCounts.active}</Title>
                </StatsCard>
                <StatsCard $accentColor={`linear-gradient(135deg, ${COLORS.error} 0%, #f87171 100%)`} $delay={3}>
                    <Text type="secondary" style={{ fontSize: 13 }}>{t('summary.errors')}</Text>
                    <Title level={3} style={{ margin: '4px 0 0', color: summaryCounts.errors > 0 ? COLORS.error : '#64748b' }}>{summaryCounts.errors}</Title>
                </StatsCard>
                <StatsCard $accentColor={`linear-gradient(135deg, ${COLORS.finished} 0%, #34d399 100%)`} $delay={4}>
                    <Text type="secondary" style={{ fontSize: 13 }}>{t('summary.completed')}</Text>
                    <Title level={3} style={{ margin: '4px 0 0', color: COLORS.finished }}>{summaryCounts.completed}</Title>
                </StatsCard>
            </StatsGrid>

            {/* Filter Bar */}
            <FilterBar>
                <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap>
                        <Input
                            placeholder={t('filter.searchPlaceholder')}
                            prefix={<SearchOutlined />}
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            style={{ width: 240 }}
                            allowClear
                        />
                        <Select
                            mode="multiple"
                            placeholder={t('filter.statusPlaceholder')}
                            value={statusFilter}
                            onChange={handleStatusChange}
                            allowClear
                            style={{ minWidth: 220 }}
                            suffixIcon={<FilterOutlined />}
                            options={statusOptions}
                        />
                        {(searchQuery || statusFilter.length > 0) && (
                            <Button onClick={resetFilters}>{t('filter.clearFilters')}</Button>
                        )}
                    </Space>
                    {statusFilter.map(s => (
                        <Tag key={s} color={getStatusColor(s)} closable onClose={() => handleStatusChange(statusFilter.filter(x => x !== s))}>
                            {getStatusLabel(s)}
                        </Tag>
                    ))}
                </Space>
            </FilterBar>

            {/* Bulk Action Bar */}
            {selectedActionIds.length > 0 && (
                <BulkActionBar>
                    <Text strong>{t('bulk.selected', { count: selectedActionIds.length, defaultValue: `${selectedActionIds.length} selected` })}</Text>
                    <Popconfirm
                        title={t('bulk.cancelConfirm', { defaultValue: 'Cancel selected actions?' })}
                        onConfirm={handleBulkCancel}
                        okText={t('common:actions.confirm')}
                        cancelText={t('common:actions.cancel')}
                    >
                        <Button icon={<StopOutlined />} danger>
                            {t('bulk.cancel', { defaultValue: 'Bulk Cancel' })}
                        </Button>
                    </Popconfirm>
                    <Button icon={<ThunderboltOutlined />} disabled>
                        {t('bulk.force', { defaultValue: 'Bulk Force' })}
                    </Button>
                    <Button onClick={handleClearSelection}>
                        {t('bulk.clearSelection', { defaultValue: 'Clear Selection' })}
                    </Button>
                </BulkActionBar>
            )}

            {/* Table */}
            <Card
                style={{ flex: 1, height: '100%', overflow: 'hidden' }}
                styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column' } }}
            >
                <Table
                    dataSource={data?.content || []}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading || isFetching}
                    rowSelection={{
                        selectedRowKeys: selectedActionIds,
                        onChange: (keys) => setSelectedActionIds(keys as number[]),
                    }}
                    onRow={(record) => ({
                        onClick: () => navigate(`/actions/${record.id}`),
                        style: { cursor: 'pointer' },
                    })}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: data?.total || 0,
                        showSizeChanger: true,
                        showTotal: (total, range) => t('pagination.range', { start: range[0], end: range[1], total }),
                        position: ['topRight'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 900, y: 'calc(100vh - 380px)' }}
                    size="small"
                    locale={{ emptyText: t('common:messages.noData') }}
                />
            </Card>
        </PageContainer>
    );
};

export default ActionList;