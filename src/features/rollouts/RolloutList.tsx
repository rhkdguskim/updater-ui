import React, { useState, useMemo, useCallback } from 'react';
import { Space, Button, Typography, Progress, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import type { MgmtRolloutResponseBody } from '@/api/generated/model';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/useAuthStore';
import { keepPreviousData } from '@tanstack/react-query';
import { DataView, EnhancedTable, FilterBuilder, type FilterValue, type FilterField } from '@/components/patterns';
import { StandardListLayout } from '@/components/layout/StandardListLayout';
import { useServerTable } from '@/hooks/useServerTable';
import dayjs from 'dayjs';
import { appendFilter, buildCondition } from '@/utils/fiql';
import RolloutCreateModal from './RolloutCreateModal';
import { StatusTag } from '@/components/common/StatusTag';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const RolloutList: React.FC = () => {
    const { t } = useTranslation(['rollouts', 'common']);
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const {
        pagination,
        offset,
        handleTableChange,
        resetPagination,
    } = useServerTable<MgmtRolloutResponseBody>({ syncToUrl: true });

    const [filters, setFilters] = useState<FilterValue[]>([]);

    // Filter fields
    const filterFields: FilterField[] = useMemo(() => [
        { key: 'name', label: t('columns.name'), type: 'text' },
        {
            key: 'status',
            label: t('columns.status'),
            type: 'select',
            options: [
                { value: 'creating', label: t('filter.creating') },
                { value: 'ready', label: t('filter.ready') },
                { value: 'starting', label: t('filter.starting') },
                { value: 'running', label: t('filter.running') },
                { value: 'paused', label: t('filter.paused') },
                { value: 'finished', label: t('filter.finished') },
                { value: 'error', label: t('filter.error') },
                { value: 'waiting_for_approval', label: t('filter.waitingForApproval') },
                { value: 'scheduled', label: t('filter.scheduled') },
            ],
        },
    ], [t]);

    // Build RSQL query from filters
    const buildFinalQuery = useCallback(() => {
        if (filters.length === 0) return undefined;

        const conditions = filters.map(f => {
            let val = String(f.value);

            // For contains, use wildcards with == operator
            if (f.operator === 'contains') val = `*${val}*`;

            // HawkBit uses == for all comparisons including wildcards
            const op: '==' = '==';

            return buildCondition({ field: f.field, operator: op, value: val });
        });

        return conditions.reduce((acc, cond) => appendFilter(acc, cond), '');
    }, [filters]);


    const { data, isLoading, isFetching, error, refetch } = useGetRollouts(
        {
            offset,
            limit: pagination.pageSize,
            q: buildFinalQuery(),
        },
        {
            query: {
                placeholderData: keepPreviousData,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                refetchInterval: 2000,
            },
        }
    );

    // Handle filter change
    const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
        setFilters(newFilters);
        resetPagination();
    }, [resetPagination]);

    const columns: ColumnsType<MgmtRolloutResponseBody> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
            render: (id) => <Text style={{ fontSize: 12 }}>{id}</Text>,
        },
        {
            title: t('columns.name'),
            dataIndex: 'name',
            key: 'name',
            width: 200,
            sorter: (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
            render: (value: string, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 12 }}>{value}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {t('columns.totalTargets')}: {record.totalTargets || 0}
                    </Text>
                </Space>
            ),
        },
        {
            title: t('columns.status'),
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status: string) => <StatusTag status={status} />,
        },
        {
            title: t('common:createdAt', { defaultValue: 'Created At' }),
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (date: string) => date ? (
                <Text style={{ fontSize: 12 }}>{dayjs(date).format('YYYY-MM-DD HH:mm')}</Text>
            ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
            ),
        },
        {
            title: t('columns.progress'),
            key: 'progress',
            width: 150,
            render: (_, record) => {
                let percent = 0;
                if (record.status === 'finished') {
                    percent = 100;
                } else {
                    const total = record.totalTargets || 0;
                    const finished = (record.totalTargetsPerStatus as Record<string, number>)?.finished || 0;
                    percent = total > 0 ? Math.round((finished / total) * 100) : 0;
                }
                return (
                    <Progress
                        percent={percent}
                        size="small"
                        status={record.status === 'stopped' ? 'exception' : undefined}
                        strokeColor={record.status === 'stopped' ? undefined : 'var(--ant-color-primary, #3b82f6)'}
                    />
                );
            },
        },
        {
            title: t('columns.actions'),
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Space size={0} className="action-cell">
                    <Tooltip title={t('actions.view')}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/rollouts/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title={t('actions.edit', { defaultValue: 'Edit' })}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/rollouts/${record.id}`)}
                        />
                    </Tooltip>
                    {isAdmin && (
                        <Tooltip title={record.status === 'paused' ? t('actions.resume', { defaultValue: 'Resume' }) : t('actions.pause', { defaultValue: 'Pause' })}>
                            <Button
                                type="text"
                                size="small"
                                icon={record.status === 'paused' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <StandardListLayout
            title={t('pageTitle')}
            searchBar={
                <FilterBuilder
                    fields={filterFields}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onRefresh={refetch}
                    onAdd={() => setIsCreateModalOpen(true)}
                    canAdd={isAdmin}
                    addLabel={t('createRollout')}
                    loading={isFetching}
                />
            }
        >
            <DataView
                loading={isLoading}
                error={error as Error}
                isEmpty={!isLoading && data?.content?.length === 0}
                emptyText={t('empty')}
            >
                <EnhancedTable<MgmtRolloutResponseBody>
                    dataSource={data?.content || []}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
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

            <RolloutCreateModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={(id) => {
                    setIsCreateModalOpen(false);
                    navigate(`/rollouts/${id}`);
                }}
            />
        </StandardListLayout>
    );
};

export default RolloutList;
