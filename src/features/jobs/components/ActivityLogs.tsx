import React, { useMemo } from 'react';
import { Table, Tag, Typography, Spin } from 'antd';
import dayjs from 'dayjs';
import { useGetActions } from '@/api/generated/actions/actions';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface ActivityLog {
    id: string;
    timestamp: number;
    type: 'action' | 'rollout';
    entityId: number;
    eventKey: 'completed' | 'failed' | 'progress' | 'statusChanged';
    user: string;
    status: string;
}

const ActivityLogs: React.FC = () => {
    const { t } = useTranslation('jobs');
    const { data: actionsData, isLoading } = useGetActions({
        limit: 50,
        // Removed sort due to API issues with lastModifiedAt in some versions, sorting client-side
    }, {
        query: { refetchInterval: 30000 }
    });

    const statusColors: Record<string, string> = {
        finished: 'green',
        running: 'blue',
        error: 'red',
        pending: 'orange',
        scheduled: 'cyan',
        waiting_for_approval: 'orange',
        waiting_for_confirmation: 'orange',
        paused: 'volcano',
    };

    const getStatusLabel = (status?: string) => {
        if (!status) return t('status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        const translated = t(`status.${key}`, { defaultValue: '' });
        return translated || status.toUpperCase();
    };

    const logs: ActivityLog[] = useMemo(() => {
        if (!actionsData?.content) return [];

        return [...actionsData.content]
            .sort((a, b) => (b.lastModifiedAt || 0) - (a.lastModifiedAt || 0))
            .map(action => ({
                id: `action-${action.id}`,
                timestamp: action.lastModifiedAt || action.createdAt || 0,
                type: 'action' as const,
                entityId: action.id!,
                eventKey:
                    action.status === 'finished'
                        ? 'completed'
                        : action.status === 'error'
                            ? 'failed'
                            : action.status === 'running'
                                ? 'progress'
                                : 'statusChanged',
                user: action.lastModifiedBy || action.createdBy || 'system',
                status: action.status || 'unknown'
            }));
    }, [actionsData]);

    const columns = [
        {
            title: t('logs.time', 'Time'),
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (ts: number) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss'),
            width: 180,
        },
        {
            title: t('logs.type', 'Type'),
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'action' ? 'blue' : 'purple'}>
                    {t(`logs.typeLabels.${type}`, { defaultValue: type.toUpperCase() })}
                </Tag>
            ),
            width: 100,
        },
        {
            title: t('logs.id', 'ID'),
            dataIndex: 'entityId',
            key: 'entityId',
            width: 80,
        },
        {
            title: t('logs.event', 'Event'),
            dataIndex: 'eventKey',
            key: 'eventKey',
            render: (eventKey: ActivityLog['eventKey']) => t(`logs.events.${eventKey}`),
        },
        {
            title: t('logs.user', 'User'),
            dataIndex: 'user',
            key: 'user',
            render: (user: string) => <Text strong>{user}</Text>,
        },
        {
            title: t('logs.status', 'Status'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={statusColors[status.toLowerCase()] || 'default'}>
                    {getStatusLabel(status)}
                </Tag>
            ),
        }
    ];

    if (isLoading) return <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>;

    return (
        <div style={{ padding: '16px 0' }}>
            <Table
                dataSource={logs}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default ActivityLogs;
