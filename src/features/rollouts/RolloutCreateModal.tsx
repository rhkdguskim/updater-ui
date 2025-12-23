import React from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import RolloutWizard from './RolloutWizard';

interface RolloutCreateModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: (rolloutId: number) => void;
}

const RolloutCreateModal: React.FC<RolloutCreateModalProps> = ({
    open,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation(['rollouts']);

    return (
        <Modal
            title={t('wizard.title')}
            open={open}
            onCancel={onClose}
            footer={null}
            width={1100}
            style={{ top: 40 }}
            styles={{
                body: {
                    height: 'calc(100vh - 160px)',
                    padding: 0,
                    overflow: 'hidden',
                }
            }}
            destroyOnClose
        >
            <RolloutWizard
                isModal={true}
                onClose={onClose}
                onSuccess={onSuccess}
            />
        </Modal>
    );
};

export default RolloutCreateModal;
