import React, { useState, useRef, useLayoutEffect } from 'react';
import { Table, Tag, Tooltip, Space, Button, message, Modal, Typography } from 'antd';
import type { TableProps } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    useGetSoftwareModules,
    useDeleteSoftwareModule,
} from '@/api/generated/software-modules/software-modules';
import type { MgmtSoftwareModule } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import DistributionSearchBar from './components/DistributionSearchBar';
import CreateSoftwareModuleModal from './components/CreateSoftwareModuleModal';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { keepPreviousData } from '@tanstack/react-query';
import { StandardListLayout } from '@/components/layout/StandardListLayout';
import { useServerTable } from '@/hooks/useServerTable';
import { DataView } from '@/components/patterns';

const { Text } = Typography;

const SoftwareModuleList: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    const {
        pagination,
        offset,
        sort,
        searchQuery,
        handleTableChange,
        handleSearch,
    } = useServerTable<MgmtSoftwareModule>({ syncToUrl: true });

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const [tableScrollY, setTableScrollY] = useState<number | undefined>(undefined);

    useLayoutEffect(() => {
        if (!tableContainerRef.current) return;
        const element = tableContainerRef.current;
        const updateHeight = () => {
            const height = element.getBoundingClientRect().height;
            setTableScrollY(Math.max(240, Math.floor(height - 56)));
        };
        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const {
        data,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetSoftwareModules(
        {
            offset,
            limit: pagination.pageSize,
            sort: sort || undefined,
            q: searchQuery || undefined,
        },
        {
            query: {
                placeholderData: keepPreviousData,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
            },
        }
    );

    const deleteMutation = useDeleteSoftwareModule({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.deleteModuleSuccess'));
                refetch();
                setSelectedModuleIds(ids => ids.filter(id => id !== deleteMutation.variables?.softwareModuleId));
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.deleteModuleError'));
            },
        },
    });

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: t('messages.deleteModuleConfirmTitle'),
            content: t('messages.deleteModuleConfirmDesc'),
            okText: t('actions.delete'),
            okType: 'danger',
            cancelText: t('common:actions.cancel'),
            onOk: () => deleteMutation.mutate({ softwareModuleId: id }),
        });
    };

    const handleBulkDelete = () => {
        Modal.confirm({
            title: t('messages.bulkDeleteModuleConfirmTitle', { count: selectedModuleIds.length }),
            content: t('messages.bulkDeleteModuleConfirmDesc'),
            okText: t('actions.delete'),
            okType: 'danger',
            cancelText: t('common:actions.cancel'),
            onOk: async () => {
                for (const id of selectedModuleIds) {
                    await deleteMutation.mutateAsync({ softwareModuleId: id }).catch(() => { });
                }
                setSelectedModuleIds([]);
                refetch();
                message.success(t('messages.bulkDeleteModuleSuccess'));
            },
        });
    };

    const columns: TableProps<MgmtSoftwareModule>['columns'] = [
        {
            title: t('list.columns.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            render: (text, record) => (
                <a onClick={() => navigate(`/distributions/modules/${record.id}`)}>{text}</a>
            ),
        },
        {
            title: t('list.columns.version'),
            dataIndex: 'version',
            key: 'version',
            sorter: true,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: t('list.columns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
            render: (text) => <Tag color="cyan">{text}</Tag>,
        },
        {
            title: t('list.columns.vendor'),
            dataIndex: 'vendor',
            key: 'vendor',
        },
        {
            title: t('list.columns.description'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: '20%',
        },
        {
            title: t('list.columns.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            sorter: true,
            width: 180,
            render: (val: number) => (val ? format(val, 'yyyy-MM-dd HH:mm') : '-'),
        },
        {
            title: t('list.columns.actions'),
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title={t('actions.viewDetails')}>
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/distributions/modules/${record.id}`)}
                        />
                    </Tooltip>
                    {isAdmin && (
                        <Tooltip title={t('actions.delete')}>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(record.id)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <StandardListLayout
            title={t('moduleList.title')}
            searchBar={
                <DistributionSearchBar
                    type="module"
                    onSearch={handleSearch}
                    onRefresh={refetch}
                    onAdd={() => setIsCreateModalVisible(true)}
                    canAdd={isAdmin}
                    loading={isLoading || isFetching}
                />
            }
            bulkActionBar={selectedModuleIds.length > 0 && isAdmin && (
                <Space wrap>
                    <Text strong>
                        {t('moduleList.selectedCount', { count: selectedModuleIds.length })}
                    </Text>
                    <Button danger onClick={handleBulkDelete} icon={<DeleteOutlined />}>
                        {t('actions.deleteSelected')}
                    </Button>
                </Space>
            )}
        >
            <DataView
                loading={isLoading || isFetching}
                error={error as Error}
                isEmpty={data?.content?.length === 0}
                emptyText={t('moduleList.empty')}
            >
                <div ref={tableContainerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Table
                        columns={columns}
                        dataSource={data?.content || []}
                        rowKey="id"
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: data?.total || 0,
                            showSizeChanger: true,
                            position: ['topRight'],
                        }}
                        loading={isLoading || isFetching}
                        onChange={handleTableChange}
                        rowSelection={{
                            selectedRowKeys: selectedModuleIds,
                            onChange: (keys) => setSelectedModuleIds(keys as number[]),
                        }}
                        scroll={{ x: 1000, y: tableScrollY }}
                        size="small"
                    />
                </div>
            </DataView>
            <CreateSoftwareModuleModal
                visible={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                onSuccess={() => {
                    setIsCreateModalVisible(false);
                    refetch();
                }}
            />
        </StandardListLayout>
    );
};

export default SoftwareModuleList;
