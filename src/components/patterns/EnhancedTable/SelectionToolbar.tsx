import React from 'react';
import { Space, Button, Typography, Divider } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Text } = Typography;

const ToolbarContainer = styled.div`
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: linear-gradient(135deg, var(--ant-color-primary, #1677ff) 0%, var(--ant-color-primary-hover, #4096ff) 100%);
    border-radius: 8px;
    margin-bottom: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.2s ease-out;

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const SelectionInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
`;

const ActionGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const StyledButton = styled(Button)`
    &.ant-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            color: white;
        }

        &.ant-btn-dangerous {
            background: rgba(255, 77, 79, 0.8);
            border-color: rgba(255, 77, 79, 0.9);

            &:hover {
                background: rgba(255, 77, 79, 1);
            }
        }
    }
`;

const CloseButton = styled(Button)`
    &.ant-btn {
        color: white;
        opacity: 0.8;

        &:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.1);
        }
    }
`;

export interface ToolbarAction {
    key: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
}

export interface SelectionToolbarProps {
    selectedCount: number;
    actions: ToolbarAction[];
    onClearSelection?: () => void;
    selectionLabel?: string;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
    selectedCount,
    actions,
    onClearSelection,
    selectionLabel = '개 선택됨',
}) => {
    if (selectedCount === 0) return null;

    return (
        <ToolbarContainer>
            <SelectionInfo>
                <Text strong style={{ color: 'white', fontSize: 14 }}>
                    {selectedCount}{selectionLabel}
                </Text>
                <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.3)', height: 20 }} />
            </SelectionInfo>

            <ActionGroup>
                <Space size="small">
                    {actions.map((action) => (
                        <StyledButton
                            key={action.key}
                            icon={action.icon}
                            onClick={action.onClick}
                            danger={action.danger}
                            disabled={action.disabled}
                            size="small"
                        >
                            {action.label}
                        </StyledButton>
                    ))}
                </Space>

                {onClearSelection && (
                    <CloseButton
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={onClearSelection}
                        size="small"
                    />
                )}
            </ActionGroup>
        </ToolbarContainer>
    );
};

export default SelectionToolbar;
