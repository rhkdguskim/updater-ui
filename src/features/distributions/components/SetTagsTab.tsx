import React, { useState, useMemo } from 'react';
import { Tag, Button, message, Space, Modal, Table, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
    useGetDistributionSetTags,
    useAssignDistributionSet,
    useUnassignDistributionSet,
} from '@/api/generated/distribution-set-tags/distribution-set-tags';
import type { MgmtTag } from '@/api/generated/model';

interface SetTagsTabProps {
    distributionSetId: number;
    isAdmin: boolean;
}

const SetTagsTab: React.FC<SetTagsTabProps> = ({
    distributionSetId,
    isAdmin,
}) => {
    const { t } = useTranslation(['distributions', 'common']);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

    // Fetch all available tags
    const { data: allTagsData, isLoading: isTagsLoading } = useGetDistributionSetTags();

    // For each tag, we need to check if this DS is assigned
    // We'll compute assigned tags from the allTagsData by checking each tag's assigned DS list
    // This is a simplified approach; in production you might want a dedicated endpoint
    const allTags = allTagsData?.content || [];

    // We'll track which tags are assigned by querying each tag's assignments
    // This is inefficient but works given API constraints
    // Alternative: Use a state to track assigned tag IDs fetched on mount
    const [assignedTagIds, setAssignedTagIds] = useState<number[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);

    // Fetch assignments on mount
    React.useEffect(() => {
        const fetchAssignments = async () => {
            if (!allTags.length) return;
            setLoadingAssignments(true);
            const assigned: number[] = [];
            // This is a simplified approach - check if DS is in each tag's assigned list
            // In real app, you'd want a batch endpoint or server-side filtering
            for (const tag of allTags) {
                if (!tag.id) continue;
                try {
                    const response = await fetch(`/rest/v1/distributionsettags/${tag.id}/assigned?q=id==${distributionSetId}`, {
                        headers: {
                            'Authorization': `Basic ${btoa('admin:admin')}`,
                        },
                    });
                    const data = await response.json();
                    if (data.content && data.content.length > 0) {
                        assigned.push(tag.id);
                    }
                } catch {
                    // Skip on error
                }
            }
            setAssignedTagIds(assigned);
            setLoadingAssignments(false);
        };
        fetchAssignments();
    }, [allTags.length, distributionSetId]);

    // Assign tag mutation
    const assignMutation = useAssignDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('tagsTab.successAssign'));
                setIsModalVisible(false);
                setSelectedTagId(null);
                // Add to local state immediately
                if (selectedTagId) {
                    setAssignedTagIds(prev => [...prev, selectedTagId]);
                }
            },
            onError: () => message.error(t('tagsTab.errorAssign')),
        },
    });

    // Unassign tag mutation
    const unassignMutation = useUnassignDistributionSet({
        mutation: {
            onSuccess: (_, variables) => {
                message.success(t('tagsTab.successUnassign'));
                // Remove from local state
                setAssignedTagIds(prev => prev.filter(id => id !== variables.distributionsetTagId));
            },
            onError: () => message.error(t('tagsTab.errorUnassign')),
        },
    });

    const handleAssign = () => {
        if (!selectedTagId) {
            message.warning(t('tagsTab.warningSelect'));
            return;
        }
        assignMutation.mutate({
            distributionsetTagId: selectedTagId,
            distributionsetId: distributionSetId,
        });
    };

    const handleUnassign = (tagId: number) => {
        unassignMutation.mutate({
            distributionsetTagId: tagId,
            distributionsetId: distributionSetId,
        });
    };

    // Get assigned tags from allTags
    const assignedTags = useMemo(() =>
        allTags.filter(t => t.id && assignedTagIds.includes(t.id)),
        [allTags, assignedTagIds]
    );

    // Available tags for assignment (not already assigned)
    const availableTags = useMemo(() =>
        allTags.filter(t => t.id && !assignedTagIds.includes(t.id)),
        [allTags, assignedTagIds]
    );

    const columns = [
        {
            title: t('tagsTab.columns.name'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: MgmtTag) => (
                <Tag color={record.colour || 'blue'}>{text}</Tag>
            ),
        },
        {
            title: t('tagsTab.columns.description'),
            dataIndex: 'description',
            key: 'description',
        },
    ];

    if (isTagsLoading || loadingAssignments) {
        return <Spin tip={t('common:messages.loading')} />;
    }

    return (
        <div>
            {/* Assigned Tags Display */}
            <div style={{ marginBottom: 16 }}>
                <Space wrap>
                    {assignedTags.length === 0 ? (
                        <span style={{ color: '#999' }}>{t('tagsTab.noTags')}</span>
                    ) : (
                        assignedTags.map(tag => (
                            <Tag
                                key={tag.id}
                                color={tag.colour || 'blue'}
                                closable={isAdmin}
                                onClose={(e) => {
                                    e.preventDefault();
                                    if (tag.id) handleUnassign(tag.id);
                                }}
                            >
                                {tag.name}
                            </Tag>
                        ))
                    )}
                </Space>
            </div>

            {/* Add Tag Button */}
            {isAdmin && (
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                >
                    {t('tagsTab.add')}
                </Button>
            )}

            {/* Tag Selection Modal */}
            <Modal
                title={t('tagsTab.selectTitle')}
                open={isModalVisible}
                onOk={handleAssign}
                onCancel={() => {
                    setIsModalVisible(false);
                    setSelectedTagId(null);
                }}
                confirmLoading={assignMutation.isPending}
                destroyOnHidden
            >
                <Table
                    dataSource={availableTags}
                    columns={columns}
                    rowKey="id"
                    loading={isTagsLoading}
                    pagination={false}
                    size="small"
                    rowSelection={{
                        type: 'radio',
                        selectedRowKeys: selectedTagId ? [selectedTagId] : [],
                        onChange: (keys) => setSelectedTagId(keys[0] as number),
                    }}
                />
                {availableTags.length === 0 && !isTagsLoading && (
                    <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>
                        {t('tagsTab.noAvailable')}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SetTagsTab;
