import React, { useState } from 'react';
import { Modal, Typography, Alert, Progress, App, Space, List } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { deleteDistributionSet, getGetDistributionSetsQueryKey } from '@/api/generated/distribution-sets/distribution-sets';
import { useQueryClient } from '@tanstack/react-query';

const { Text } = Typography;

interface BulkDeleteDistributionSetModalProps {
    open: boolean;
    setIds: number[];
    setNames?: string[];
    onCancel: () => void;
    onSuccess: () => void;
}

const BulkDeleteDistributionSetModal: React.FC<BulkDeleteDistributionSetModalProps> = ({
    open,
    setIds,
    setNames = [],
    onCancel,
    onSuccess,
}) => {
    const { t } = useTranslation(['distributions', 'common']);
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);

    const handleConfirm = async () => {
        if (setIds.length === 0) return;

        setLoading(true);
        setProgress(0);
        setErrors([]);

        queryClient.cancelQueries();

        const total = setIds.length;
        let completed = 0;
        const failed: string[] = [];

        for (const id of setIds) {
            try {
                await deleteDistributionSet(id);
            } catch (error) {
                const errMsg = (error as Error).message || String(id);
                failed.push(errMsg);
            }
            completed++;
            setProgress(Math.round((completed / total) * 100));
        }

        setLoading(false);

        if (failed.length === 0) {
            message.success(t('bulkDelete.success', { count: total, defaultValue: `${total} items deleted` }));
            queryClient.invalidateQueries({ queryKey: getGetDistributionSetsQueryKey() });
            onSuccess();
        } else if (failed.length < total) {
            message.warning(t('bulkDelete.partialSuccess', {
                success: total - failed.length,
                failed: failed.length,
                defaultValue: `${total - failed.length} deleted, ${failed.length} failed`
            }));
            setErrors(failed);
            queryClient.invalidateQueries({ queryKey: getGetDistributionSetsQueryKey() });
            onSuccess();
        } else {
            message.error(t('bulkDelete.failed', { defaultValue: 'Delete failed' }));
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
                    {t('bulkDelete.title', { defaultValue: 'Bulk Delete Distribution Sets' })}
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
            width={500}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Progress type="circle" percent={progress} />
                    <Text style={{ display: 'block', marginTop: 16 }}>
                        {t('bulkDelete.processing', { defaultValue: 'Deleting...' })}
                    </Text>
                </div>
            ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Alert
                        type="warning"
                        showIcon
                        message={t('bulkDelete.confirmMessage', {
                            count: setIds.length,
                            defaultValue: `Are you sure you want to delete ${setIds.length} distribution set(s)?`,
                        })}
                        description={t('bulkDelete.confirmDesc', {
                            defaultValue: 'This action cannot be undone.',
                        })}
                    />
                    {setNames.length > 0 && (
                        <List
                            size="small"
                            bordered
                            dataSource={setNames.slice(0, 10)}
                            renderItem={(name) => <List.Item>{name}</List.Item>}
                            footer={setNames.length > 10 ? (
                                <Text type="secondary">
                                    {t('bulkDelete.andMore', { count: setNames.length - 10, defaultValue: `...and ${setNames.length - 10} more` })}
                                </Text>
                            ) : null}
                        />
                    )}
                    {errors.length > 0 && (
                        <Alert
                            type="error"
                            message={t('bulkDelete.errorTitle', { defaultValue: 'Some deletions failed' })}
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
                </Space>
            )}
        </Modal>
    );
};

export default BulkDeleteDistributionSetModal;
