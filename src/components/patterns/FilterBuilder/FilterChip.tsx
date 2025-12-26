import React from 'react';
import { Tag, Button } from 'antd';
import styled from 'styled-components';
import { MinusCircleOutlined } from '@ant-design/icons';

const ChipContainer = styled(Tag)`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    margin: 2px;
    background: var(--ant-color-primary-bg, #e6f4ff);
    border: 1px solid var(--ant-color-primary-border, #91caff);
    color: var(--ant-color-primary, #1677ff);

    .filter-field {
        font-weight: 500;
    }

    .filter-operator {
        color: var(--ant-color-text-secondary, #8c8c8c);
    }

    .filter-value {
        font-weight: 600;
    }
`;

const RemoveButton = styled(Button)`
    &.ant-btn {
        padding: 0;
        width: 18px;
        height: 18px;
        min-width: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ant-color-error, #ff4d4f);
        border: none;
        background: transparent;
        
        &:hover {
            color: var(--ant-color-error-hover, #ff7875);
            background: var(--ant-color-error-bg, #fff2f0);
        }
    }
`;

export interface FilterChipProps {
    field: string;
    operator: string;
    value: string;
    onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
    field,
    operator,
    value,
    onRemove,
}) => {
    return (
        <ChipContainer>
            <span className="filter-field">{field}</span>
            <span className="filter-operator">{operator}</span>
            <span className="filter-value">{value}</span>
            <RemoveButton
                type="text"
                size="small"
                icon={<MinusCircleOutlined style={{ fontSize: 14 }} />}
                onClick={onRemove}
            />
        </ChipContainer>
    );
};

export default FilterChip;
