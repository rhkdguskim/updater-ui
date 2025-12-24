import React, { useState } from 'react';
import { Modal, Select, Tag, Space, message, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAssignTarget, useGetTargetTags } from '@/api/generated/target-tags/target-tags';
import { getGetTargetsQueryKey } from '@/api/generated/targets/targets';
import type { MgmtTag } from '@/api/generated/model';

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

    const { data: tagsData, isLoading: tagsLoading } = useGetTargetTags({ limit: 100 });

    const assignTagMutation = useAssignTarget();

    const handleOk = async () => {
        if (selectedTagIds.length === 0) {
            message.warning(t('bulkAssign.selectTags'));
            return;
        }

        setAssigning(true);
        try {
            // Need to iterate as API might be one-by-one or check if there is a bulk endpoint.
            // Based on BulkAssignment.tsx, it was iterating.
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

    return (
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
                />
            </Space>
        </Modal>
    );
};

export default BulkAssignTagsModal;
