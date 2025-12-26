import React, { useState, useCallback } from 'react';
import { Button, Popover } from 'antd';
import { PlusOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FilterChip } from './FilterChip';
import { FilterCondition, type FilterField, type FilterConditionValue } from './FilterCondition';

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    gap: 12px;
    flex-wrap: wrap;
`;

const FiltersSection = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex: 1;
`;

const ActionsSection = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const ChipsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
`;

export interface FilterValue {
    id: string;
    field: string;
    fieldLabel: string;
    operator: string;
    operatorLabel: string;
    value: string | number | boolean;
    displayValue: string;
}

export interface FilterBuilderProps {
    fields: FilterField[];
    filters: FilterValue[];
    onFiltersChange: (filters: FilterValue[]) => void;
    onRefresh?: () => void;
    onAdd?: () => void;
    canAdd?: boolean;
    addLabel?: string;
    loading?: boolean;
    extra?: React.ReactNode;
}

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
    fields,
    filters,
    onFiltersChange,
    onRefresh,
    onAdd,
    canAdd = true,
    addLabel,
    loading = false,
    extra,
}) => {
    const { t } = useTranslation('common');
    const [conditionOpen, setConditionOpen] = useState(false);

    const operatorLabels: Record<string, string> = {
        contains: t('filter.contains'),
        equals: '=',
        notEquals: '≠',
        startsWith: t('filter.startsWith'),
        endsWith: t('filter.endsWith'),
        gt: '>',
        gte: '≥',
        lt: '<',
        lte: '≤',
        before: t('filter.before'),
        after: t('filter.after'),
    };

    const handleAddFilter = useCallback((condition: FilterConditionValue) => {
        const field = fields.find(f => f.key === condition.field);
        if (!field || condition.value === null) return;

        let displayValue = String(condition.value);
        if (field.type === 'select' && field.options) {
            const option = field.options.find(o => o.value === condition.value);
            displayValue = option?.label || displayValue;
        } else if (field.type === 'boolean') {
            displayValue = condition.value === 'true' || condition.value === true ? t('yes') : t('no');
        }

        const newFilter: FilterValue = {
            id: `${condition.field}-${Date.now()}`,
            field: condition.field,
            fieldLabel: field.label,
            operator: condition.operator,
            operatorLabel: operatorLabels[condition.operator] || condition.operator,
            value: condition.value,
            displayValue,
        };

        onFiltersChange([...filters, newFilter]);
        setConditionOpen(false);
    }, [fields, filters, onFiltersChange, operatorLabels, t]);

    const handleRemoveFilter = useCallback((id: string) => {
        onFiltersChange(filters.filter(f => f.id !== id));
    }, [filters, onFiltersChange]);

    const handleClearAll = useCallback(() => {
        onFiltersChange([]);
    }, [onFiltersChange]);

    return (
        <Container>
            <FiltersSection>
                <Popover
                    content={
                        <FilterCondition
                            fields={fields}
                            onApply={handleAddFilter}
                        />
                    }
                    trigger="click"
                    open={conditionOpen}
                    onOpenChange={setConditionOpen}
                    placement="bottomLeft"
                >
                    <Button
                        icon={<PlusOutlined />}
                        size="small"
                        type="default"
                        style={{
                            borderColor: 'var(--ant-color-primary, #1677ff)',
                            color: 'var(--ant-color-primary, #1677ff)',
                            fontWeight: 500,
                        }}
                    >
                        {t('filter.addFilter')}
                    </Button>
                </Popover>



                {filters.length > 0 && (
                    <>
                        <ChipsContainer>
                            {filters.map((filter) => (
                                <FilterChip
                                    key={filter.id}
                                    field={filter.fieldLabel}
                                    operator={filter.operatorLabel}
                                    value={filter.displayValue}
                                    onRemove={() => handleRemoveFilter(filter.id)}
                                />
                            ))}
                        </ChipsContainer>
                        <Button
                            type="text"
                            size="small"
                            icon={<ClearOutlined />}
                            onClick={handleClearAll}
                        >
                            {t('filter.clear')}
                        </Button>
                    </>
                )}
            </FiltersSection>

            <ActionsSection>
                {extra}
                {onRefresh && (
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={onRefresh}
                        loading={loading}
                        size="small"
                    />
                )}
                {onAdd && canAdd && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onAdd}
                        size="small"
                    >
                        {addLabel || t('actions.add')}
                    </Button>
                )}
            </ActionsSection>
        </Container>
    );
};

export default FilterBuilder;
