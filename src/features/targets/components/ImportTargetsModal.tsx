import React, { useState } from 'react';
import { Modal, Upload, Button, Table, message, Alert, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import Papa from 'papaparse';
import type { UploadFile } from 'antd/es/upload/interface';
import { useCreateTargets, getGetTargetsQueryKey } from '@/api/generated/targets/targets';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportTargetsModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

interface CSVRow {
    controllerId: string;
    name: string;
    description?: string;
    securityToken?: string;
    key?: string; // specific for Table
    _errors?: string[];
}

export const ImportTargetsModal: React.FC<ImportTargetsModalProps> = ({ open, onCancel, onSuccess }) => {
    const { t } = useTranslation(['targets', 'common']);
    const queryClient = useQueryClient();
    const [parsedData, setParsedData] = useState<CSVRow[]>([]);
    const [parsing, setParsing] = useState(false);

    const createTargetsMutation = useCreateTargets({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.importSuccess', { defaultValue: 'Targets imported successfully' }));
                onSuccess();
                queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
                resetState();
            },
            onError: (error) => {
                message.error((error as Error).message || t('common:messages.error'));
            },
        },
    });

    const resetState = () => {
        setParsedData([]);
        setParsing(false);
    };

    const handleCancel = () => {
        resetState();
        onCancel();
    };

    const handleUpload = (file: File) => {
        setParsing(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data as Record<string, string>[];
                const validatedrows = rows.map((row, index) => {
                    const errors: string[] = [];
                    // Normalize keys to lowercase for flexibility if needed, but stick to exact match for now
                    const controllerId = row['controllerId'] || row['Controller ID'] || row['ID'];
                    const name = row['name'] || row['Name'];

                    if (!controllerId) errors.push('Missing Controller ID');
                    if (!name) errors.push('Missing Name');

                    return {
                        key: `row-${index}`,
                        controllerId: controllerId || '',
                        name: name || '',
                        description: row['description'] || row['Description'],
                        securityToken: row['securityToken'] || row['Security Token'],
                        _errors: errors
                    } as CSVRow;
                });

                setParsedData(validatedrows);
                setParsing(false);
            },
            error: (err) => {
                message.error(`CSV Parse Error: ${err.message}`);
                setParsing(false);
            }
        });
        return false; // Prevent auto upload
    };

    const handleImport = () => {
        const validRows = parsedData.filter(r => !r._errors?.length);
        if (validRows.length === 0) return;

        createTargetsMutation.mutate({
            data: validRows.map(row => ({
                controllerId: row.controllerId,
                name: row.name,
                description: row.description,
                securityToken: row.securityToken
            }))
        });
    };

    const columns = [
        {
            title: 'Controller ID',
            dataIndex: 'controllerId',
            key: 'controllerId',
            render: (text: string) => (
                <Text type={!text ? 'danger' : undefined}>{text || 'Missing'}</Text>
            )
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Text type={!text ? 'danger' : undefined}>{text || 'Missing'}</Text>
            )
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: CSVRow) => {
                if (record._errors && record._errors.length > 0) {
                    return <Text type="danger">{record._errors.join(', ')}</Text>;
                }
                return <Text type="success">Ready</Text>;
            }
        }
    ];

    const hasErrors = parsedData.some(r => r._errors && r._errors.length > 0);
    const validCount = parsedData.filter(r => !r._errors?.length).length;

    return (
        <Modal
            title={t('actions.importTargets', { defaultValue: 'Import Targets' })}
            open={open}
            onCancel={handleCancel}
            width={800}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    {t('common:actions.cancel')}
                </Button>,
                <Button
                    key="import"
                    type="primary"
                    onClick={handleImport}
                    loading={createTargetsMutation.isPending}
                    disabled={validCount === 0}
                >
                    {t('actions.import', { defaultValue: 'Import' })} ({validCount})
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Dragger
                    accept=".csv"
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    disabled={parsing}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">{t('import.uploadText', { defaultValue: 'Click or drag file to this area to upload' })}</p>
                    <p className="ant-upload-hint">
                        {t('import.uploadHint', { defaultValue: 'Support for a single CSV file. Required columns: controllerId, name' })}
                    </p>
                </Dragger>
            </div>

            {parsedData.length > 0 && (
                <>
                    {hasErrors && (
                        <Alert
                            message="Validation Errors"
                            description="Some rows have missing required fields and will be skipped."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    <Table
                        dataSource={parsedData}
                        columns={columns}
                        size="small"
                        pagination={{ pageSize: 5 }}
                        scroll={{ y: 240 }}
                    />
                </>
            )}
        </Modal>
    );
};
