import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';

interface FailureChartProps {
    data: any[];
}

export const FailureChart: React.FC<FailureChartProps> = ({ data }) => {
    return (
        <Card title="Failure Analysis (24h)" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="timeout" stackId="a" fill="#ff4d4f" name="Timeout" />
                    <Bar dataKey="installError" stackId="a" fill="#ffa940" name="Install Error" />
                    <Bar dataKey="networkError" stackId="a" fill="#ffec3d" name="Network Error" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
};
