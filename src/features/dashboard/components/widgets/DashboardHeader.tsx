import styled from 'styled-components';
import { Typography, Button, Flex } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { LiveIndicator } from '../DashboardStyles';

const { Title, Text } = Typography;

const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    flex-shrink: 0;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const GradientTitle = styled(Title)`
    && {
        margin: 0;
        background: var(--ant-color-text, linear-gradient(135deg, #1e293b 0%, #475569 100%));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .dark-mode & {
        background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        background-clip: text;
    }
`;

interface DashboardHeaderProps {
    lastUpdated: string;
    isActivePolling: boolean;
    isLoading: boolean;
    onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    lastUpdated,
    isActivePolling,
    isLoading,
    onRefresh,
}) => {
    const { t } = useTranslation(['dashboard', 'common']);

    return (
        <HeaderContainer>
            <ContentWrapper>
                <GradientTitle level={3}>
                    {t('title', 'Operations Dashboard')}
                </GradientTitle>
                <Flex align="center" gap={12}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        {t('subtitle', 'Deployment actions and status overview')}
                    </Text>
                    <LiveIndicator $active={isActivePolling} $color="#10b981">
                        {isActivePolling ? t('common:status.live', 'Live') : t('common:status.idle', 'Idle')}
                    </LiveIndicator>
                </Flex>
            </ContentWrapper>
            <Flex align="center" gap={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('updated', 'Updated')}: {lastUpdated}
                </Text>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    loading={isLoading}
                    size="small"
                >
                    {t('refresh', 'Refresh')}
                </Button>
            </Flex>
        </HeaderContainer>
    );
};
