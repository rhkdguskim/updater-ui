import React from 'react';
import { Card, Progress, Typography, Flex, Skeleton, Empty, Tag, Statistic } from 'antd';
import { RocketOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useGetRollouts } from '@/api/generated/rollouts/rollouts';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const StyledCard = styled(Card)`
    height: 100%;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .ant-card-body {
        padding: 24px;
        height: 100%;
        display: flex;
        flex-direction: column;
    }
`;

const SpaceTitle = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

export const ActiveRolloutCard: React.FC = () => {
    const { t } = useTranslation('dashboard');

    // Fetch running rollouts
    const { data, isLoading } = useGetRollouts({
        q: 'status==running',
        limit: 1
    });

    const activeRollout = data?.content?.[0];

    if (isLoading) {
        return (
            <StyledCard title={<><RocketOutlined /> {t('rollout.activeMonitor')}</>}>
                <Skeleton active />
            </StyledCard>
        );
    }

    if (!activeRollout) {
        return (
            <StyledCard title={<><RocketOutlined /> {t('rollout.activeMonitor')}</>}>
                <Empty description={t('rollout.noActiveRollout')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </StyledCard>
        );
    }

    // Mock progress calculation if not available in rollout object directly
    const stats = (activeRollout as any).statistics || {}; // casting for safety if types are incomplete
    const total = (activeRollout as any).totalTargets || 0;
    const success = stats.finished || 0;
    const error = stats.error || 0;
    const progress = total > 0 ? Math.round(((success + error) / total) * 100) : 0;

    return (
        <StyledCard title={<SpaceTitle><RocketOutlined /> {activeRollout.name}</SpaceTitle>} extra={<Tag color="processing">RUNNING</Tag>}>
            <Flex vertical gap="large" style={{ marginTop: 8 }}>
                <div>
                    <Flex justify="space-between" style={{ marginBottom: 8 }}>
                        <Text strong>Overall Progress</Text>
                        <Text>{progress}%</Text>
                    </Flex>
                    <Progress percent={progress} showInfo={false} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
                </div>

                <Flex gap="middle" justify="space-around" style={{ marginTop: 16 }}>
                    <Statistic
                        title="Success"
                        value={success}
                        valueStyle={{ color: '#52c41a', fontSize: '1.2rem' }}
                        prefix={<CheckCircleOutlined />}
                    />
                    <Statistic
                        title="Error"
                        value={error}
                        valueStyle={{ color: '#ff4d4f', fontSize: '1.2rem' }}
                        prefix={<CloseCircleOutlined />}
                    />
                    <Statistic
                        title="Pending"
                        value={total - success - error}
                        valueStyle={{ color: '#faad14', fontSize: '1.2rem' }}
                        prefix={<SyncOutlined spin />}
                    />
                </Flex>
            </Flex>
        </StyledCard>
    );
};
