import React from 'react';
import { Card, Statistic, Typography, Flex, Progress, Steps } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const ActiveRolloutCard: React.FC = () => {
    return (
        <Card title="Active Rollout: Seoul-Patch-V2" extra={<RocketOutlined style={{ color: '#1890ff' }} />} style={{ height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            <div>
                <Flex justify="space-between">
                    <Text type="secondary">Overall Progress</Text>
                    <Text strong>68%</Text>
                </Flex>
                <Progress percent={68} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
            </div>

            <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Current Group: Phase 2 (Canary)</Text>
                <Steps
                    size="small"
                    current={1}
                    items={[
                        { title: 'Pilot', status: 'finish' },
                        { title: 'Canary', status: 'process' },
                        { title: 'Full', status: 'wait' },
                    ]}
                />
            </div>

            <Flex gap="small" style={{ marginTop: 16 }}>
                <Card size="small" style={{ flex: 1, background: '#f6ffed', borderColor: '#b7eb8f' }}>
                    <Statistic title="Success" value={450} valueStyle={{ color: '#3f8600', fontSize: 16 }} />
                </Card>
                <Card size="small" style={{ flex: 1, background: '#fff1f0', borderColor: '#ffa39c' }}>
                    <Statistic title="Error" value={12} valueStyle={{ color: '#cf1322', fontSize: 16 }} />
                </Card>
            </Flex>
        </Card>
    );
};
