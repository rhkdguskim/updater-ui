import React, { useState } from 'react';
import {
    Card,
    Typography,
    Skeleton,
    Empty,
    Button,
    Space,
    Descriptions,
    Tag,
    Modal,
    Select,
    message,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { MgmtTarget, MgmtTargetType } from '@/api/generated/model';
import {
    useGetTargetTypes,
} from '@/api/generated/target-types/target-types';

const { Title, Text } = Typography;

interface TargetTypeTabProps {
    target: MgmtTarget | null | undefined;
    loading: boolean;
    canEdit?: boolean;
    onAssign: (targetTypeId: number) => void;
    onUnassign: () => void;
    actionLoading?: boolean;
}

import { useTranslation } from 'react-i18next';
// ...

const TargetTypeTab: React.FC<TargetTypeTabProps> = ({
    target,
    loading,
    canEdit = false,
    onAssign,
    onUnassign,
    actionLoading = false,
}) => {
    const { t } = useTranslation(['targets', 'common']);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [unassignModalOpen, setUnassignModalOpen] = useState(false);
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

    // Fetch target types when modal is open
    const { data: targetTypesData, isLoading: typesLoading } = useGetTargetTypes(
        { limit: 100 },
        { query: { enabled: assignModalOpen } }
    );

    if (loading) {
        return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    const currentType = target?.targetType as (MgmtTargetType & { name?: string }) | undefined;

    const handleAssign = () => {
        if (selectedTypeId) {
            onAssign(selectedTypeId);
            setAssignModalOpen(false);
            setSelectedTypeId(null);
        } else {
            message.warning(t('common:validation.required'));
        }
    };

    const handleUnassign = () => {
        onUnassign();
        setUnassignModalOpen(false);
    };

    return (
        <>
            <Card>
                {currentType ? (
                    <>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <Space align="center">
                                <Title level={5} style={{ margin: 0 }}>{t('targetType.current')}</Title>
                                <Tag color="blue">{currentType.name}</Tag>
                            </Space>

                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="ID">
                                    {currentType.id}
                                </Descriptions.Item>
                                <Descriptions.Item label={t('table.name')}>
                                    {currentType.name || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label={t('form.description')}>
                                    {currentType.description || '-'}
                                </Descriptions.Item>
                            </Descriptions>

                            {canEdit && (
                                <Space>
                                    <Button
                                        icon={<EditOutlined />}
                                        onClick={() => setAssignModalOpen(true)}
                                    >
                                        {t('targetType.change')}
                                    </Button>
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => setUnassignModalOpen(true)}
                                    >
                                        {t('targetType.remove')}
                                    </Button>
                                </Space>
                            )}
                        </Space>
                    </>
                ) : (
                    <Empty
                        description={
                            <Space direction="vertical" align="center">
                                <Text>{t('targetType.noAssigned')}</Text>
                                {canEdit && (
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setAssignModalOpen(true)}
                                    >
                                        {t('targetType.assign')}
                                    </Button>
                                )}
                            </Space>
                        }
                    />
                )}
            </Card>

            {/* Assign Target Type Modal */}
            <Modal
                title={t('targetType.assignTitle')}
                open={assignModalOpen}
                onOk={handleAssign}
                onCancel={() => {
                    setAssignModalOpen(false);
                    setSelectedTypeId(null);
                }}
                confirmLoading={actionLoading}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Text>{t('targetType.select')}:</Text>
                    <Select
                        placeholder={t('targetType.select')}
                        style={{ width: '100%' }}
                        loading={typesLoading}
                        value={selectedTypeId}
                        onChange={setSelectedTypeId}
                        options={targetTypesData?.content?.map((type) => ({
                            value: type.id,
                            label: (
                                <Space>
                                    <span>{type.name}</span>
                                    {type.description && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            - {type.description}
                                        </Text>
                                    )}
                                </Space>
                            ),
                        }))}
                    />
                </Space>
            </Modal>

            {/* Unassign Confirmation Modal */}
            <Modal
                title={t('targetType.removeTitle')}
                open={unassignModalOpen}
                onOk={handleUnassign}
                onCancel={() => setUnassignModalOpen(false)}
                okText={t('targetType.remove')}
                okButtonProps={{ danger: true }}
                confirmLoading={actionLoading}
            >
                <p>
                    {t('targetType.removeConfirm', { name: currentType?.name })}
                </p>
            </Modal>
        </>
    );
};

export default TargetTypeTab;
