import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Select, Typography, Input, Tooltip } from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetActions } from '@/api/generated/actions/actions';
import type { MgmtAction } from '@/api/generated/model';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;
const { Option } = Select;

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

const ActionList: React.FC = () => {
    const { t } = useTranslation('actions');
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

    const { data, isLoading, refetch } = useGetActions(
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
            },
        }
    );

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
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: t('columns.type'),
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (type: string) => (
                <Tag color={type === 'forced' ? 'red' : 'blue'}>
                    {type?.toUpperCase()}
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

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ margin: 0 }}>{t('pageTitle')}</Title>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                        loading={isLoading}
                    >
                        {t('refresh')}
                    </Button>
                </div>

                <Card>
                    <Space style={{ marginBottom: 16 }} wrap>
                        <Input
                            placeholder={t('filter.searchPlaceholder')}
                            prefix={<SearchOutlined />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onPressEnter={() => refetch()}
                            style={{ width: 200 }}
                        />
                        <Select
                            mode="multiple"
                            placeholder={t('filter.statusPlaceholder')}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            allowClear
                            style={{ minWidth: 200 }}
                        >
                            <Option value="pending">{t('filter.pending')}</Option>
                            <Option value="running">{t('filter.running')}</Option>
                            <Option value="finished">{t('filter.finished')}</Option>
                            <Option value="error">{t('filter.error')}</Option>
                            <Option value="canceled">{t('filter.canceled')}</Option>
                            <Option value="wait_for_confirmation">{t('filter.waitForConfirmation')}</Option>
                        </Select>
                        <Button onClick={() => {
                            setSearchQuery('');
                            setStatusFilter([]);
                        }}>
                            {t('filter.clearFilters')}
                        </Button>
                    </Space>

                    <Table
                        dataSource={data?.content || []}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: data?.total || 0,
                            showSizeChanger: true,
                            showTotal: (total) => t('pagination.total', { count: total }),
                        }}
                        onChange={handleTableChange}
                    />
                </Card>
            </Space>
        </div>
    );
};

export default ActionList;

