import React from 'react';
import { Tag, Typography, Skeleton, Empty, Space, Card, Row, Col } from 'antd';
import { TagOutlined } from '@ant-design/icons';
import type { MgmtTag } from '@/api/generated/model';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface TagsTabProps {
    data: MgmtTag[] | null | undefined;
    loading: boolean;
}

const TagsTab: React.FC<TagsTabProps> = ({ data, loading }) => {
    const { t } = useTranslation('targets');
    if (loading) {
        return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    if (!data || data.length === 0) {
        return <Empty description={t('tags.noTags')} />;
    }

    return (
        <Row gutter={[16, 16]}>
            {data.map((tag) => (
                <Col key={tag.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                        size="small"
                        style={{
                            borderLeft: `4px solid ${tag.colour || 'var(--ant-color-primary)'}`,
                        }}
                    >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Space>
                                <TagOutlined style={{ color: tag.colour || 'var(--ant-color-primary)' }} />
                                <Text strong>{tag.name}</Text>
                            </Space>
                            {tag.description && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {tag.description}
                                </Text>
                            )}
                            <Tag
                                color={tag.colour || 'default'}
                                style={{ marginTop: 8 }}
                            >
                                {t('tags.id') || 'ID'}: {tag.id}
                            </Tag>
                        </Space>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default TagsTab;
