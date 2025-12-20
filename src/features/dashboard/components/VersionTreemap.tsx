import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from 'antd';

interface VersionTreemapProps {
    data: any[];
}

const CustomizedContent: React.FC<any> = (props) => {
    const { depth, x, y, width, height, index, payload, colors, name } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: payload?.fill || colors?.[index % (colors?.length || 1)] || '#8884d8',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {width > 50 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={14}
                >
                    {name}
                </text>
            )}
        </g>
    );
};

export const VersionTreemap: React.FC<VersionTreemapProps> = ({ data }) => {
    return (
        <Card title="Firmware Version Map" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
                <Treemap
                    data={data}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={<CustomizedContent />}
                >
                    <Tooltip />
                </Treemap>
            </ResponsiveContainer>
        </Card>
    );
};
