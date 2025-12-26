import React from 'react';
import { Table, Tag, Typography, Skeleton, Empty, Button, Space, Tooltip, Modal, Timeline, Radio, Badge } from 'antd';
import type { TableProps } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    DownloadOutlined,
    EyeOutlined,
    StopOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import type { MgmtAction, PagedListMgmtAction } from '@/api/generated/model';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useGetActionStatusList } from '@/api/generated/targets/targets';
import styled from 'styled-components';

const Label = styled(Tag)`
    background: var(--ant-color-info-bg);
    color: var(--ant-color-info);
    font-weight: 600;
`;

const { Text } = Typography;

interface ActionsTabProps {
    data: PagedListMgmtAction | null | undefined;
    loading: boolean;
    targetId: string;
    onCancelAction?: (action: MgmtAction) => void;
    onForceAction?: (action: MgmtAction) => void;
    canForce?: boolean;
    canCancel?: boolean;
}

const getStatusIcon = (status?: string) => {
    switch (status) {
        case 'finished':
            return <CheckCircleOutlined style={{ color: 'var(--ant-color-success)' }} />;
        case 'error':
            return <CloseCircleOutlined style={{ color: 'var(--ant-color-error)' }} />;
        case 'running':
            return <SyncOutlined spin style={{ color: 'var(--ant-color-info)' }} />;
        case 'pending':
        case 'waiting':
            return <ClockCircleOutlined style={{ color: 'var(--ant-color-warning)' }} />;
        case 'canceled':
            return <StopOutlined style={{ color: 'var(--ant-color-text-quaternary)' }} />;
        default:
            return <ClockCircleOutlined />;
    }
};

import { useTranslation } from 'react-i18next';
// ...

const ActionsTab: React.FC<ActionsTabProps> = ({
    data,
    loading,
    targetId,
    onCancelAction,
    onForceAction,
    canForce,
    canCancel,
}) => {
    const { t } = useTranslation(['targets', 'actions', 'common']);
    const [selectedAction, setSelectedAction] = useState<MgmtAction | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [historyFilter, setHistoryFilter] = useState<'all' | 'error' | 'download' | 'system'>('all');

    const { data: statusData, isLoading: statusLoading } = useGetActionStatusList(
        targetId,
        selectedAction?.id || 0,
        undefined,
        {
            query: {
                enabled: modalOpen && !!selectedAction?.id && !!targetId,
            },
        }
    );

    const getStatusTag = (status?: string) => {
        const icon = getStatusIcon(status);
        const colorMap: Record<string, string> = {
            finished: 'success',
            error: 'error',
            running: 'processing',
            pending: 'warning',
            waiting: 'warning',
            canceled: 'default',
        };
        const label = status
            ? t(`common:status.${status.toLowerCase()}`, { defaultValue: status.toUpperCase() })
            : t('common:status.unknown');
        return (
            <Tag icon={icon} color={colorMap[status || ''] || 'default'}>
                {label}
            </Tag>
        );
    };

    const getStatusLabel = (status?: string) => {
        if (!status) {
            return t('common:status.unknown');
        }
        const key = status.toLowerCase();
        return t(`common:status.${key}`, { defaultValue: status.toUpperCase() });
    };

    const getStatusTone = (status?: string, code?: number) => {
        const normalized = status?.toLowerCase() || '';
        if (normalized.includes('error') || normalized.includes('failed') || (code && code >= 400)) {
            return 'error';
        }
        if (normalized.includes('finished') || normalized.includes('success')) {
            return 'success';
        }
        if (normalized.includes('running') || normalized.includes('processing') || normalized.includes('retrieving')) {
            return 'processing';
        }
        if (normalized.includes('pending') || normalized.includes('waiting')) {
            return 'warning';
        }
        return 'default';
    };

    const getTimelineCategory = (status: { type?: string; code?: number; messages?: string[] }) => {
        const tone = getStatusTone(status.type, status.code);
        if (tone === 'error') {
            return 'error';
        }
        const type = status.type?.toLowerCase() || '';
        const messages = status.messages?.join(' ').toLowerCase() || '';
        if (type.includes('download') || messages.includes('download')) {
            return 'download';
        }
        return 'system';
    };

    const getToneColor = (tone: string) => {
        switch (tone) {
            case 'error':
                return 'var(--ant-color-error)';
            case 'success':
                return 'var(--ant-color-success)';
            case 'processing':
                return 'var(--ant-color-info)';
            case 'warning':
                return 'var(--ant-color-warning)';
            default:
                return 'var(--ant-color-text-quaternary)';
        }
    };

    const getTimelineDot = (status: { type?: string; code?: number; messages?: string[] }) => {
        const tone = getStatusTone(status.type, status.code);
        const category = getTimelineCategory(status);
        const color = getToneColor(tone);
        const icon = category === 'download'
            ? <DownloadOutlined />
            : tone === 'error'
                ? <CloseCircleOutlined />
                : tone === 'success'
                    ? <CheckCircleOutlined />
                    : tone === 'processing'
                        ? <SyncOutlined spin />
                        : <ClockCircleOutlined />;
        return (
            <span
                style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: `var(--ant-color-primary-bg)`,
                    color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid var(--ant-color-border-secondary)`,
                }}
            >
                {icon}
            </span>
        );
    };

    const translateStatusMessage = (message: string) => {
        const trimmed = message.trim();
        if (/^Update failed, rollback performed$/i.test(trimmed)) {
            return t('actions:statusMessages.updateFailedRollback');
        }
        if (/^Starting services$/i.test(trimmed)) {
            return t('actions:statusMessages.startingServices');
        }
        if (/^Updating binaries$/i.test(trimmed)) {
            return t('actions:statusMessages.updatingBinaries');
        }
        if (/^Downloading artifacts$/i.test(trimmed)) {
            return t('actions:statusMessages.downloadingArtifacts');
        }
        if (/^Verifying services stopped$/i.test(trimmed)) {
            return t('actions:statusMessages.verifyingServicesStopped');
        }
        const stoppingMatch = trimmed.match(/^Stopping (.+) services$/i);
        if (stoppingMatch) {
            return t('actions:statusMessages.stoppingServices', { service: stoppingMatch[1] });
        }
        if (/^Creating backup$/i.test(trimmed)) {
            return t('actions:statusMessages.creatingBackup');
        }
        if (/^Starting update process$/i.test(trimmed)) {
            return t('actions:statusMessages.startingUpdateProcess');
        }
        if (/^Update Server: Target retrieved update action and should start now the download\.?$/i.test(trimmed)) {
            return t('actions:statusMessages.targetRetrieved');
        }
        const downloadMatch = trimmed.match(/^Update Server: Target downloads (.+)$/i);
        if (downloadMatch) {
            return t('actions:statusMessages.targetDownloads', { path: downloadMatch[1] });
        }
        const assignMatch = trimmed.match(/^Assignment initiated by user ['"](.+)['"]$/i);
        if (assignMatch) {
            return t('actions:statusMessages.assignmentInitiated', { user: assignMatch[1] });
        }
        return message;
    };

    const timelineItems = useMemo(() => {
        if (!statusData?.content?.length) {
            return [];
        }
        return [...statusData.content]
            .sort((a, b) => (b.reportedAt || b.timestamp || 0) - (a.reportedAt || a.timestamp || 0))
            .filter((status) => {
                if (historyFilter === 'all') {
                    return true;
                }
                return getTimelineCategory(status) === historyFilter;
            })
            .map((status) => ({
                color: getStatusTone(status.type, status.code),
                dot: getTimelineDot(status),
                children: (
                    <Space direction="vertical" size={4}>
                        <Text strong style={{ wordBreak: 'break-word' }}>{getStatusLabel(status.type)}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {status.reportedAt || status.timestamp
                                ? dayjs(status.reportedAt || status.timestamp).format('YYYY-MM-DD HH:mm')
                                : '-'}
                        </Text>
                        {status.code !== undefined && (
                            <Tag>{t('actions:statusCode', { code: status.code })}</Tag>
                        )}
                        {status.messages?.length ? (
                            <Space direction="vertical" size={2}>
                                {status.messages.map((message, index) => (
                                    <Text key={`${status.id}-${index}`} style={{ wordBreak: 'break-word' }}>
                                        {translateStatusMessage(message)}
                                    </Text>
                                ))}
                            </Space>
                        ) : null}
                    </Space>
                ),
            }));
    }, [historyFilter, statusData?.content, t]);

    const historyCounts = useMemo(() => {
        const counts = { all: 0, error: 0, download: 0, system: 0 };
        if (!statusData?.content?.length) {
            return counts;
        }
        counts.all = statusData.content.length;
        statusData.content.forEach((status) => {
            const category = getTimelineCategory(status);
            counts[category] += 1;
        });
        return counts;
    }, [statusData?.content]);

    const getForceTypeTag = (forceType?: string) => {
        if (forceType === 'forced') {
            return <Tag color="orange">{t('assign.forced')}</Tag>;
        }
        return <Tag>{t('assign.soft')}</Tag>;
    };

    const getTypeLabel = (type?: string) => {
        if (!type) return '-';
        const key = type.toLowerCase();
        return t(`actions:typeLabels.${key}`, { defaultValue: type.toUpperCase() });
    };

    const columns: TableProps<MgmtAction>['columns'] = [
        {
            title: t('table.id'),
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (id: number) => <Text strong>#{id}</Text>,
        },
        {
            title: t('table.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => getStatusTag(status),
        },
        {
            title: t('table.type'),
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => <Tag>{getTypeLabel(type)}</Tag>,
        },
        {
            title: t('table.forceType'),
            dataIndex: 'forceType',
            key: 'forceType',
            width: 100,
            render: (forceType: string) => getForceTypeTag(forceType),
        },
        {
            title: t('table.started'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: number) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: t('table.lastModified'),
            dataIndex: 'lastModifiedAt',
            key: 'lastModifiedAt',
            render: (value: number) =>
                value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: t('table.actions'),
            key: 'actions',
            width: 150,
            render: (_, record) => {
                const isActive = record.status === 'running' || record.status === 'pending';
                const canBeForced = record.forceType !== 'forced' && isActive;

                return (
                    <Space size="small">
                        <Tooltip title={t('actions.viewDetails')}>
                            <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => {
                                    setSelectedAction(record);
                                    setModalOpen(true);
                                }}
                            />
                        </Tooltip>
                        {canForce && canBeForced && onForceAction && (
                            <Tooltip title={t('actions.force')}>
                                <Button
                                    type="text"
                                    icon={<ThunderboltOutlined />}
                                    onClick={() => onForceAction(record)}
                                />
                            </Tooltip>
                        )}
                        {canCancel && isActive && onCancelAction && (
                            <Tooltip title={t('actions.cancel')}>
                                <Button
                                    type="text"
                                    danger
                                    icon={<StopOutlined />}
                                    onClick={() => onCancelAction(record)}
                                />
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
    ];

    if (loading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (!data?.content?.length) {
        return <Empty description={t('common:messages.noData')} />;
    }

    return (
        <>
            <Table<MgmtAction>
                columns={columns}
                dataSource={data.content}
                rowKey="id"
                pagination={false}
                size="middle"
            />
            <Modal
                title={
                    <Space align="center">
                        <Text strong>{t('actions:statusHistoryTitle')}</Text>
                        <Label color="blue">{selectedAction ? `#${selectedAction.id}` : ''}</Label>
                    </Space>
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                destroyOnHidden
                width={680}
                bodyStyle={{ padding: 24 }}
            >
                {selectedAction && (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Space align="center" style={{ width: '100%', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <Space>
                                {getStatusTag(selectedAction.status)}
                                <Text type="secondary">{dayjs(selectedAction.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                            </Space>
                        </Space>
                        {statusLoading ? (
                            <Skeleton active paragraph={{ rows: 4 }} />
                        ) : (
                            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                                <Space align="center" direction="vertical" style={{ marginBottom: 12 }}>
                                    <Text type="secondary">{t('actions:statusHistoryFilter')}</Text>
                                    <Radio.Group
                                        value={historyFilter}
                                        onChange={(event) => setHistoryFilter(event.target.value)}
                                        optionType="default"
                                        size="small"
                                    >
                                        <Radio.Button value="all">
                                            <Space align="center" size={4}>
                                                {t('actions:statusFilters.all')}
                                                <Badge count={historyCounts.all} size="small" />
                                            </Space>
                                        </Radio.Button>
                                        <Radio.Button value="error">
                                            <Space align="center" size={4}>
                                                {t('actions:statusFilters.error')}
                                                <Badge count={historyCounts.error} size="small" />
                                            </Space>
                                        </Radio.Button>
                                        <Radio.Button value="download">
                                            <Space align="center" size={4}>
                                                {t('actions:statusFilters.download')}
                                                <Badge count={historyCounts.download} size="small" />
                                            </Space>
                                        </Radio.Button>
                                        <Radio.Button value="system">
                                            <Space align="center" size={4}>
                                                {t('actions:statusFilters.system')}
                                                <Badge count={historyCounts.system} size="small" />
                                            </Space>
                                        </Radio.Button>
                                    </Radio.Group>
                                </Space>
                                {timelineItems.length ? (
                                    <Timeline items={timelineItems} />
                                ) : (
                                    <Empty description={t('actions:statusHistoryEmpty')} />
                                )}
                            </div>
                        )}
                    </Space>
                )}
            </Modal>
        </>
    );
};

export default ActionsTab;
