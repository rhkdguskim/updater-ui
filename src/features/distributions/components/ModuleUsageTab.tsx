import React, { useState } from 'react';
import { useGetDistributionSets } from '@/api/generated/distribution-sets/distribution-sets';
import { Table, Tag, Typography, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const { Text } = Typography;

interface ModuleUsageTabProps {
    softwareModuleId: number;
}

const ModuleUsageTab: React.FC<ModuleUsageTabProps> = ({ softwareModuleId }) => {
    const { t } = useTranslation('distributions');
    const navigate = useNavigate();
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const offset = (pagination.current - 1) * pagination.pageSize;

    // HawkBit RQL: assignedSM.id=={id}
    const { data, isLoading } = useGetDistributionSets({
        offset,
        limit: pagination.pageSize,
        q: `assignedSM.id==${softwareModuleId}`
    });

    const columns = [
        {
            title: t('detail.usageColumns.name'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <a onClick={() => navigate(`/distributions/sets/${record.id}`)}>{text}</a>
            )
        },
        {
            title: t('detail.usageColumns.version'),
            dataIndex: 'version',
            key: 'version',
            render: (v: string) => <Tag color="blue">{v}</Tag>
        },
        {
            title: t('detail.usageColumns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
            render: (v: string) => <Tag color="cyan">{v}</Tag>
        },
        {
            title: t('detail.usageColumns.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            render: (val: number) => val ? format(val, 'yyyy-MM-dd HH:mm:ss') : '-'
        }
    ];

    if (!data?.total && !isLoading) {
        return <Empty description={t('detail.usageEmpty')} />;
    }

    return (
        <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: 16 }}>
                <Text strong>{t('detail.usageTitle')}</Text>
            </div>

            <Table
                dataSource={data?.content || []}
                rowKey="id"
                loading={isLoading}
                columns={columns}
                pagination={{
                    ...pagination,
                    total: data?.total || 0,
                    showSizeChanger: true,
                }}
                onChange={(p) => setPagination({ current: p.current || 1, pageSize: p.pageSize || 10 })}
                size="small"
            />
        </div>
    );
};

export default ModuleUsageTab;
