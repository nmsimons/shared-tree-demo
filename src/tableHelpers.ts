import { Row, Table } from './tableSchema';
import { Guid } from 'guid-typescript';

function getRowIndex(table: Table, row: number | Row | string) {
    if (typeof row === 'number') {
        return row;
    }

    for (let i = 0; i < table.rows.length; i++) {
        if (table.rows[i] === row || table.rows[i].id === row) {
            return i;
        }
    }

    return -1;
}

function getRow(table: Table, row: number | Row | string) {
    if (typeof row === 'object') {
        return row;
    }

    if (typeof row === 'number') {
        if (row >= table.rows.length || row < 0) {
            return undefined;
        }
        return table.rows[row];
    }

    for (let i = 0; i < table.rows.length; i++) {
        if (table.rows[i].id === row) {
            return table.rows[i];
        }
    }

    return undefined;
}

/**
 *  Add a new row to the table at the given index
 */
export function addRow(table: Table, index: number) {
    if (index > table.rows.length || index < 0) {
        throw new Error('invalid row index');
    }

    const cells = new Array<string | number>(table.columnCount);
    for (let i = 0; i < table.columnCount; i++) {
        cells[i] = '';
    }
    const row = {
        id: Guid.create().toString(),
        cells,
    };
    table.rows.insertNodes(index, [row]);
    return row;
}

/**
 * Add a new column to the table at the given index
 */
export function addColumn(table: Table, index: number) {
    if (index > table.columnCount || index < 0) {
        throw new Error('invalid column index');
    }

    for (const row of table.rows) {
        row.cells.insertNodes(index, '');
    }
    table.columnCount++;
}

/**
 * Remove an existing row in the table
 */
export function deleteRow(table: Table, row: Row | number | string) {
    const index = getRowIndex(table, row);

    if (index >= table.rows.length || index < 0) {
        throw new Error('invalid row');
    }

    table.rows.deleteNodes(index);
}

/**
 * Remove an existing column in the table
 */
export function deleteColumn(table: Table, index: number) {
    if (index >= table.columnCount || index < 0) {
        throw new Error('invalid column index');
    }

    for (const row of table.rows) {
        row.cells.deleteNodes(index);
    }
    table.columnCount--;
}

/**
 * Move a row to another position in the table
 */
export function moveRow(table: Table, row: Row | number | string, newIndex: number) {
    if (newIndex >= table.rows.length || newIndex < 0) {
        throw new Error('invalid index');
    }

    const index = getRowIndex(table, row);
    if (index >= table.rows.length || index < 0) {
        throw new Error('invalid row');
    }

    table.rows.moveNodes(index, 1, newIndex);
}

/**
 * Move a column to another position in the table
 */
export function moveColumn(table: Table, oldIndex: number, newIndex: number) {
    if (oldIndex >= table.columnCount || oldIndex < 0) {
        throw new Error('invalid old column index');
    }
    if (newIndex >= table.columnCount || newIndex < 0) {
        throw new Error('invalid new column index');
    }

    for (const row of table.rows) {
        row.cells.moveNodes(oldIndex, 1, newIndex);
    }
}

/**
 * Put content in a cell
 */
export function setCellContent(
    table: Table,
    row: Row | number | string,
    column: number,
    content: string | number
) {
    if (column >= table.columnCount || column < 0) {
        throw new Error('invalid column index');
    }

    const found = getRow(table, row);
    if (found === undefined) {
        throw new Error('row not found');
    }
    found.cells[column] = content;
}
