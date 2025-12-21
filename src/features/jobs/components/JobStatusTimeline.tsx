import React from 'react';
import { Timeline, Spin, Tag, Typography, Empty, Space, Card } from 'antd';
import { useGetActionStatusList } from '@/api/generated/targets/targets';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface JobStatusTimelineProps {
    targetId: string;
    actionId: number;
}

const statusColorMap: Record<string, string> = {
    finished: 'green',
    running: 'blue',
    pending: 'orange',
    waiting: 'orange',
    error: 'red',
    canceled: 'default',
};

const JobStatusTimeline: React.FC<JobStatusTimelineProps> = ({ targetId, actionId }) => {
    const { t } = useTranslation('jobs');
    const { data: statusData, isLoading } = useGetActionStatusList(targetId, actionId);

    const getStatusLabel = (status?: string) => {
        if (!status) return t('status.unknown', { defaultValue: 'UNKNOWN' });
        const key = status.toLowerCase();
        const translated = t(`status.${key}`, { defaultValue: '' });
        return translated || status.toUpperCase();
    };

    if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}><Spin /></div>;

    if (!statusData?.content || statusData.content.length === 0) {
        return <Empty description={t('timeline.empty', 'No status history found')} style={{ margin: '40px 0' }} />;
    }

    // Sort by timestamp if not already
    const sortedTimeline = [...statusData.content].sort((a, b) => (b.reportedAt || b.timestamp || 0) - (a.reportedAt || a.timestamp || 0));

    return (
        <div style={{ padding: '20px 0' }}>
            <Timeline
                mode="left"
                items={sortedTimeline.map((item) => ({
                    label: dayjs(item.reportedAt || item.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                    children: (
                        <Card size="small" style={{ marginBottom: 4, borderRadius: 8 }}>
                            <Space direction="vertical" size={2}>
                                <Space>
                                    <Tag color={statusColorMap[item.type || ''] || 'default'}>
                                        {getStatusLabel(item.type)}
                                    </Tag>
                                    <Text strong>{getStatusLabel(item.type)}</Text>
                                </Space>
                                {item.messages && item.messages.length > 0 && (
                                    <div style={{ marginTop: 4 }}>
                                        {item.messages.map((msg, idx) => (
                                            <div key={idx} style={{ fontSize: '12px', color: '#666' }}>
                                                • {msg}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Space>
                        </Card>
                    ),
                    color: statusColorMap[item.type || ''] === 'red' ? 'red' : 'blue',
                }))}
            />
        </div>
    );
};

export default JobStatusTimeline;
