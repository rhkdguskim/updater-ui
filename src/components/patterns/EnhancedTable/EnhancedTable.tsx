import React from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';
import styled from 'styled-components';
import { SelectionToolbar, type ToolbarAction } from './SelectionToolbar';

const TableContainer = styled.div`
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    /* Compact row heights */
    .ant-table-tbody > tr > td {
        padding: 6px 8px !important;
    }

    .ant-table-thead > tr > th {
        padding: 8px !important;
        font-size: 12px;
        font-weight: 600;
    }

    /* Row hover effects - Monday.com style */
    .ant-table-tbody > tr {
        transition: background-color 0.15s ease;

        &:hover {
            background-color: var(--ant-color-primary-bg, #e6f4ff) !important;
        }

        /* Show checkbox on hover */
        .ant-table-selection-column .ant-checkbox-wrapper {
            opacity: 0.3;
            transition: opacity 0.15s ease;
        }

        &:hover .ant-table-selection-column .ant-checkbox-wrapper,
        &.ant-table-row-selected .ant-table-selection-column .ant-checkbox-wrapper {
            opacity: 1;
        }
    }

    /* Selected row style */
    .ant-table-tbody > tr.ant-table-row-selected {
        background-color: var(--ant-color-primary-bg-hover, #bae0ff) !important;

        > td {
            background: transparent !important;
        }
    }

    /* Action cell hover effects */
    .hover-action-cell {
        opacity: 0;
        transition: opacity 0.15s ease;
    }

    .ant-table-tbody > tr:hover .hover-action-cell {
        opacity: 1;
    }

    /* Always visible action cell (for edit/delete/view) */
    .action-cell {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* Table wrapper takes remaining space but allows scroll */
    .ant-table-wrapper {
        flex: 1;
        min-height: 0;
        overflow: auto;
    }

    /* Table content area */
    .ant-table-content {
        overflow: auto !important;
    }

    /* Prevent tbody rows from stretching - rows should only be as tall as their content */
    .ant-table-tbody {
        & > tr {
            height: auto !important;
        }
    }

    /* Sticky header */
    .ant-table-thead > tr > th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: var(--ant-color-bg-container, #fff);
    }

    /* Compact select dropdowns in cells */
    .ant-select-selector {
        font-size: 12px !important;
    }

    /* Editable cell styling */
    .editable-cell {
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        transition: background-color 0.15s ease;

        &:hover {
            background-color: var(--ant-color-fill-quaternary, #f5f5f5);
        }
    }
`;


export interface EnhancedTableProps<T> extends Omit<TableProps<T>, 'rowSelection'> {
    /** Selection toolbar actions */
    selectionActions?: ToolbarAction[];
    /** Selected row keys */
    selectedRowKeys?: React.Key[];
    /** Callback when selection changes */
    onSelectionChange?: (keys: React.Key[], rows: T[]) => void;
    /** Custom selection label */
    selectionLabel?: string;
    /** Row key field */
    rowKeyField?: string;
}

export function EnhancedTable<T extends object>({
    selectionActions = [],
    selectedRowKeys = [],
    onSelectionChange,
    selectionLabel,
    rowKeyField = 'id',
    ...tableProps
}: EnhancedTableProps<T>) {
    const handleClearSelection = () => {
        onSelectionChange?.([], []);
    };

    const rowSelection: TableProps<T>['rowSelection'] = onSelectionChange
        ? {
            selectedRowKeys,
            onChange: (keys, rows) => onSelectionChange(keys, rows),
            columnWidth: 40,
        }
        : undefined;

    return (
        <TableContainer>
            <SelectionToolbar
                selectedCount={selectedRowKeys.length}
                actions={selectionActions}
                onClearSelection={handleClearSelection}
                selectionLabel={selectionLabel}
            />
            <Table<T>
                {...tableProps}
                rowSelection={rowSelection}
                rowKey={(tableProps.rowKey as string) || rowKeyField}
                size="small"
            />
        </TableContainer>
    );
}

export default EnhancedTable;
