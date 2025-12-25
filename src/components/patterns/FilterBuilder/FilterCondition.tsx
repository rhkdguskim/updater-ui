import React, { useState } from 'react';
import { Select, Input, InputNumber, DatePicker, Space } from 'antd';
import styled from 'styled-components';
import type { Dayjs } from 'dayjs';

const ConditionContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--ant-color-bg-container, #fff);
    border: 1px solid var(--ant-color-border, #d9d9d9);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const StyledSelect = styled(Select)`
    min-width: 120px;
`;

export interface FilterField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'boolean';
    options?: { value: string; label: string }[];
}

export interface FilterOperator {
    value: string;
    label: string;
}

const textOperators: FilterOperator[] = [
    { value: 'contains', label: '포함' },
    { value: 'equals', label: '같음' },
    { value: 'startsWith', label: '로 시작' },
    { value: 'endsWith', label: '로 끝남' },
];

const numberOperators: FilterOperator[] = [
    { value: 'equals', label: '=' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
];

const selectOperators: FilterOperator[] = [
    { value: 'equals', label: '같음' },
    { value: 'notEquals', label: '같지 않음' },
];

const dateOperators: FilterOperator[] = [
    { value: 'equals', label: '같은 날' },
    { value: 'before', label: '이전' },
    { value: 'after', label: '이후' },
];

export interface FilterConditionValue {
    field: string;
    operator: string;
    value: string | number | boolean | null;
}

export interface FilterConditionProps {
    fields: FilterField[];
    onApply: (condition: FilterConditionValue) => void;
}

export const FilterCondition: React.FC<FilterConditionProps> = ({
    fields,
    onApply,
}) => {
    const [selectedField, setSelectedField] = useState<string | undefined>();
    const [selectedOperator, setSelectedOperator] = useState<string | undefined>();
    const [value, setValue] = useState<string | number | Dayjs | null>(null);

    const currentField = fields.find(f => f.key === selectedField);

    const getOperators = (): FilterOperator[] => {
        if (!currentField) return [];
        switch (currentField.type) {
            case 'text': return textOperators;
            case 'number': return numberOperators;
            case 'select': return selectOperators;
            case 'date': return dateOperators;
            case 'boolean': return selectOperators;
            default: return textOperators;
        }
    };

    const handleApply = () => {
        if (selectedField && selectedOperator && value !== null) {
            const finalValue = typeof value === 'object' && 'format' in value
                ? value.format('YYYY-MM-DD')
                : value;
            onApply({
                field: selectedField,
                operator: selectedOperator,
                value: finalValue as string | number | boolean,
            });
        }
    };

    const renderValueInput = () => {
        if (!currentField) return null;

        switch (currentField.type) {
            case 'text':
                return (
                    <Input
                        placeholder="값 입력"
                        size="small"
                        style={{ width: 150 }}
                        value={value as string}
                        onChange={(e) => setValue(e.target.value)}
                        onPressEnter={handleApply}
                    />
                );
            case 'number':
                return (
                    <InputNumber
                        placeholder="숫자"
                        size="small"
                        style={{ width: 100 }}
                        value={value as number}
                        onChange={(v) => setValue(v as number | null)}
                    />
                );
            case 'select':
                return (
                    <StyledSelect
                        placeholder="선택"
                        size="small"
                        style={{ width: 150 }}
                        value={value as string}
                        onChange={(v) => setValue(v as string)}
                        options={currentField.options}
                    />
                );
            case 'date':
                return (
                    <DatePicker
                        size="small"
                        value={value as Dayjs}
                        onChange={(d) => setValue(d)}
                    />
                );
            case 'boolean':
                return (
                    <StyledSelect
                        placeholder="선택"
                        size="small"
                        style={{ width: 100 }}
                        value={value as string}
                        onChange={(v) => setValue(v as string)}
                        options={[
                            { value: 'true', label: '예' },
                            { value: 'false', label: '아니오' },
                        ]}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <ConditionContainer>
            <Space size="small">
                <StyledSelect
                    placeholder="필드 선택"
                    size="small"
                    value={selectedField}
                    onChange={(v) => {
                        setSelectedField(v as string);
                        setSelectedOperator(undefined);
                        setValue(null);
                    }}
                    options={fields.map(f => ({ value: f.key, label: f.label }))}
                />
                {selectedField && (
                    <StyledSelect
                        placeholder="조건"
                        size="small"
                        value={selectedOperator}
                        onChange={(v) => setSelectedOperator(v as string)}
                        options={getOperators()}
                    />
                )}
                {selectedOperator && renderValueInput()}
            </Space>
        </ConditionContainer>
    );
};

export default FilterCondition;
