import React, { useCallback, useMemo, useState } from 'react';
import { Card, Table, Tag, Space, Button, Select, Typography, Input, Tooltip, message } from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, ClockCircleOutlined, StopOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetActions } from '@/api/generated/actions/actions';
import type { MgmtAction } from '@/api/generated/model';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { keepPreviousData } from '@tanstack/react-query';

const { Title, Text } = Typography;
const { Option } = Select;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    padding: 24px;
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
`;

const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
`;

const SummaryCard = styled(Card)`
    border-radius: 12px;
    min-height: 90px;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const FilterRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    align-items: center;
`;

const FilterGroup = styled(Space)`
    flex-wrap: wrap;
`;

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

const getStatusIcon = (status?: string) => {
    switch (status) {
        case 'finished':
            return <CheckCircleOutlined />;
        case 'error':
            return <CloseCircleOutlined />;
        case 'running':
            return <SyncOutlined spin />;
        case 'pending':
        case 'wait_for_confirmation':
        case 'waiting_for_confirmation':
        case 'scheduled':
            return <ClockCircleOutlined />;
        case 'canceled':
        case 'canceling':
            return <StopOutlined />;
        default:
            return <ClockCircleOutlined />;
    }
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
    if (isActionErrored(action)) {
        return 'error';
    }
    return action.status;
};

const isActiveStatus = (status?: string) => {
    const normalized = status?.toLowerCase() || '';
    return ['running', 'pending', 'canceling', 'wait_for_confirmation', 'waiting', 'scheduled'].includes(normalized);
};

const ActionList: React.FC = () => {
    const { t } = useTranslation(['actions', 'common']);
    const navigate = useNavigate();
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const offset = (pagination.current - 1) * pagination.pageSize;

    // Build query filter
    const buildQuery = () => {
        const filters: string[] = [];
        if (statusFilter.length > 0) {
            // Multiple status filter: status=in=(pending,running)
            filters.push(`status=in=(${statusFilter.join(',')})`);
        }
        if (searchQuery) {
            filters.push(`target.name==*${searchQuery}*`);
        }
        return filters.length > 0 ? filters.join(';') : undefined;
    };

    // Check if any running actions exist for auto-refresh
    const hasRunningActions = (content?: MgmtAction[]) =>
        content?.some((a) => ['running', 'pending', 'canceling'].includes(a.status || ''));

    const { data, isLoading, isFetching, refetch } = useGetActions(
        {
            offset,
            limit: pagination.pageSize,
            q: buildQuery(),
        },
        {
            query: {
                refetchInterval: (query) => {
                    return hasRunningActions(query.state.data?.content) ? 5000 : false;
                },
                placeholderData: keepPreviousData,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
            },
        }
    );

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

    const summaryCards = useMemo(
        () => [
            { key: 'total', label: t('summary.total'), value: summaryCounts.total },
            { key: 'active', label: t('summary.active'), value: summaryCounts.active },
            { key: 'errors', label: t('summary.errors'), value: summaryCounts.errors },
            { key: 'completed', label: t('summary.completed'), value: summaryCounts.completed },
        ],
        [summaryCounts, t]
    );

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setStatusFilter([]);
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, []);

    const handleAddAction = useCallback(() => {
        message.info(t('actions:addActionComingSoon'));
    }, [t]);

    const getStatusLabel = (status?: string) => {
        if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
    };

    const getTypeLabel = (type?: string) => {
        if (!type) return '-';
        const key = type.toLowerCase();
        return t(`actions:typeLabels.${key}`, { defaultValue: type.toUpperCase() });
    };

    const columns: TableProps<MgmtAction>['columns'] = [
        {
            title: t('columns.id'),
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: t('columns.status'),
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (_: string, record) => {
                const displayStatus = getActionDisplayStatus(record);
                return (
                    <Tag color={getStatusColor(displayStatus)} icon={getStatusIcon(displayStatus)}>
                        {getStatusLabel(displayStatus)}
                    </Tag>
                );
            },
        },
        {
            title: t('columns.type'),
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (type: string) => (
                <Tag color={type === 'forced' ? 'red' : 'blue'}>
                    {getTypeLabel(type)}
                </Tag>
            ),
        },
        {
            title: t('columns.distributionSet'),
            key: 'distributionSet',
            render: (_, record) => (
                <span>
                    {record._links?.distributionset?.name || '-'}
                </span>
            ),
        },
        {
            title: t('columns.forceType'),
            dataIndex: 'forceType',
            key: 'forceType',
            width: 100,
            render: (text: string) => text ? t(`forceTypes.${text}`) : '-',
        },
        {
            title: t('columns.actions'),
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Tooltip title={t('actions.view')}>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/actions/${record.id}`)}
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
    }, []);

    return (
        <PageContainer>
            <HeaderRow>
                <div>
                    <Title level={2} style={{ margin: 0 }}>{t('pageTitle')}</Title>
                    <Text type="secondary">{t('subtitle')}</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAction}>
                    {t('actions:addAction')}
                </Button>
            </HeaderRow>

            <Card
                style={{ flex: 1, height: '100%' }}
                styles={{ body: { display: 'flex', flexDirection: 'column', gap: 16, height: '100%' } }}
            >
                <SummaryGrid>
                    {summaryCards.map((card) => (
                        <SummaryCard key={card.key} variant="borderless" styles={{ body: { padding: '12px 16px' } }}>
                            <Text type="secondary">{card.label}</Text>
                            <Title level={3} style={{ margin: 0 }}>
                                {card.value}
                            </Title>
                        </SummaryCard>
                    ))}
                </SummaryGrid>

                <FilterRow>
                    <FilterGroup size="small" align="center">
                        <Input
                            placeholder={t('filter.searchPlaceholder')}
                            prefix={<SearchOutlined />}
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            style={{ width: 220 }}
                            allowClear
                        />
                        <Select
                            mode="multiple"
                            placeholder={t('filter.statusPlaceholder')}
                            value={statusFilter}
                            onChange={handleStatusChange}
                            allowClear
                            style={{ minWidth: 220 }}
                        >
                            <Option value="pending">{t('filter.pending')}</Option>
                            <Option value="running">{t('filter.running')}</Option>
                            <Option value="finished">{t('filter.finished')}</Option>
                            <Option value="error">{t('filter.error')}</Option>
                            <Option value="canceled">{t('filter.canceled')}</Option>
                            <Option value="wait_for_confirmation">{t('filter.waitForConfirmation')}</Option>
                        </Select>
                    </FilterGroup>
                    <FilterGroup size="small">
                        <Button onClick={resetFilters} disabled={!searchQuery && statusFilter.length === 0}>
                            {t('filter.clearFilters')}
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => refetch()}
                            loading={isLoading || isFetching}
                        >
                            {t('refresh')}
                        </Button>
                    </FilterGroup>
                </FilterRow>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <Table
                        dataSource={data?.content || []}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading || isFetching}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: data?.total || 0,
                            showSizeChanger: true,
                            showTotal: (total, range) => t('pagination.range', { start: range[0], end: range[1], total }),
                            position: ['topRight'],
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1000, y: '100%' }}
                    />
                </div>
            </Card>
        </PageContainer>
    );
};

export default ActionList;
