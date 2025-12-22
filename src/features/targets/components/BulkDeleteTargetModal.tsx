import React, { useState } from 'react';
import { Modal, Typography, Alert, Progress, App } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { deleteTarget } from '@/api/generated/targets/targets';
import { useQueryClient } from '@tanstack/react-query';

const { Text } = Typography;

interface BulkDeleteTargetModalProps {
    open: boolean;
    targetIds: string[];
    onCancel: () => void;
    onSuccess: () => void;
}

const BulkDeleteTargetModal: React.FC<BulkDeleteTargetModalProps> = ({
    open,
    targetIds,
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);

    const handleConfirm = async () => {
        if (targetIds.length === 0) return;

        setLoading(true);
        setProgress(0);
        setErrors([]);

        // Pause all queries to prevent 404 errors on deleted targets
        queryClient.cancelQueries();

        const total = targetIds.length;
        let completed = 0;
        const failed: string[] = [];

        for (const id of targetIds) {
            try {
                await deleteTarget(id);
            } catch (error) {
                const errMsg = (error as Error).message || id;
                failed.push(errMsg);
            }
            completed++;
            setProgress(Math.round((completed / total) * 100));
        }

        setLoading(false);

        if (failed.length === 0) {
            message.success(t('bulkDelete.success', { count: total }));
            onSuccess();
        } else if (failed.length < total) {
            message.warning(t('bulkDelete.partialSuccess', { success: total - failed.length, failed: failed.length }));
            setErrors(failed);
            onSuccess(); // Still call success to refresh the list
        } else {
            message.error(t('bulkDelete.failed'));
            setErrors(failed);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setProgress(0);
            setErrors([]);
            onCancel();
        }
    };

    return (
        <Modal
            title={
                <span>
                    <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    {t('bulkDelete.title', { defaultValue: 'Bulk Delete Targets' })}
                </span>
            }
            open={open}
            onOk={handleConfirm}
            onCancel={handleClose}
            okText={t('common:actions.delete')}
            cancelText={t('common:actions.cancel')}
            okButtonProps={{ danger: true, loading }}
            cancelButtonProps={{ disabled: loading }}
            closable={!loading}
            maskClosable={!loading}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Progress type="circle" percent={progress} />
                    <Text style={{ display: 'block', marginTop: 16 }}>
                        {t('bulkDelete.processing', { defaultValue: 'Deleting targets...' })}
                    </Text>
                </div>
            ) : (
                <>
                    <Alert
                        type="warning"
                        showIcon
                        title={t('bulkDelete.confirmMessage', {
                            count: targetIds.length,
                            defaultValue: `Are you sure you want to delete ${targetIds.length} target(s)?`,
                        })}
                        description={t('bulkDelete.confirmDesc', {
                            defaultValue: 'This action cannot be undone.',
                        })}
                        style={{ marginBottom: 16 }}
                    />
                    {errors.length > 0 && (
                        <Alert
                            type="error"
                            title={t('bulkDelete.errorTitle', { defaultValue: 'Some deletions failed' })}
                            description={
                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {errors.slice(0, 5).map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                    {errors.length > 5 && (
                                        <li>{t('bulkDelete.andMore', { count: errors.length - 5 })}</li>
                                    )}
                                </ul>
                            }
                        />
                    )}
                </>
            )}
        </Modal>
    );
};

export default BulkDeleteTargetModal;
