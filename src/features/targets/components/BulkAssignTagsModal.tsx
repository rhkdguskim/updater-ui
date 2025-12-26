import React, { useState } from 'react';
import { Modal, Select, Tag, Space, message, Typography, Button, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAssignTarget, useGetTargetTags, getGetTargetTagsQueryKey, useCreateTargetTags } from '@/api/generated/target-tags/target-tags';
import { getGetTargetsQueryKey } from '@/api/generated/targets/targets';
import type { MgmtTag } from '@/api/generated/model';
import { TagFormModal, type TagFormValues } from '@/components/common';

interface BulkAssignTagsModalProps {
    open: boolean;
    targetIds: string[];
    onCancel: () => void;
    onSuccess: () => void;
}

const BulkAssignTagsModal: React.FC<BulkAssignTagsModalProps> = ({
    open,
    targetIds,
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const queryClient = useQueryClient();
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [createTagModalOpen, setCreateTagModalOpen] = useState(false);

    const { data: tagsData, isLoading: tagsLoading } = useGetTargetTags({ limit: 100 });

    const assignTagMutation = useAssignTarget();

    const createTagMutation = useCreateTargetTags({
        mutation: {
            onSuccess: (data) => {
                setCreateTagModalOpen(false);
                queryClient.invalidateQueries({ queryKey: getGetTargetTagsQueryKey() });
                // Auto-select the newly created tag
                if (data && Array.isArray(data) && data[0]?.id) {
                    setSelectedTagIds((prev) => [...prev, data[0].id!]);
                }
                message.success(t('messages.tagCreated', { defaultValue: 'Tag created' }));
            },
            onError: (error) => {
                message.error((error as Error).message || t('common:messages.error'));
            },
        },
    });

    const handleOk = async () => {
        if (selectedTagIds.length === 0) {
            message.warning(t('bulkAssign.selectTags'));
            return;
        }

        setAssigning(true);
        try {
            for (const controllerId of targetIds) {
                for (const tagId of selectedTagIds) {
                    await assignTagMutation.mutateAsync({
                        targetTagId: tagId,
                        controllerId,
                    });
                }
            }
            message.success(t('bulkAssign.tagAssignSuccess', { count: targetIds.length }));
            setSelectedTagIds([]);
            queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
            onSuccess();
        } catch (error) {
            message.error((error as Error).message || t('common:messages.error'));
        } finally {
            setAssigning(false);
        }
    };

    const handleCreateTag = (values: TagFormValues) => {
        createTagMutation.mutate({
            data: [{
                name: values.name,
                description: values.description,
                colour: values.colour,
            }],
        });
    };

    return (
        <>
            <Modal
                title={t('bulkAssign.assignTag')}
                open={open}
                onOk={handleOk}
                onCancel={onCancel}
                confirmLoading={assigning}
                okText={t('common:actions.assign')}
                cancelText={t('common:actions.cancel')}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Typography.Text strong>
                        {t('bulkAssign.selectedTargetsCount', { count: targetIds.length })}
                    </Typography.Text>
                    <Select
                        mode="multiple"
                        placeholder={t('bulkAssign.selectTagsPlaceholder')}
                        style={{ width: '100%' }}
                        value={selectedTagIds}
                        onChange={setSelectedTagIds}
                        loading={tagsLoading}
                        options={(tagsData?.content as MgmtTag[] || []).map((tag) => ({
                            value: tag.id,
                            label: (
                                <Space>
                                    <Tag color={tag.colour || 'default'}>{tag.name}</Tag>
                                </Space>
                            ),
                        }))}
                        dropdownRender={(menu) => (
                            <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    onClick={() => setCreateTagModalOpen(true)}
                                    style={{ width: '100%', textAlign: 'left' }}
                                >
                                    {t('bulkAssign.createNewTag', { defaultValue: 'Create New Tag' })}
                                </Button>
                            </>
                        )}
                    />
                </Space>
            </Modal>
            <TagFormModal
                open={createTagModalOpen}
                mode="create"
                loading={createTagMutation.isPending}
                onSubmit={handleCreateTag}
                onCancel={() => setCreateTagModalOpen(false)}
            />
        </>
    );
};

export default BulkAssignTagsModal;
