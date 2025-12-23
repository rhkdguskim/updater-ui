import React, { useCallback, useState } from 'react';
import { Card, Table, Tag, Space, Button, Tooltip, message, Popconfirm, Typography } from 'antd'; // Removed unused imports
import {
    EyeOutlined,
    StopOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons'; // Cleaned up imports
import { useNavigate } from 'react-router-dom';
import { useGetActions } from '@/api/generated/actions/actions';
import { useCancelAction } from '@/api/generated/targets/targets';
import type { MgmtAction } from '@/api/generated/model';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { keepPreviousData } from '@tanstack/react-query';
import { PageContainer, HeaderRow } from '@/components/layout/PageLayout';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useServerTable } from '@/hooks/useServerTable'; // Added
import ActionSearchBar from './components/ActionSearchBar'; // Added
import { StatusTag } from '@/components/common/StatusTag'; // Added

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

// Animations (Keeping pulse and LiveIndicator for now)

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
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

    // Use Shared Hook
    const {
        pagination,
        offset,
        searchQuery,
        handleTableChange,
        handleSearch,
    } = useServerTable<MgmtAction>({ syncToUrl: true });

    const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);
    const [selectedTargetIdsMap, setSelectedTargetIdsMap] = useState<Record<number, string>>({});


    // Check if any running actions exist for auto-refresh
    const hasRunningActions = (content?: MgmtAction[]) =>
        content?.some((a) => isActiveStatus(a.status));

    const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useGetActions(
        {
            offset,
            limit: pagination.pageSize,
            q: searchQuery || undefined,
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
            render: (_, record) => {
                const displayStatus = getActionDisplayStatus(record);
                return <StatusTag status={displayStatus} showIcon />;
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

    const cancelMutation = useCancelAction();

    const handleBulkCancel = useCallback(async () => {
        if (selectedActionIds.length === 0) return;

        const promises = selectedActionIds.map(id => {
            const targetId = selectedTargetIdsMap[id];
            if (!targetId) {
                return Promise.reject(new Error(`Target ID not found for action ${id}`));
            }
            return cancelMutation.mutateAsync({ targetId, actionId: id });
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

    const handleClearSelection = useCallback(() => {
        setSelectedActionIds([]);
        setSelectedTargetIdsMap({});
    }, []);

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
                </Space>
            </HeaderRow>

            <ActionSearchBar
                onSearch={handleSearch}
                onRefresh={refetch}
                loading={isLoading || isFetching}
            />

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
                        onChange: (keys, selectedRows) => {
                            setSelectedActionIds(keys as number[]);
                            const newMap = { ...selectedTargetIdsMap };
                            selectedRows.forEach(row => {
                                const tid = getTargetId(row);
                                if (tid && row.id) newMap[row.id] = tid;
                            });
                            // Filter map to only keep keys present in 'keys' to avoid memory leak
                            const finalMap: Record<number, string> = {};
                            (keys as number[]).forEach(k => {
                                if (newMap[k]) finalMap[k] = newMap[k];
                            });
                            setSelectedTargetIdsMap(finalMap);
                        },
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

// Force HMR update