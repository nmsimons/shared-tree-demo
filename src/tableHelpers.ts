import { Row, Table } from './tableSchema';
import {
    brand,
    EditableTree,
    getField,
    parentField,
} from '@fluid-experimental/tree2';
import { Guid } from 'guid-typescript';

function getRowIndex(row: number | Row) {
    if (typeof row === 'number') {
        return row;
    }

    return row[parentField].index;
}

function getRow(table: Table, row: number | Row) {
    if (typeof row === 'object') {
        return row;
    }

    if (row >= table.rows.length || row < 0) {
        return undefined;
    }
    return table.rows[row];
}

function getColumnId(table: Table, column: string | number) {
    if (typeof column === 'string') {
        return column;
    }

    if (column >= table.columnDefinitions.length || column < 0) {
        return undefined;
    }
    return table.columnDefinitions[column].id;
}

function getColumnIndex(table: Table, column: string | number) {
    if (typeof column === 'number') {
        if (column >= table.columnDefinitions.length || column < 0) {
            return -1;
        }
        return column;
    }

    for (let i = 0; i < table.columnDefinitions.length; i++) {
        if (table.columnDefinitions[i].id === column) {
            return i;
        }
    }

    return -1;
}

/**
 *  Add a new row to the table at the given index
 */
export function addRow(table: Table, index: number) {
    if (index > table.rows.length || index < 0) {
        throw new Error('invalid row index');
    }

    table.rows.insertNodes(index, [{}]);
}

/**
 * Add a new column to the table at the given index
 */
export function addColumn(table: Table, index: number, columnName: string) {
    if (index > table.columnDefinitions.length || index < 0) {
        throw new Error('invalid column index');
    }

    table.columnDefinitions.insertNodes(index, {id: Guid.create().toString(), name: columnName});
}

/**
 * Remove an existing row in the table
 */
export function deleteRow(table: Table, row: Row | number) {
    const index = getRowIndex(row);
    if (index >= table.rows.length || index < 0) {
        throw new Error('invalid row');
    }

    table.rows.deleteNodes(index);
}

/**
 * Remove an existing column in the table by index or id
 */
export function deleteColumn(table: Table, column: string | number) {
    const id = getColumnId(table, column);
    if (id === undefined) {
        throw new Error('invalid column');
    }

    const index = getColumnIndex(table, column);
    if (index === -1) {
        throw new Error('invalid column');
    }

    table.columnDefinitions.deleteNodes(index);

    // This is expensive for long tables, we could do this lazily or not at all.
    for (const row of table.rows) {
        setCellContent(table, row, id, undefined);
    }
}

/**
 * Move a row to another position in the table
 */
export function moveRow(table: Table, row: Row | number, newIndex: number) {
    if (newIndex >= table.rows.length || newIndex < 0) {
        throw new Error('invalid index');
    }

    const index = getRowIndex(row);
    if (index >= table.rows.length || index < 0) {
        throw new Error('invalid row');
    }

    table.rows.moveNodes(index, 1, newIndex);
}

/**
 * Move a column to another position in the table
 */
export function moveColumn(table: Table, oldIndex: number, newIndex: number) {
    if (oldIndex >= table.columnDefinitions.length || oldIndex < 0) {
        throw new Error('invalid old column index');
    }
    if (newIndex >= table.columnDefinitions.length || newIndex < 0) {
        throw new Error('invalid new column index');
    }

    table.columnDefinitions.moveNodes(oldIndex, 1, newIndex);
}

/**
 * Put content in a cell
 */
export function setCellContent(
    table: Table,
    row: Row | number,
    column: string | number,
    content: string | number | undefined
) {
    const columnName = getColumnId(table, column);
    if (columnName === undefined) {
        throw new Error('invalid column');
    }

    const found = getRow(table, row);
    if (found === undefined) {
        throw new Error('row not found');
    }
    // TODO: update this when we have map methods
    const cast = found as unknown as EditableTree;
    cast[getField](brand(columnName)).setContent(content);
    // cast[setField](brand(columnName), content);
}

/**
 * Edit the visible column name
 */
export function setColumnName(table: Table, column: string | number, name: string) {
    const index = getColumnIndex(table, column);
    if (index === -1) {
        throw new Error('invalid column');
    }

    table.columnDefinitions[index].name = name;
}
