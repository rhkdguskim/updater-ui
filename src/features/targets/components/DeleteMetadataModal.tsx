import React from 'react';
import { Modal, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MgmtMetadata } from '@/api/generated/model';

interface DeleteMetadataModalProps {
    open: boolean;
    metadata: MgmtMetadata | null;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteMetadataModal: React.FC<DeleteMetadataModalProps> = ({
    open,
    metadata,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation('targets');
    return (
        <Modal
            title={
                <Space>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span>{t('metadata.deleteTitle')}</span>
                </Space>
            }
            open={open}
            onOk={onConfirm}
            onCancel={onCancel}
            okText={t('actions.delete', { ns: 'common' })}
            okButtonProps={{ danger: true }}
            confirmLoading={loading}
        >
            <p>
                {t('metadata.deleteConfirm', { key: metadata?.key })}
            </p>
            <p>{t('metadata.deleteDesc')}</p>
        </Modal>
    );
};

export default DeleteMetadataModal;
