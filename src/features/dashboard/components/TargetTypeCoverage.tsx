import React from 'react';
import { Card, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useGetTargets } from '@/api/generated/targets/targets';
import type { MgmtTarget } from '@/api/generated/model';


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

export const TargetTypeCoverage: React.FC = () => {
    const { t } = useTranslation('dashboard');
    // const navigate = useNavigate(); // Unused for now

    // In a real scenario, we might want to aggregate this on the server side or fetch all targets.
    // fetch 1000 to get a good distribution estimate
    const { data: targetsData, isLoading } = useGetTargets({ limit: 1000 });

    const processData = () => {
        if (!targetsData?.content) return [];

        const typeCounts: Record<string, number> = {};

        targetsData.content.forEach((target: MgmtTarget) => {
            const type = target.controllerId || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const total = targetsData.total || 1;

        const chartData = Object.keys(typeCounts).map(type => ({
            name: type,
            count: typeCounts[type],
            percentage: Math.round((typeCounts[type] / total) * 100)
        })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5

        return chartData;
    };

    const data = processData();
    const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];

    return (
        <StyledCard loading={isLoading} title={t('targetTypeCoverage.title')}>
            {data.length === 0 ? (
                <Empty description={t('targetTypeCoverage.noTypes')} />
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        barSize={20}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            formatter={(value: any) => [`${value} Targets`, 'Count']}
                            contentStyle={{ borderRadius: '8px' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </StyledCard>
    );
};
