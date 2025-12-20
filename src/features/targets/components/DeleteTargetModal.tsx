import React from 'react';
import { Modal, Alert } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { MgmtTarget } from '@/api/generated/model';
import { useTranslation } from 'react-i18next';

interface DeleteTargetModalProps {
    open: boolean;
    target: MgmtTarget | null;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}



const DeleteTargetModal: React.FC<DeleteTargetModalProps> = ({
    open,
    target,
    loading,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    return (
        <Modal
            title={
                <>
                    <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    {t('modal.deleteTitle')}
                </>
            }
            open={open}
            onOk={onConfirm}
            onCancel={onCancel}
            okText={t('actions.delete')}
            okButtonProps={{ danger: true, loading }}
            cancelButtonProps={{ disabled: loading }}
        >
            <Alert
                type="warning"
                message={t('common:messages.warning')}
                description={
                    <>
                        {t('modal.deleteConfirm', { name: target?.controllerId })}
                    </>
                }
                showIcon
                style={{ marginTop: 16 }}
            />
        </Modal>
    );
};

export default DeleteTargetModal;
