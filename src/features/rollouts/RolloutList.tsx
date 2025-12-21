import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Select, Typography, Progress } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import type { MgmtRolloutResponseBody } from '@/api/generated/model';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/useAuthStore';

const { Title } = Typography;
const { Option } = Select;

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'finished':
            return 'success';
        case 'running':
            return 'processing';
        case 'paused':
            return 'warning';
        case 'ready':
            return 'cyan';
        case 'creating':
            return 'default';
        case 'starting':
            return 'blue';
        case 'error':
            return 'error';
        case 'waiting_for_approval':
            return 'purple';
        default:
            return 'default';
    }
};

const RolloutList: React.FC = () => {
    const { t } = useTranslation(['rollouts', 'common']);
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
    const [statusFilter, setStatusFilter] = useState<string>('');

    const offset = (pagination.current - 1) * pagination.pageSize;

    const { data, isLoading, refetch } = useGetRollouts({
        offset,
        limit: pagination.pageSize,
        q: statusFilter ? `status==${statusFilter}` : undefined,
    });

    const getStatusLabel = (status?: string) => {
        if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
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
        },
        {
            title: t('columns.status'),
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusLabel(status)}
                </Tag>
            ),
        },
        {
            title: t('columns.totalTargets'),
            dataIndex: 'totalTargets',
            key: 'totalTargets',
            width: 120,
        },
        {
            title: t('columns.progress'),
            key: 'progress',
            width: 200,
            render: (_, record) => {
                const total = record.totalTargets || 0;
                const finished = (record.totalTargetsPerStatus as Record<string, number>)?.finished || 0;
                const percent = total > 0 ? Math.round((finished / total) * 100) : 0;
                return (
                    <Progress
                        percent={percent}
                        size="small"
                        status={record.status === 'error' ? 'exception' : undefined}
                    />
                );
            },
        },
        {
            title: t('columns.actions'),
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Button
                    type="link"
                    onClick={() => navigate(`/rollouts/${record.id}`)}
                >
                    {t('actions.view')}
                </Button>
            ),
        },
    ];

    const handleTableChange: TableProps<MgmtRolloutResponseBody>['onChange'] = (paginationConfig) => {
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
                    <Space>
                        {isAdmin && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigate('/rollouts/create')}
                            >
                                {t('createRollout')}
                            </Button>
                        )}
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => refetch()}
                            loading={isLoading}
                        >
                            {t('refresh')}
                        </Button>
                    </Space>
                </div>

                <Card>
                    <Space style={{ marginBottom: 16 }} wrap>
                        <Select
                            placeholder={t('filter.placeholder')}
                            value={statusFilter || undefined}
                            onChange={setStatusFilter}
                            allowClear
                            style={{ width: 200 }}
                        >
                            <Option value="creating">{t('filter.creating')}</Option>
                            <Option value="ready">{t('filter.ready')}</Option>
                            <Option value="starting">{t('filter.starting')}</Option>
                            <Option value="running">{t('filter.running')}</Option>
                            <Option value="paused">{t('filter.paused')}</Option>
                            <Option value="finished">{t('filter.finished')}</Option>
                            <Option value="error">{t('filter.error')}</Option>
                            <Option value="waiting_for_approval">{t('filter.waitingForApproval')}</Option>
                        </Select>
                        <Button onClick={() => setStatusFilter('')}>
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

export default RolloutList;
