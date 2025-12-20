import React from 'react';
import { Card, Statistic, Typography, Flex, Progress, Steps, Spin, Empty, Tag } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Text } = Typography;

const STATUS_ORDER = ['scheduled', 'waiting_for_approval', 'running', 'finished'];

export const ActiveRolloutCard: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const { data, isLoading } = useGetRollouts(
        { limit: 5 },
        { query: { refetchInterval: 30000 } }
    );

    const activeRollout =
        data?.content?.find((rollout) => {
            const status = rollout.status?.toLowerCase();
            return status && ['running', 'waiting_for_approval', 'ready'].includes(status);
        }) || data?.content?.[0];

    const totalTargets = activeRollout?.totalTargets ?? 0;
    const totalPerStatus = activeRollout?.totalTargetsPerStatus || {};

    const getStatusCount = (key: string) => {
        const normalized = key.toLowerCase();
        return Object.entries(totalPerStatus).reduce((acc, [statusKey, value]) => {
            return statusKey.toLowerCase() === normalized ? acc + value : acc;
        }, 0);
    };

    const finishedCount = getStatusCount('finished');
    const runningCount = getStatusCount('running');
    const errorCount = getStatusCount('error') + getStatusCount('failed');
    const completion = totalTargets > 0 ? Math.round((finishedCount / totalTargets) * 100) : 0;
    const normalizedStatus = activeRollout?.status?.toLowerCase();

    const steps = STATUS_ORDER.map((stage) => {
        const stageIndex = STATUS_ORDER.indexOf(stage);
        const currentIndex = normalizedStatus ? STATUS_ORDER.indexOf(normalizedStatus) : -1;
        let status: 'wait' | 'process' | 'finish' = 'wait';

        if (stageIndex < currentIndex) status = 'finish';
        else if (stageIndex === currentIndex) status = 'process';

        return { title: t(`rollout.stages.${stage}`, stage), status };
    });

    const statusColorMap: Record<string, string> = {
        running: '#1890ff',
        waiting_for_approval: '#faad14',
        ready: '#faad14',
        scheduled: '#faad14',
        finished: '#52c41a',
        error: '#ff4d4f',
    };

    return (
        <Card
            title={t('rollout.activeMonitor')}
            extra={<RocketOutlined style={{ color: '#1890ff' }} />}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
            {isLoading && (
                <Flex style={{ flex: 1 }} align="center" justify="center">
                    <Spin />
                </Flex>
            )}

            {!isLoading && !activeRollout && (
                <Flex style={{ flex: 1 }} align="center" justify="center">
                    <Empty description={t('rollout.noActiveRollout')} />
                </Flex>
            )}

            {!isLoading && activeRollout && (
                <>
                    <Flex justify="space-between" align="center">
                        <div>
                            <Text type="secondary">{t('rollout.currentRollout')}</Text>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{activeRollout.name}</div>
                            <Text type="secondary">
                                {t('rollout.targetsLabel', { count: totalTargets })} ·{' '}
                                {activeRollout.lastModifiedAt
                                    ? t('rollout.updatedAt', { value: dayjs(activeRollout.lastModifiedAt).format('HH:mm:ss') })
                                    : t('rollout.updatedAtUnknown')}
                            </Text>
                        </div>
                        <Tag color={statusColorMap[normalizedStatus || 'running'] || 'blue'}>
                            {t(`rollout.statusLabel.${normalizedStatus}`, activeRollout.status)}
                        </Tag>
                    </Flex>

                    <Flex gap={24} wrap="wrap" align="center" justify="space-between">
                        <div style={{ minWidth: 160, textAlign: 'center' }}>
                            <Progress
                                type="dashboard"
                                percent={completion}
                                strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
                            />
                            <Text type="secondary">{t('rollout.progressLabel')}</Text>
                        </div>
                        <div style={{ flex: 1, minWidth: 220 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                                {t('rollout.timelineLabel')}
                            </Text>
                            <Steps size="small" items={steps} />
                        </div>
                    </Flex>

                    <Flex gap="small">
                        <Card size="small" style={{ flex: 1, background: '#f6ffed', borderColor: '#b7eb8f' }}>
                            <Statistic title={t('rollout.successCount')} value={finishedCount} valueStyle={{ color: '#3f8600', fontSize: 16 }} />
                        </Card>
                        <Card size="small" style={{ flex: 1, background: '#e6f4ff', borderColor: '#91caff' }}>
                            <Statistic title={t('rollout.runningCount')} value={runningCount} valueStyle={{ color: '#1677ff', fontSize: 16 }} />
                        </Card>
                        <Card size="small" style={{ flex: 1, background: '#fff1f0', borderColor: '#ffa39c' }}>
                            <Statistic title={t('rollout.errorCount')} value={errorCount} valueStyle={{ color: '#cf1322', fontSize: 16 }} />
                        </Card>
                    </Flex>
                </>
            )}
        </Card>
    );
};
