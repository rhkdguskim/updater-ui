import React from 'react';
import { useGetStatisticsForDistributionSet } from '@/api/generated/distribution-sets/distribution-sets';
import { Card, Row, Col, Statistic, Progress, Typography, Divider, Spin, Empty, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    CheckCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    GlobalOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface SetStatisticsTabProps {
    distributionSetId: number;
}

const SetStatisticsTab: React.FC<SetStatisticsTabProps> = ({ distributionSetId }) => {
    const { t } = useTranslation(['distributions', 'common']);
    const { data, isLoading } = useGetStatisticsForDistributionSet(distributionSetId);

    if (isLoading) return <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>;
    if (!data) return <Empty description={t('detail.No statistics available')} />;

    // hawkBit Statistics properties:
    // data.rollouts (MgmtDistributionSetStatisticsRollouts)
    // data.actions (MgmtDistributionSetStatisticsActions)
    // data.totalAutoAssignments

    // We can sum up the counts from the maps
    const totalRollouts = Object.values(data.rollouts || {}).reduce((a, b) => a + b, 0);
    const totalActions = Object.values(data.actions || {}).reduce((a, b) => a + (b as number), 0);
    const successActions = (data.actions as any)?.finished || 0;
    const successRate = totalActions > 0 ? Math.round((successActions / totalActions) * 100) : 0;

    return (
        <div style={{ padding: '16px' }}>
            <Title level={4}>{t('detail.Monitoring')}</Title>
            <Divider />

            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Card variant="borderless" style={{ background: '#f6ffed' }}>
                        <Statistic
                            title={t('detail.Active Rollouts')}
                            value={totalRollouts}
                            prefix={<SyncOutlined spin={totalRollouts > 0} />}
                            styles={{ content: { color: '#52c41a' } }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless" style={{ background: '#e6f7ff' }}>
                        <Statistic
                            title={t('detail.Total Actions')}
                            value={totalActions}
                            prefix={<ClockCircleOutlined />}
                            styles={{ content: { color: '#1890ff' } }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless" style={{ background: '#f9f0ff' }}>
                        <Statistic
                            title={t('detail.Auto Assignments')}
                            value={data.totalAutoAssignments || 0}
                            prefix={<GlobalOutlined />}
                            styles={{ content: { color: '#722ed1' } }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless" style={{ background: '#fff7e6' }}>
                        <Statistic
                            title={t('detail.Success Rate')}
                            value={successRate}
                            suffix="%"
                            prefix={<CheckCircleOutlined />}
                            styles={{ content: { color: '#fa8c16' } }}
                        />
                    </Card>
                </Col>
            </Row>

            <Divider>{t('detail.Deployment Success Rate')}</Divider>
            <Row gutter={24} align="middle">
                <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                        <Progress
                            type="dashboard"
                            percent={successRate}
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text strong>{t('detail.Overall Success Rate')}</Text>
                        </div>
                    </div>
                </Col>
                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text type="secondary">{t('detail.Successful Deployments')}</Text>
                            <Progress percent={successRate} size="small" status="active" />
                        </div>
                        <div>
                            <Text type="secondary">{t('common:status.running')}</Text>
                            <Progress
                                percent={totalActions > 0 ? Math.round((((data.actions as any)?.running || 0) / totalActions) * 100) : 0}
                                size="small"
                                status="active"
                                strokeColor="#1890ff"
                            />
                        </div>
                        <div>
                            <Text type="secondary">{t('detail.Failed / Retrying')}</Text>
                            <Progress
                                percent={totalActions > 0 ? Math.round((((data.actions as any)?.error || 0) / totalActions) * 100) : 0}
                                size="small"
                                status="exception"
                            />
                        </div>
                    </Space>
                </Col>
            </Row>
        </div>
    );
};

export default SetStatisticsTab;
