import React from 'react';
import { Card, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import styled from 'styled-components';
import type { MgmtAction } from '@/api/generated/model';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface FailureChartProps {
    actions: MgmtAction[];
    loading?: boolean;
}

const StyledCard = styled(Card)`
    height: 100%;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

export const FailureChart: React.FC<FailureChartProps> = ({ actions, loading }) => {
    const { t } = useTranslation('dashboard');

    if (loading) return <StyledCard loading />;

    const processData = () => {
        const now = dayjs();
        const dataMap = new Map();

        // Initialize last 24h keys
        for (let i = 23; i >= 0; i--) {
            const hour = now.subtract(i, 'hour').format('HH:00');
            dataMap.set(hour, { time: hour, error: 0, finished: 0 });
        }

        actions.forEach(action => {
            if (!action.createdAt) return;
            const actionTime = dayjs(action.createdAt);
            if (actionTime.isAfter(now.subtract(24, 'hour'))) {
                const key = actionTime.format('HH:00');
                if (dataMap.has(key)) {
                    const entry = dataMap.get(key);
                    if (action.status === 'error' || action.status === 'canceled') {
                        entry.error += 1;
                    } else if (action.status === 'finished') {
                        entry.finished += 1;
                    }
                }
            }
        });

        return Array.from(dataMap.values());
    };

    const data = processData();

    return (
        <StyledCard title={t('charts.failureAnalysis', 'Failure Analysis')}>
            {actions.length === 0 ? (
                <Empty description={t('empty.noActions', 'No data')} />
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        />
                        <Legend />
                        <Bar dataKey="finished" stackId="a" fill="#52c41a" name={t('charts.finished', 'Finished')} radius={[0, 0, 4, 4]} />
                        <Bar dataKey="error" stackId="a" fill="#ff4d4f" name={t('charts.error', 'Error')} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </StyledCard>
    );
};
