import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Table, Space, Button, Select, Typography, Progress, Input, Tooltip } from 'antd';
import { ReloadOutlined, PlusOutlined, EyeOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import type { MgmtRolloutResponseBody } from '@/api/generated/model';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/useAuthStore';
import { keepPreviousData } from '@tanstack/react-query';
import { SearchLayout } from '@/components/common';

import { StandardListLayout } from '@/components/layout/StandardListLayout';
import { useServerTable } from '@/hooks/useServerTable';
import dayjs from 'dayjs';
import { buildWildcardSearch, appendFilter, buildCondition } from '@/utils/fiql';
import RolloutCreateModal from './RolloutCreateModal';
import { StatusTag } from '@/components/common/StatusTag';

const { Text } = Typography;

const RolloutList: React.FC = () => {
    const { t } = useTranslation(['rollouts', 'common']);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const [tableScrollY, setTableScrollY] = useState<number | undefined>(undefined);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const {
        pagination,
        offset,
        handleTableChange,
        resetPagination,
    } = useServerTable<MgmtRolloutResponseBody>({ syncToUrl: true });

    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchValue, setSearchValue] = useState<string>('');

    useLayoutEffect(() => {
        if (!tableContainerRef.current) {
            return;
        }
        const element = tableContainerRef.current;
        const updateHeight = () => {
            const height = element.getBoundingClientRect().height;
            const scrollHeight = Math.max(240, Math.floor(height - 55)); // Adjust buffer for header/pagination
            setTableScrollY(scrollHeight);
        };
        updateHeight();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateHeight);
            return () => window.removeEventListener('resize', updateHeight);
        }
        const observer = new ResizeObserver(updateHeight);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const statusParam = searchParams.get('status') || '';
        const searchParam = searchParams.get('q_search') || '';
        setStatusFilter(statusParam);
        setSearchValue(searchParam);
    }, [searchParams]);

    const buildQuery = () => {
        let query = '';
        if (statusFilter) {
            query = appendFilter(query, buildCondition({ field: 'status', operator: '==', value: statusFilter }));
        }
        if (searchValue) {
            // Assuming name search for rollouts
            query = appendFilter(query, buildWildcardSearch('name', searchValue));
        }
        return query || undefined;
    };

    const { data, isLoading, isFetching, refetch } = useGetRollouts(
        {
            offset,
            limit: pagination.pageSize,
            q: buildQuery(),
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



    const statusOptions = useMemo(() => [
        { value: 'creating', label: t('filter.creating') },
        { value: 'ready', label: t('filter.ready') },
        { value: 'starting', label: t('filter.starting') },
        { value: 'running', label: t('filter.running') },
        { value: 'paused', label: t('filter.paused') },
        { value: 'finished', label: t('filter.finished') },
        { value: 'error', label: t('filter.error') },
        { value: 'waiting_for_approval', label: t('filter.waitingForApproval') },
        { value: 'scheduled', label: t('filter.scheduled') },
    ], [t]);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        resetPagination();
        const newParams: any = {};
        if (statusFilter) newParams.status = statusFilter;
        if (value) newParams.q_search = value;
        setSearchParams(newParams);
    };

    const handleStatusChange = (value?: string) => {
        const nextValue = value || '';
        setStatusFilter(nextValue);
        resetPagination();
        const newParams: any = {};
        if (nextValue) newParams.status = nextValue;
        if (searchValue) newParams.q_search = searchValue;
        setSearchParams(newParams);
    };

    const columns: TableProps<MgmtRolloutResponseBody>['columns'] = [
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
            render: (value: string, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{value}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('columns.totalTargets')}: {record.totalTargets || 0}
                    </Text>
                </Space>
            ),
        },
        {
            title: t('columns.status'),
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <StatusTag status={status} />
            ),
        },
        {
            title: t('common:createdAt', { defaultValue: 'Created At' }),
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (date: string) => date ? (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: 13 }}>{dayjs(date).format('YYYY-MM-DD')}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(date).format('HH:mm')}</Text>
                </Space>
            ) : '-',
        },
        {
            title: t('columns.progress'),
            key: 'progress',
            width: 200,
            render: (_, record) => {
                // If rollout is finished, always show 100%
                let percent = 0;
                if (record.status === 'finished') {
                    percent = 100;
                } else {
                    const total = record.totalTargets || 0;
                    const finished = (record.totalTargetsPerStatus as Record<string, number>)?.finished || 0;
                    percent = total > 0 ? Math.round((finished / total) * 100) : 0;
                }
                return (
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Progress
                            percent={percent}
                            size="small"
                            status={record.status === 'stopped' ? 'exception' : undefined}
                            strokeColor={record.status === 'stopped' ? undefined : 'var(--ant-color-primary, #3b82f6)'}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('columns.progressLabel', { percent })}
                        </Text>
                    </Space>
                );
            },
        },
        {
            title: t('columns.actions'),
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/rollouts/${record.id}`)}
                >
                    {t('actions.view')}
                </Button>
            ),
        },
    ];

    return (
        <StandardListLayout
            title={t('pageTitle')}
            searchBar={
                <SearchLayout>
                    <SearchLayout.SearchGroup>
                        <Select
                            placeholder={t('filter.placeholder')}
                            value={statusFilter || undefined}
                            onChange={handleStatusChange}
                            allowClear
                            style={{ width: 200 }}
                            suffixIcon={<FilterOutlined />}
                            options={statusOptions}
                        />
                        <Input.Search
                            placeholder={t('search.placeholder', { defaultValue: 'Search by Name' })}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onSearch={handleSearch}
                            allowClear
                            style={{ maxWidth: 300 }}
                            enterButton={<SearchOutlined />}
                        />
                    </SearchLayout.SearchGroup>
                    <SearchLayout.ActionGroup>
                        <Tooltip title={t('refresh')}>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                                loading={isLoading}
                            />
                        </Tooltip>
                        {isAdmin && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                {t('createRollout')}
                            </Button>
                        )}
                    </SearchLayout.ActionGroup>
                </SearchLayout>
            }
        >
            <div ref={tableContainerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Table
                    dataSource={data?.content || []}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading || isFetching}
                    locale={{ emptyText: t('empty') }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: data?.total || 0,
                        showSizeChanger: true,
                        showTotal: (total, range) => t('pagination.range', { start: range[0], end: range[1], total }),
                        position: ['topRight'],
                    }}
                    onChange={handleTableChange}
                    scroll={tableScrollY ? { x: 1000, y: tableScrollY } : { x: 1000 }}
                    size="small"
                />
            </div>

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
