import React from 'react';
import { Card, Typography, Button, Flex, Skeleton, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import {
    AppstoreOutlined,
    CodeOutlined,
    TagsOutlined,
    BlockOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import { useGetSoftwareModules } from '@/api/generated/software-modules/software-modules';
import { useGetDistributionSetTags } from '@/api/generated/distribution-set-tags/distribution-set-tags';
import { useGetDistributionSetTypes } from '@/api/generated/distribution-set-types/distribution-set-types';
import { AirportSlideList } from '@/components/common';
import type { MgmtDistributionSet, MgmtSoftwareModule } from '@/api/generated/model';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

// Animations
const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: calc(100vh - 120px);
    min-height: 500px;
    overflow: hidden;
    animation: ${fadeInUp} 0.5s ease-out;
`;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    flex-shrink: 0;
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

const TopRow = styled.div`
    display: flex;
    gap: 12px;
    flex: 0 0 auto;
    height: 200px;
    min-height: 200px;
`;

const BottomRow = styled.div`
    display: flex;
    gap: 12px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

const KPIGridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex: 0 0 400px;
    height: 100%;
`;

const ChartsContainer = styled.div`
    display: flex;
    gap: 12px;
    flex: 1;
    min-width: 0;
`;

const StatsCard = styled(Card) <{ $accentColor?: string; $delay?: number; $pulse?: boolean }>`
    border: none;
    border-radius: 12px;
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
    height: 100%;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: ${props => props.$accentColor || 'var(--gradient-primary)'};
        ${props => props.$pulse && css`animation: ${pulse} 2s ease-in-out infinite;`}
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .dark-mode & {
        background: rgba(30, 41, 59, 0.9);
    }
    
    .ant-card-body {
        padding: 12px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
`;

const ChartCard = styled(Card) <{ $delay?: number }>`
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    height: 100%;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    
    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        padding: 8px 12px;
        min-height: auto;
    }
    
    .ant-card-head-title {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        padding: 4px 0;
    }
    
    .ant-card-body {
        flex: 1;
        padding: 8px 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
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

const ListCard = styled(Card) <{ $delay?: number }>`
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => (props.$delay || 0) * 0.1}s;
    animation-fill-mode: both;
    height: 100%;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    
    .ant-card-head {
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        padding: 8px 12px;
        min-height: auto;
    }
    
    .ant-card-head-title {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        padding: 4px 0;
    }
    
    .ant-card-body {
        flex: 1;
        padding: 8px 12px;
        overflow: hidden;
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
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 4px;
`;

const LiveIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    
    &::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6366f1;
        animation: ${pulse} 1.5s ease-in-out infinite;
    }
`;

const ChartLegendItem = styled(Flex)`
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
`;

const COLORS = {
    sets: '#6366f1',
    modules: '#3b82f6',
    tags: '#10b981',
    types: '#f59e0b',
};

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DistributionsOverview: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const navigate = useNavigate();

    const { data: setsData, isLoading: setsLoading, refetch: refetchSets, dataUpdatedAt } = useGetDistributionSets({ limit: 500 });
    const { data: modulesData, isLoading: modulesLoading, refetch: refetchModules } = useGetSoftwareModules({ limit: 500 });
    const { data: tagsData, isLoading: tagsLoading, refetch: refetchTags } = useGetDistributionSetTags({ limit: 100 });
    const { data: typesData, isLoading: typesLoading, refetch: refetchTypes } = useGetDistributionSetTypes({ limit: 100 });

    const isLoading = setsLoading || modulesLoading || tagsLoading || typesLoading;
    const refetch = () => { refetchSets(); refetchModules(); refetchTags(); refetchTypes(); };
    const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).fromNow() : '-';

    const setsCount = setsData?.total ?? 0;
    const modulesCount = modulesData?.total ?? 0;
    const tagsCount = tagsData?.total ?? 0;
    const typesCount = typesData?.total ?? 0;

    // Distribution by type for pie chart
    const typeDistribution = React.useMemo(() => {
        const counts: Record<string, number> = {};
        setsData?.content?.forEach(ds => {
            const typeName = ds.typeName || t('common:status.unknown');
            counts[typeName] = (counts[typeName] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            color: PIE_COLORS[index % PIE_COLORS.length],
        }));
    }, [setsData, t]);

    // Completeness distribution
    const completenessData = React.useMemo(() => {
        const complete = setsData?.content?.filter(ds => ds.complete).length ?? 0;
        const incomplete = (setsData?.content?.length ?? 0) - complete;
        return [
            { name: t('status.complete', 'Complete'), value: complete, color: COLORS.tags },
            { name: t('status.incomplete', 'Incomplete'), value: incomplete, color: '#f59e0b' },
        ].filter(d => d.value > 0);
    }, [setsData, t]);

    // Recent distribution sets
    const recentSets = React.useMemo(() => {
        return [...(setsData?.content || [])]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 10);
    }, [setsData]);

    // Recent software modules
    const recentModules = React.useMemo(() => {
        return [...(modulesData?.content || [])]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 10);
    }, [modulesData]);

    // Custom Legend Renderer
    const renderCustomLegend = (data: { name: string; value: number; color: string }[]) => (
        <Flex vertical gap={4} style={{ marginTop: 8 }}>
            {data.map(entry => (
                <ChartLegendItem key={entry.name} align="center" justify="space-between">
                    <Flex align="center" gap={6}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.color }} />
                        <Text style={{ fontSize: 12 }}>{entry.name}</Text>
                    </Flex>
                    <Text strong style={{ fontSize: 13, color: entry.color }}>{entry.value}</Text>
                </ChartLegendItem>
            ))}
        </Flex>
    );

    return (
        <PageContainer>
            <PageHeader>
                <HeaderContent>
                    <GradientTitle level={3}>
                        {t('overview.title')}
                    </GradientTitle>
                    <Flex align="center" gap={12}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {t('overview.subtitle', 'Distribution sets and software modules overview')}
                        </Text>
                        <LiveIndicator>
                            {setsCount > 0 ? t('common:status.active', 'Active') : t('common:status.idle', 'Idle')}
                        </LiveIndicator>
                    </Flex>
                </HeaderContent>
                <Flex align="center" gap={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('common:updated', 'Updated')}: {lastUpdated}
                    </Text>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={refetch}
                        loading={isLoading}
                        size="small"
                    >
                        {t('common:actions.refresh')}
                    </Button>
                </Flex>
            </PageHeader>

            {/* Top Row: KPI Cards (4) + 2 Pie Charts */}
            <TopRow>
                {/* KPI Cards */}
                <KPIGridContainer>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                        $delay={1}
                        onClick={() => navigate('/distributions/sets')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <AppstoreOutlined style={{ fontSize: 24, color: COLORS.sets }} />
                                <BigNumber style={{ color: COLORS.sets }}>{setsCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.distributionSets')}
                                </Text>
                            </Flex>
                        )}
                    </StatsCard>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"
                        $delay={2}
                        onClick={() => navigate('/distributions/modules')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <CodeOutlined style={{ fontSize: 24, color: COLORS.modules }} />
                                <BigNumber style={{ color: COLORS.modules }}>{modulesCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.softwareModules')}
                                </Text>
                            </Flex>
                        )}
                    </StatsCard>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        $delay={3}
                        onClick={() => navigate('/distributions/sets')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <TagsOutlined style={{ fontSize: 24, color: COLORS.tags }} />
                                <BigNumber style={{ color: COLORS.tags }}>{tagsCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.tags')}
                                </Text>
                            </Flex>
                        )}
                    </StatsCard>
                    <StatsCard
                        $accentColor="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        $delay={4}
                        onClick={() => navigate('/distributions/sets')}
                    >
                        {isLoading ? <Skeleton.Avatar active size={40} /> : (
                            <Flex vertical align="center" gap={4}>
                                <BlockOutlined style={{ fontSize: 24, color: COLORS.types }} />
                                <BigNumber style={{ color: COLORS.types }}>{typesCount}</BigNumber>
                                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                                    {t('overview.types')}
                                </Text>
                            </Flex>
                        )}
                    </StatsCard>
                </KPIGridContainer>

                {/* Charts Container */}
                <ChartsContainer>
                    {/* Distribution by Type */}
                    <ChartCard
                        title={
                            <Flex align="center" gap={6}>
                                <BlockOutlined style={{ color: COLORS.sets, fontSize: 14 }} />
                                <span>{t('overview.distributionByType', 'By Type')}</span>
                            </Flex>
                        }
                        $delay={5}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                        ) : typeDistribution.length > 0 ? (
                            <Flex vertical style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height={100}>
                                    <PieChart>
                                        <Pie
                                            data={typeDistribution}
                                            innerRadius={28}
                                            outerRadius={42}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {typeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {renderCustomLegend(typeDistribution.slice(0, 3))}
                            </Flex>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>

                    {/* Completeness Chart */}
                    <ChartCard
                        title={
                            <Flex align="center" gap={6}>
                                <AppstoreOutlined style={{ color: COLORS.tags, fontSize: 14 }} />
                                <span>{t('overview.completeness', 'Completeness')}</span>
                            </Flex>
                        }
                        $delay={6}
                    >
                        {isLoading ? (
                            <Skeleton.Avatar active size={60} shape="circle" style={{ margin: '8px auto', display: 'block' }} />
                        ) : completenessData.length > 0 ? (
                            <Flex vertical style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height={100}>
                                    <PieChart>
                                        <Pie
                                            data={completenessData}
                                            innerRadius={28}
                                            outerRadius={42}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {completenessData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {renderCustomLegend(completenessData)}
                            </Flex>
                        ) : (
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Text type="secondary">{t('common:messages.noData')}</Text>
                            </Flex>
                        )}
                    </ChartCard>
                </ChartsContainer>
            </TopRow>

            {/* Bottom Row: Recent Sets + Recent Modules */}
            <BottomRow>
                {/* Recent Distribution Sets */}
                <ListCard
                    title={t('overview.recentSets', 'Recent Distribution Sets')}
                    $delay={7}
                >
                    {isLoading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                    ) : recentSets.length > 0 ? (
                        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <AirportSlideList
                                items={recentSets}
                                itemHeight={52}
                                visibleCount={5}
                                interval={3000}
                                fullHeight={true}
                                renderItem={(record: MgmtDistributionSet) => (
                                    <Flex
                                        key={record.id}
                                        align="center"
                                        justify="space-between"
                                        style={{
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            height: '100%',
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.01)',
                                            borderRadius: 6,
                                        }}
                                        onClick={() => navigate(`/distributions/sets/${record.id}`)}
                                    >
                                        <Flex align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 6,
                                                background: `${COLORS.sets}15`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <AppstoreOutlined style={{ fontSize: 16, color: COLORS.sets }} />
                                            </div>
                                            <Flex vertical gap={0} style={{ minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {record.name}
                                                </Text>
                                                <Flex gap={4} align="center">
                                                    <Tag color="blue" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>v{record.version}</Tag>
                                                    <Text type="secondary" style={{ fontSize: 10 }}>{record.typeName}</Text>
                                                </Flex>
                                            </Flex>
                                        </Flex>
                                        <Tag color={record.complete ? 'green' : 'orange'} style={{ margin: 0, fontSize: 10 }}>
                                            {record.complete ? t('status.complete') : t('status.incomplete')}
                                        </Tag>
                                    </Flex>
                                )}
                            />
                        </div>
                    ) : (
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Text type="secondary">{t('common:messages.noData')}</Text>
                        </Flex>
                    )}
                </ListCard>

                {/* Recent Software Modules */}
                <ListCard
                    title={t('overview.recentModules', 'Recent Software Modules')}
                    $delay={8}
                >
                    {isLoading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                    ) : recentModules.length > 0 ? (
                        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <AirportSlideList
                                items={recentModules}
                                itemHeight={52}
                                visibleCount={5}
                                interval={3500}
                                fullHeight={true}
                                renderItem={(record: MgmtSoftwareModule) => (
                                    <Flex
                                        key={record.id}
                                        align="center"
                                        justify="space-between"
                                        style={{
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            height: '100%',
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.01)',
                                            borderRadius: 6,
                                        }}
                                        onClick={() => navigate(`/distributions/modules/${record.id}`)}
                                    >
                                        <Flex align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 6,
                                                background: `${COLORS.modules}15`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <CodeOutlined style={{ fontSize: 16, color: COLORS.modules }} />
                                            </div>
                                            <Flex vertical gap={0} style={{ minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {record.name}
                                                </Text>
                                                <Flex gap={4} align="center">
                                                    <Tag color="cyan" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>v{record.version}</Tag>
                                                    <Text type="secondary" style={{ fontSize: 10 }}>{record.typeName}</Text>
                                                </Flex>
                                            </Flex>
                                        </Flex>
                                        <Text type="secondary" style={{ fontSize: 10 }}>
                                            {record.createdAt ? dayjs(record.createdAt).format('MM-DD HH:mm') : '-'}
                                        </Text>
                                    </Flex>
                                )}
                            />
                        </div>
                    ) : (
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Text type="secondary">{t('common:messages.noData')}</Text>
                        </Flex>
                    )}
                </ListCard>
            </BottomRow>
        </PageContainer>
    );
};

export default DistributionsOverview;
