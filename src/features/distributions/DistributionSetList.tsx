import React, { useState, useCallback } from 'react';
import { Table, Card, Tag, Tooltip, Space, Button, message, Modal, Typography } from 'antd';
import type { TableProps } from 'antd';
import { EyeOutlined, DeleteOutlined, TagOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    useGetDistributionSets,
    useDeleteDistributionSet,
} from '@/api/generated/distribution-sets/distribution-sets';
import type { MgmtDistributionSet } from '@/api/generated/model';
import { useAuthStore } from '@/stores/useAuthStore';
import DistributionSearchBar from './components/DistributionSearchBar';
import CreateDistributionSetWizard from './components/CreateDistributionSetWizard';
import { format } from 'date-fns';
import { DistributionSetTagsCell } from './components/DistributionSetTagsCell';

import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import BulkManageSetTagsModal from './components/BulkManageSetTagsModal';

const { Title } = Typography;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
`;

const DistributionSetList: React.FC = () => {
    const { t } = useTranslation(['distributions', 'common']);
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const isAdmin = role === 'Admin';

    // Pagination & Sorting State
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
    const [sort, setSort] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

    // Bulk Action State
    const [selectedSetIds, setSelectedSetIds] = useState<number[]>([]);
    const [bulkTagsModalOpen, setBulkTagsModalOpen] = useState(false);

    // Calculate offset for API
    const offset = (pagination.current - 1) * pagination.pageSize;

    // API Query
    const {
        data,
        isLoading,
        refetch,
    } = useGetDistributionSets({
        offset,
        limit: pagination.pageSize,
        sort: sort || undefined,
        q: searchQuery || undefined,
    });

    // Delete Mutation
    const deleteMutation = useDeleteDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.deleteSetSuccess'));
                refetch();
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.deleteSetError'));
            },
        },
    });

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: t('messages.deleteSetConfirmTitle'),
            content: t('messages.deleteSetConfirmDesc'),
            okText: t('actions.delete'),
            okType: 'danger',
            cancelText: t('common:actions.cancel'),
            onOk: () => deleteMutation.mutate({ distributionSetId: id }),
        });
    };

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, []);

    const handleTableChange: TableProps<MgmtDistributionSet>['onChange'] = (
        newPagination,
        _,
        sorter
    ) => {
        setPagination((prev) => ({
            ...prev,
            current: newPagination.current || 1,
            pageSize: newPagination.pageSize || 20,
        }));

        if (Array.isArray(sorter)) {
            // Handle multiple sorters if needed
        } else if (sorter.field && sorter.order) {
            const field = sorter.field as string;
            const order = sorter.order === 'ascend' ? 'ASC' : 'DESC';
            setSort(`${field}:${order}`);
        } else {
            setSort('');
        }
    };

    const columns: TableProps<MgmtDistributionSet>['columns'] = [
        {
            title: t('list.columns.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            render: (text, record) => (
                <a onClick={() => navigate(`/distributions/sets/${record.id}`)}>{text}</a>
            ),
        },
        {
            title: t('list.columns.version'),
            dataIndex: 'version',
            key: 'version',
            sorter: true,
        },
        {
            title: t('list.columns.type'),
            dataIndex: 'typeName',
            key: 'typeName',
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: t('list.columns.description'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: t('list.columns.completeness'),
            dataIndex: 'complete',
            key: 'complete',
            render: (complete: boolean) => (
                <Tag color={complete ? 'success' : 'warning'}>
                    {complete ? t('tags.complete') : t('tags.incomplete')}
                </Tag>
            ),
        },
        {
            title: t('list.columns.tags'),
            key: 'tags',
            width: 200,
            render: (_, record) => <DistributionSetTagsCell distributionSetId={record.id} />,
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
                            onClick={() => navigate(`/distributions/sets/${record.id}`)}
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
        <PageContainer>
            <HeaderRow>
                <Title level={2} style={{ margin: 0 }}>
                    {t('list.title')}
                </Title>
            </HeaderRow>

            <Card>
                <DistributionSearchBar
                    type="set"
                    onSearch={handleSearch}
                    onRefresh={refetch}
                    onAdd={() => setIsCreateModalVisible(true)}
                    canAdd={isAdmin}
                    loading={isLoading}
                />

                {selectedSetIds.length > 0 && (
                    <Space style={{ marginTop: 16, marginBottom: 16 }} wrap>
                        <span style={{ marginRight: 8 }}>
                            {t('bulkAssignment.selectedSets', { count: selectedSetIds.length })}
                        </span>
                        <Button icon={<TagOutlined />} onClick={() => setBulkTagsModalOpen(true)}>
                            {t('bulkAssignment.manageTags')}
                        </Button>
                    </Space>
                )}

                <Table
                    columns={columns}
                    dataSource={data?.content || []}
                    rowKey="id"
                    pagination={{
                        ...pagination,
                        total: data?.total || 0,
                        showSizeChanger: true,
                    }}
                    loading={isLoading}
                    onChange={handleTableChange}
                    rowSelection={{
                        selectedRowKeys: selectedSetIds,
                        onChange: (keys) => setSelectedSetIds(keys as number[]),
                    }}
                />
                <CreateDistributionSetWizard
                    visible={isCreateModalVisible}
                    onCancel={() => setIsCreateModalVisible(false)}
                    onSuccess={() => {
                        setIsCreateModalVisible(false);
                        refetch();
                    }}
                />
                <BulkManageSetTagsModal
                    open={bulkTagsModalOpen}
                    setIds={selectedSetIds}
                    onCancel={() => setBulkTagsModalOpen(false)}
                    onSuccess={() => {
                        setBulkTagsModalOpen(false);
                        setSelectedSetIds([]);
                        refetch();
                    }}
                />
            </Card>
        </PageContainer>
    );
};

export default DistributionSetList;
