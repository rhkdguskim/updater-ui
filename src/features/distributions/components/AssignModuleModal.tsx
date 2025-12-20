import React, { useState } from 'react';
import { Modal, Table, message } from 'antd';
import type { TableProps } from 'antd';
import { useGetSoftwareModules } from '@/api/generated/software-modules/software-modules';
import type { MgmtSoftwareModule } from '@/api/generated/model';
import DistributionSearchBar from './DistributionSearchBar';

interface AssignModuleModalProps {
    visible: boolean;
    onCancel: () => void;
    onAssign: (moduleIds: number[]) => void;
    isAssigning: boolean;
    excludedModuleIds?: number[];
}

import { useTranslation } from 'react-i18next';

const AssignModuleModal: React.FC<AssignModuleModalProps> = ({
    visible,
    onCancel,
    onAssign,
    isAssigning,
    excludedModuleIds = [],
}) => {
    const { t } = useTranslation('distributions');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const offset = (pagination.current - 1) * pagination.pageSize;

    const { data: modulesData, isLoading } = useGetSoftwareModules({
        offset,
        limit: pagination.pageSize,
        q: searchQuery || undefined,
    });

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleOk = () => {
        if (selectedRowKeys.length === 0) {
            message.warning(t('detail.selectModuleWarning'));
            return;
        }
        onAssign(selectedRowKeys as number[]);
        setSelectedRowKeys([]);
    };

    const handleCancel = () => {
        setSelectedRowKeys([]);
        onCancel();
    };

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record: MgmtSoftwareModule) => ({
            disabled: excludedModuleIds.includes(record.id),
        }),
    };

    const columns: TableProps<MgmtSoftwareModule>['columns'] = [
        {
            title: t('list.columns.name'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('list.columns.version'),
            dataIndex: 'version',
            key: 'version',
        },
        {
            title: t('list.columns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
        },
        {
            title: t('list.columns.vendor'),
            dataIndex: 'vendor',
            key: 'vendor',
        },
    ];

    return (
        <Modal
            title={t('detail.assignModuleTitle')}
            open={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={isAssigning}
            width={800}
            destroyOnHidden
        >
            <DistributionSearchBar
                type="module"
                onSearch={handleSearch}
                onRefresh={() => { }}
                canAdd={false}
            />
            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={modulesData?.content || []}
                rowKey="id"
                pagination={{
                    ...pagination,
                    total: modulesData?.total || 0,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
                }}
                loading={isLoading}
                size="small"
                style={{ marginTop: 16 }}
            />
        </Modal>
    );
};

export default AssignModuleModal;
