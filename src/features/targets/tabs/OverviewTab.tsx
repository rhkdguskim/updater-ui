import React from 'react';
import { Descriptions, Tag, Typography, Skeleton, Empty, Card, Row, Col, Statistic } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    DesktopOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import type { MgmtTarget } from '@/api/generated/model';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styled from 'styled-components';

dayjs.extend(relativeTime);

const { Text } = Typography;

const StatsRow = styled(Row)`
    margin-bottom: 24px;
`;

const StyledCard = styled(Card)`
    height: 100%;
    .ant-statistic-title {
        font-size: 13px;
    }
`;

interface OverviewTabProps {
    target: MgmtTarget | null | undefined;
    loading: boolean;
}

import { useTranslation } from 'react-i18next';
// ...

const OverviewTab: React.FC<OverviewTabProps> = ({ target, loading }) => {
    const { t } = useTranslation('targets');
    if (loading) {
        return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    if (!target) {
        return <Empty description={t('detail.notFound')} />;
    }

    const isOnline = !target.pollStatus?.overdue;

    return (
        <>
            <StatsRow gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                    <StyledCard>
                        <Statistic
                            title={t('overview.status')}
                            value={isOnline ? t('status.online') : t('status.offline')}
                            styles={{ content: { color: isOnline ? 'var(--ant-color-success)' : 'var(--ant-color-error)' } }}
                            prefix={isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        />
                    </StyledCard>
                </Col>
                <Col xs={12} sm={6}>
                    <StyledCard>
                        <Statistic
                            title={t('overview.updateStatus')}
                            value={target.updateStatus ? t(`common:status.${target.updateStatus}`, { defaultValue: target.updateStatus }) : t('status.unknown')}
                            prefix={<DesktopOutlined />}
                        />
                    </StyledCard>
                </Col>
                <Col xs={12} sm={6}>
                    <StyledCard>
                        <Statistic
                            title={t('overview.lastPoll')}
                            value={
                                target.pollStatus?.lastRequestAt
                                    ? dayjs(target.pollStatus.lastRequestAt).fromNow()
                                    : t('overview.never')
                            }
                            prefix={<ClockCircleOutlined />}
                        />
                    </StyledCard>
                </Col>
                <Col xs={12} sm={6}>
                    <StyledCard>
                        <Statistic
                            title={t('overview.nextPoll')}
                            value={
                                target.pollStatus?.nextExpectedRequestAt
                                    ? dayjs(target.pollStatus.nextExpectedRequestAt).fromNow()
                                    : '-'
                            }
                            prefix={<ClockCircleOutlined />}
                        />
                    </StyledCard>
                </Col>
            </StatsRow>

            <Descriptions
                bordered
                column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                size="middle"
            >
                <Descriptions.Item label={t('table.controllerId')}>
                    <Text strong copyable>
                        {target.controllerId}
                    </Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('table.name')}>
                    {target.name || <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label={t('form.description')}>
                    {target.description || <Text type="secondary">{t('overview.noDescription')}</Text>}
                </Descriptions.Item>
                <Descriptions.Item label={t('overview.address')}>
                    {target.address || <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label={t('overview.securityToken')}>
                    {target.securityToken ? (
                        <Text code copyable>
                            {target.securityToken}
                        </Text>
                    ) : (
                        <Text type="secondary">-</Text>
                    )}
                </Descriptions.Item>
                <Descriptions.Item label={t('overview.created')}>
                    {target.createdAt ? (
                        <>
                            {dayjs(target.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            <Tag style={{ marginLeft: 8 }}>{target.createdBy}</Tag>
                        </>
                    ) : (
                        <Text type="secondary">-</Text>
                    )}
                </Descriptions.Item>
                <Descriptions.Item label={t('overview.lastModified')}>
                    {target.lastModifiedAt ? (
                        <>
                            {dayjs(target.lastModifiedAt).format('YYYY-MM-DD HH:mm:ss')}
                            <Tag style={{ marginLeft: 8 }}>{target.lastModifiedBy}</Tag>
                        </>
                    ) : (
                        <Text type="secondary">-</Text>
                    )}
                </Descriptions.Item>
                <Descriptions.Item label={t('overview.requestAttributes')}>
                    <Tag color={target.requestAttributes ? 'blue' : 'default'}>
                        {target.requestAttributes ? t('overview.requested') : t('overview.notRequested')}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('overview.targetType')}>
                    {target.targetType ? (
                        <Tag color="purple">{target.targetType}</Tag>
                    ) : (
                        <Text type="secondary">-</Text>
                    )}
                </Descriptions.Item>
            </Descriptions>
        </>
    );
};

export default OverviewTab;
