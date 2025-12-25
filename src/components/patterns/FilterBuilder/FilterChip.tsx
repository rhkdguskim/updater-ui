import React from 'react';
import { Tag } from 'antd';
import styled from 'styled-components';
import { CloseOutlined } from '@ant-design/icons';

const ChipContainer = styled(Tag)`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
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

    .close-icon {
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;

        &:hover {
            opacity: 1;
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
            <CloseOutlined className="close-icon" onClick={onRemove} />
        </ChipContainer>
    );
};

export default FilterChip;
