import React, { useCallback, useState, useMemo } from 'react';
import { Tag, Button, Tooltip, message, Typography, Space } from 'antd';
import {
    EyeOutlined,
    StopOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetActions } from '@/api/generated/actions/actions';
import { useCancelAction } from '@/api/generated/targets/targets';
import type { MgmtAction } from '@/api/generated/model';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { keepPreviousData } from '@tanstack/react-query';
import { StandardListLayout } from '@/components/layout/StandardListLayout';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useServerTable } from '@/hooks/useServerTable';
import { StatusTag } from '@/components/common/StatusTag';
import { DataView, EnhancedTable, FilterBuilder, type ToolbarAction, type FilterValue, type FilterField } from '@/components/patterns';
import type { ColumnsType } from 'antd/es/table';
import { appendFilter, buildCondition } from '@/utils/fiql';

dayjs.extend(relativeTime);

const { Text } = Typography;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

const LiveIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--ant-color-text-secondary, #64748b);

    &::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ant-color-success, #10b981);
        animation: ${pulse} 1.5s ease-in-out infinite;
    }
`;

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
    return action.status || 'unknown';
};

const isActiveStatus = (status?: string) => {
    const normalized = status?.toLowerCase() || '';
    return ['running', 'pending', 'canceling', 'wait_for_confirmation', 'waiting_for_confirmation', 'scheduled', 'retrieving'].includes(normalized);
};

const ActionList: React.FC = () => {
    const { t } = useTranslation(['actions', 'common']);
    const navigate = useNavigate();

    const {
        pagination,
        offset,
        handleTableChange,
        resetPagination,
    } = useServerTable<MgmtAction>({ syncToUrl: true });

    const [selectedActionIds, setSelectedActionIds] = useState<React.Key[]>([]);
    const [selectedTargetIdsMap, setSelectedTargetIdsMap] = useState<Record<number, string>>({});
    const [filters, setFilters] = useState<FilterValue[]>([]);

    // Filter fields
    const filterFields: FilterField[] = useMemo(() => [
        {
            key: 'status',
            label: t('columns.status'),
            type: 'select',
            options: [
                { value: 'running', label: 'Running' },
                { value: 'pending', label: 'Pending' },
                { value: 'finished', label: 'Finished' },
                { value: 'error', label: 'Error' },
                { value: 'canceled', label: 'Canceled' },
            ],
        },
        {
            key: 'type',
            label: t('columns.type'),
            type: 'select',
            options: [
                { value: 'update', label: 'Update' },
                { value: 'forced', label: 'Forced' },
                { value: 'download_only', label: 'Download Only' },
            ],
        },
    ], [t]);

    // Build RSQL query from filters
    const buildFinalQuery = useCallback(() => {
        if (filters.length === 0) return undefined;

        const conditions = filters.map(f => {
            const op = '==';
            return buildCondition({ field: f.field, operator: op, value: String(f.value) });
        });

        return conditions.reduce((acc, cond) => appendFilter(acc, cond), '');
    }, [filters]);

    // Check if any running actions exist for auto-refresh
    const hasRunningActions = (content?: MgmtAction[]) =>
        content?.some((a) => isActiveStatus(a.status));

    const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } = useGetActions(
        {
            offset,
            limit: pagination.pageSize,
            q: buildFinalQuery(),
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

    const cancelMutation = useCancelAction();

    const handleBulkCancel = useCallback(async () => {
        if (selectedActionIds.length === 0) return;

        const promises = selectedActionIds.map(id => {
            const targetId = selectedTargetIdsMap[id as number];
            if (!targetId) {
                return Promise.reject(new Error(`Target ID not found for action ${id}`));
            }
            return cancelMutation.mutateAsync({ targetId, actionId: id as number });
        });

        try {
            const results = await Promise.allSettled(promises);
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                message.success(t('bulk.cancelSuccess', { count: successCount }));
                refetch();
                setSelectedActionIds([]);
                setSelectedTargetIdsMap({});
            }

            if (failCount > 0) {
                message.error(t('bulk.cancelError', { count: failCount }));
            }
        } catch (error) {
            console.error('Bulk cancel failed:', error);
            message.error(t('common:apiErrors.generic.unknown'));
        }
    }, [selectedActionIds, selectedTargetIdsMap, cancelMutation, t, refetch]);

    // Handle filter change
    const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
        setFilters(newFilters);
        resetPagination();
    }, [resetPagination]);

    // Selection toolbar actions
    const selectionActions: ToolbarAction[] = useMemo(() => [
        {
            key: 'cancel',
            label: t('bulk.cancel', { defaultValue: 'Cancel' }),
            icon: <StopOutlined />,
            onClick: handleBulkCancel,
            danger: true,
        },
        {
            key: 'force',
            label: t('bulk.force', { defaultValue: 'Force' }),
            icon: <ThunderboltOutlined />,
            onClick: () => { },
            disabled: true,
        },
    ], [t, handleBulkCancel]);

    const columns: ColumnsType<MgmtAction> = [
        {
            title: t('columns.target', { defaultValue: 'Target' }),
            key: 'target',
            width: 160,
            render: (_, record) => {
                const targetId = getTargetId(record);
                if (!targetId) return <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
                return (
                    <a
                        onClick={(e) => { e.stopPropagation(); navigate(`/targets/${targetId}`); }}
                        style={{ cursor: 'pointer' }}
                    >
                        <Text strong ellipsis style={{ maxWidth: 140, fontSize: 12 }}>{targetId}</Text>
                    </a>
                );
            },
        },
        {
            title: t('columns.status'),
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (_, record) => {
                const displayStatus = getActionDisplayStatus(record);
                return <StatusTag status={displayStatus} showIcon />;
            },
        },
        {
            title: t('columns.type'),
            dataIndex: 'type',
            key: 'type',
            width: 90,
            render: (type: string) => (
                <Tag color={type === 'forced' ? 'red' : 'blue'} style={{ borderRadius: 8 }}>
                    {getTypeLabel(type)}
                </Tag>
            ),
        },
        {
            title: t('columns.distributionSet'),
            key: 'distributionSet',
            width: 180,
            render: (_, record) => {
                const ds = getDistributionInfo(record);
                if (!ds) return <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
                return (
                    <a
                        onClick={(e) => { e.stopPropagation(); navigate(`/distributions/sets/${ds.id}`); }}
                        style={{ cursor: 'pointer' }}
                    >
                        <Text ellipsis style={{ maxWidth: 160, fontSize: 12 }}>{ds.name}</Text>
                    </a>
                );
            },
        },
        {
            title: t('columns.createdAt', { defaultValue: 'Created' }),
            key: 'createdAt',
            width: 100,
            render: (_, record) => (
                <Tooltip title={record.createdAt ? dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.createdAt ? dayjs(record.createdAt).fromNow() : '-'}</Text>
                </Tooltip>
            ),
        },
        {
            title: t('columns.actions', { defaultValue: 'Actions' }),
            key: 'actions',
            width: 80,
            fixed: 'right',
            render: (_, record) => (
                <Space size={0} className="action-cell">
                    <Tooltip title={t('actions.view')}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={(e) => { e.stopPropagation(); navigate(`/actions/${record.id}`); }}
                        />
                    </Tooltip>
                    <Tooltip title={t('actions.cancel', { defaultValue: 'Cancel' })}>
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<StopOutlined />}
                            disabled={!isActiveStatus(record.status)}
                            onClick={(e) => {
                                e.stopPropagation();
                                const targetId = getTargetId(record);
                                if (targetId && record.id) {
                                    cancelMutation.mutate(
                                        { targetId, actionId: record.id },
                                        {
                                            onSuccess: () => {
                                                message.success(t('messages.cancelSuccess'));
                                                refetch();
                                            },
                                        }
                                    );
                                }
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const handleSelectionChange = useCallback((keys: React.Key[], selectedRows: MgmtAction[]) => {
        setSelectedActionIds(keys);
        const finalMap: Record<number, string> = {};
        selectedRows.forEach(row => {
            const tid = getTargetId(row);
            if (tid && row.id) finalMap[row.id] = tid;
        });
        setSelectedTargetIdsMap(finalMap);
    }, [getTargetId]);

    return (
        <StandardListLayout
            title={t('pageTitle')}
            subtitle={t('subtitle')}
            headerSubtitleExtra={
                <LiveIndicator>
                    {isActivePolling ? t('polling.live', { defaultValue: 'Live (5s)' }) : t('polling.idle', { defaultValue: 'Idle (30s)' })}
                </LiveIndicator>
            }
            headerExtra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('lastUpdated', { defaultValue: 'Updated' })}: {lastUpdated}
                </Text>
            }
            searchBar={
                <FilterBuilder
                    fields={filterFields}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onRefresh={refetch}
                    loading={isLoading || isFetching}
                />
            }
        >
            <DataView
                loading={isLoading || isFetching}
                error={error as Error}
                isEmpty={data?.content?.length === 0}
                emptyText={t('common:messages.noData')}
            >
                <EnhancedTable<MgmtAction>
                    dataSource={data?.content || []}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading || isFetching}
                    selectedRowKeys={selectedActionIds}
                    onSelectionChange={handleSelectionChange}
                    selectionActions={selectionActions}
                    selectionLabel="개 선택됨"
                    onRow={(record) => ({
                        onClick: () => navigate(`/actions/${record.id}`),
                        style: { cursor: 'pointer' },
                    })}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: data?.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => t('pagination.range', { start: range[0], end: range[1], total }),
                        position: ['topRight'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                />
            </DataView>
        </StandardListLayout>
    );
};

export default ActionList;