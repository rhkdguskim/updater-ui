import React, { useState } from 'react';
import { Modal, Select, message, Typography, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAssignTargetType, getGetTargetsQueryKey } from '@/api/generated/targets/targets';
import { useGetTargetTypes } from '@/api/generated/target-types/target-types';
import type { MgmtTargetType } from '@/api/generated/model';

interface BulkAssignTypeModalProps {
    open: boolean;
    targetIds: string[];
    onCancel: () => void;
    onSuccess: () => void;
}

const BulkAssignTypeModal: React.FC<BulkAssignTypeModalProps> = ({
    open,
    targetIds,
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const queryClient = useQueryClient();
    const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(undefined);
    const [assigning, setAssigning] = useState(false);

    const { data: typesData, isLoading: typesLoading } = useGetTargetTypes({ limit: 100 });

    const assignTypeMutation = useAssignTargetType();

    const handleOk = async () => {
        if (!selectedTypeId) {
            message.warning(t('bulkAssign.selectType'));
            return;
        }

        setAssigning(true);
        try {
            for (const controllerId of targetIds) {
                await assignTypeMutation.mutateAsync({
                    targetId: controllerId,
                    data: { id: selectedTypeId },
                });
            }
            message.success(t('bulkAssign.typeAssignSuccess', { count: targetIds.length }));
            setSelectedTypeId(undefined);
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
            title={t('bulkAssign.assignType')}
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
                    placeholder={t('bulkAssign.selectTypePlaceholder')}
                    style={{ width: '100%' }}
                    loading={typesLoading}
                    value={selectedTypeId}
                    onChange={setSelectedTypeId}
                    options={(typesData?.content as MgmtTargetType[] || []).map((type) => ({
                        value: type.id,
                        label: type.name,
                    }))}
                />
            </Space>
        </Modal>
    );
};

export default BulkAssignTypeModal;
