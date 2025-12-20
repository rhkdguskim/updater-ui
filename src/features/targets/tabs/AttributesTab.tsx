import React from 'react';
import { Table, Typography, Skeleton, Empty, Tag } from 'antd';
import type { TableProps } from 'antd';
import type { MgmtTargetAttributes } from '@/api/generated/model';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface AttributesTabProps {
    data: MgmtTargetAttributes | null | undefined;
    loading: boolean;
}

interface AttributeRow {
    key: string;
    value: string;
    category?: string;
}

const parseAttributes = (attributes: MgmtTargetAttributes): AttributeRow[] => {
    const rows: AttributeRow[] = [];

    Object.entries(attributes).forEach(([category, values]) => {
        if (typeof values === 'object' && values !== null) {
            Object.entries(values).forEach(([key, value]) => {
                rows.push({
                    key: `${category}.${key}`,
                    value: String(value),
                    category,
                });
            });
        } else {
            rows.push({
                key: category,
                value: String(values),
            });
        }
    });

    return rows;
};

const AttributesTab: React.FC<AttributesTabProps> = ({ data, loading }) => {
    const { t } = useTranslation('targets');

    if (loading) {
        return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    if (!data || Object.keys(data).length === 0) {
        return <Empty description={t('attributes.noAttributes')} />;
    }

    const rows = parseAttributes(data);

    const columns: TableProps<AttributeRow>['columns'] = [
        {
            title: t('attributes.key'),
            dataIndex: 'key',
            key: 'key',
            render: (text: string) => <Text code>{text}</Text>,
        },
        {
            title: t('attributes.value'),
            dataIndex: 'value',
            key: 'value',
            render: (text: string) => (
                <Text copyable style={{ wordBreak: 'break-all' }}>
                    {text}
                </Text>
            ),
        },
        {
            title: t('attributes.category'),
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (category: string) =>
                category ? <Tag color="blue">{category}</Tag> : '-',
        },
    ];

    return (
        <Table<AttributeRow>
            columns={columns}
            dataSource={rows}
            rowKey="key"
            pagination={rows.length > 10 ? { pageSize: 10 } : false}
            size="middle"
        />
    );
};

export default AttributesTab;
