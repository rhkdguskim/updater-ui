import React from 'react';
import { Card, Empty } from 'antd';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import styled from 'styled-components';
import type { MgmtTarget } from '@/api/generated/model';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface VersionTreemapProps {
    targets: MgmtTarget[];
    loading?: boolean;
}

const StyledCard = styled(Card)`
    height: 100%;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const COLORS = ['#8889DD', '#9597E4', '#8DC77B', '#A5D297', '#E2CF45', '#F8C12D'];

export const VersionTreemap: React.FC<VersionTreemapProps> = ({ targets, loading }) => {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();

    if (loading) return <StyledCard loading />;

    // Group by updateStatus
    const processData = () => {
        const groups: Record<string, number> = {};
        targets.forEach(t => {
            const status = t.updateStatus || 'unknown';
            groups[status] = (groups[status] || 0) + 1;
        });

        // Format for Treemap
        return Object.entries(groups).map(([status, size]) => ({
            name: t(`status.${status}`, status),
            status,
            size
        }));
    };

    const data = processData();

    const CustomizedContent = (props: any) => {
        const { x, y, width, height, index, name, value } = props;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: COLORS[index % COLORS.length],
                        stroke: '#fff',
                        strokeWidth: 2,
                        strokeOpacity: 1,
                    }}
                />
                {width > 50 && height > 30 ? (
                    <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={14}
                        dominantBaseline="middle"
                    >
                        {name} ({value})
                    </text>
                ) : null}
            </g>
        );
    };

    return (
        <StyledCard title={t('charts.versionMap', 'Status Distribution')}>
            {targets.length === 0 ? (
                <Empty description={t('empty.noDevices', 'No devices')} />
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                        data={data}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomizedContent />}
                        onClick={(node: any) => {
                            if (node && node.status) {
                                navigate(`/targets?q=updateStatus==${node.status}`);
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <Tooltip />
                    </Treemap>
                </ResponsiveContainer>
            )}
        </StyledCard>
    );
};
