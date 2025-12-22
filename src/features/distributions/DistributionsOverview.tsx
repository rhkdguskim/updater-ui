import React from 'react';
import { Card, Row, Col, Typography, Statistic, Button, Flex, Skeleton, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import {
    AppstoreOutlined,
    CodeOutlined,
    TagsOutlined,
    BlockOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import { useGetSoftwareModules } from '@/api/generated/software-modules/software-modules';
import { useGetDistributionSetTags } from '@/api/generated/distribution-set-tags/distribution-set-tags';
import { useGetDistributionSetTypes } from '@/api/generated/distribution-set-types/distribution-set-types';
import type { MgmtDistributionSet } from '@/api/generated/model';

const { Title, Text } = Typography;

// Animations
const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
`;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const GradientTitle = styled(Title)`
    && {
        margin: 0;
        background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .dark-mode & {
        background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        background-clip: text;
    }
`;

const StatsCard = styled(Card) <{ $accentColor?: string; $delay?: number }>`
    border: none;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    cursor: pointer;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: ${props => props.$accentColor || 'var(--gradient-primary)'};
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
    }
`;

const ChartCard = styled(Card) <{ $delay?: number }>`
    border: none;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    
    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
    
    .ant-card-head-title {
        font-size: 15px;
        font-weight: 600;
        color: #334155;
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
        
        .ant-card-head {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .ant-card-head-title {
            color: #e2e8f0;
        }
    }
`;

const BigNumber = styled.div`
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 8px;
`;

const COLORS = {
    sets: '#6366f1',
    modules: '#3b82f6',
    tags: '#10b981',
    types: '#f59e0b',
};

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DistributionsOverview: React.FC = () => {
    const { t } = useTranslation('distributions');
    const navigate = useNavigate();

    const { data: setsData, isLoading: setsLoading, refetch: refetchSets } = useGetDistributionSets({ limit: 500 });
    const { data: modulesData, isLoading: modulesLoading, refetch: refetchModules } = useGetSoftwareModules({ limit: 500 });
    const { data: tagsData, isLoading: tagsLoading, refetch: refetchTags } = useGetDistributionSetTags({ limit: 100 });
    const { data: typesData, isLoading: typesLoading, refetch: refetchTypes } = useGetDistributionSetTypes({ limit: 100 });

    const isLoading = setsLoading || modulesLoading || tagsLoading || typesLoading;
    const refetch = () => { refetchSets(); refetchModules(); refetchTags(); refetchTypes(); };

    const setsCount = setsData?.total ?? 0;
    const modulesCount = modulesData?.total ?? 0;
    const tagsCount = tagsData?.total ?? 0;
    const typesCount = typesData?.total ?? 0;

    // Distribution by type for pie chart
    const typeDistribution = React.useMemo(() => {
        const counts: Record<string, number> = {};
        setsData?.content?.forEach(ds => {
            const typeName = ds.typeName || 'Unknown';
            counts[typeName] = (counts[typeName] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            color: PIE_COLORS[index % PIE_COLORS.length],
        }));
    }, [setsData]);

    // Recent distribution sets table
    const recentSets = React.useMemo(() => {
        return [...(setsData?.content || [])]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 8);
    }, [setsData]);

    const columns = [
        {
            title: t('table.name'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: t('table.version'),
            dataIndex: 'version',
            key: 'version',
            width: 100,
            render: (version: string) => <Tag color="blue">v{version}</Tag>,
        },
        {
            title: t('table.type'),
            dataIndex: 'typeName',
            key: 'typeName',
            width: 120,
            render: (type: string) => type || <Text type="secondary">-</Text>,
        },
        {
            title: t('table.complete'),
            key: 'complete',
            width: 100,
            render: (_: unknown, record: MgmtDistributionSet) => (
                <Tag color={record.complete ? 'green' : 'orange'}>
                    {record.complete ? t('status.complete') : t('status.incomplete')}
                </Tag>
            ),
        },
    ];

    return (
        <PageContainer>
            <PageHeader>
                <HeaderContent>
                    <GradientTitle level={2}>
                        {t('overview.title')}
                    </GradientTitle>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        {t('overview.subtitle', 'Distribution sets and software modules overview')}
                    </Text>
                </HeaderContent>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={refetch}
                    loading={isLoading}
                >
                    {t('actions.refresh')}
                </Button>
            </PageHeader>

            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                        $delay={1}
                        onClick={() => navigate('/distributions/sets')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('overview.distributionSets')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.sets }}>{setsCount}</BigNumber>
                                </div>
                                <AppstoreOutlined style={{ fontSize: 40, color: COLORS.sets, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"
                        $delay={2}
                        onClick={() => navigate('/distributions/modules')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('overview.softwareModules')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.modules }}>{modulesCount}</BigNumber>
                                </div>
                                <CodeOutlined style={{ fontSize: 40, color: COLORS.modules, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        $delay={3}
                        onClick={() => navigate('/distributions/sets')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('overview.tags')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.tags }}>{tagsCount}</BigNumber>
                                </div>
                                <TagsOutlined style={{ fontSize: 40, color: COLORS.tags, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        $delay={4}
                        onClick={() => navigate('/distributions/sets')}
                    >
                        {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                        {t('overview.types')}
                                    </Text>
                                    <BigNumber style={{ color: COLORS.types }}>{typesCount}</BigNumber>
                                </div>
                                <BlockOutlined style={{ fontSize: 40, color: COLORS.types, opacity: 0.3 }} />
                            </Flex>
                        )}
                    </StatsCard>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]} style={{ flex: 1, minHeight: 0 }}>
                <Col xs={24} lg={8} style={{ display: 'flex' }}>
                    <ChartCard
                        style={{ flex: 1 }}
                        title={
                            <Flex justify="space-between" align="center">
                                <span>{t('overview.distributionByType', 'Distribution by Type')}</span>
                                <Statistic
                                    value={typesCount}
                                    suffix={t('overview.typesLabel', 'types')}
                                    styles={{ content: { fontSize: 14, fontWeight: 600 } }}
                                />
                            </Flex>
                        }
                        $delay={5}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={150} shape="circle" style={{ margin: '20px auto', display: 'block' }} />
                        ) : typeDistribution.length > 0 ? (
                            <div style={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={typeDistribution}
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {typeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.sets }}>{setsCount}</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>{t('overview.total', 'Total')}</div>
                                </div>
                                <Flex justify="center" wrap gap={12} style={{ marginTop: 8 }}>
                                    {typeDistribution.slice(0, 4).map((entry, index) => (
                                        <Flex key={index} align="center" gap={6}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color }} />
                                            <Text style={{ fontSize: 11 }}>{entry.name} ({entry.value})</Text>
                                        </Flex>
                                    ))}
                                </Flex>
                            </div>
                        ) : (
                            <Flex justify="center" align="center" style={{ height: 200 }}>
                                <Text type="secondary">{t('messages.noData', { ns: 'common' })}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </Col>
                <Col xs={24} lg={16} style={{ display: 'flex' }}>
                    <ChartCard
                        title={t('overview.recentSets', 'Recent Distribution Sets')}
                        $delay={6}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                        styles={{ body: { flex: 1, overflow: 'auto', padding: '12px' } }}
                    >
                        <Table
                            dataSource={recentSets}
                            columns={columns}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            loading={isLoading}
                            locale={{ emptyText: t('messages.noData', { ns: 'common' }) }}
                            onRow={(record) => ({
                                onClick: () => navigate(`/distributions/sets/${record.id}`),
                                style: { cursor: 'pointer' }
                            })}
                        />
                    </ChartCard>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default DistributionsOverview;
