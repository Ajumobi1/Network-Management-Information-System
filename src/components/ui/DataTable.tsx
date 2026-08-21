import { ReactNode } from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  caption?: string;
  onRowClick?: (row: T) => void;
};

function alignClass(align: DataTableColumn<unknown>['align'] = 'left') {
  return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
}

export default function DataTable<T>({ columns, rows, rowKey, empty = 'No records found.', caption, onRowClick }: DataTableProps<T>) {
  return <div className="nmis-table-wrap overflow-x-auto">
    <table className="nmis-table w-full">
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <thead><tr>{columns.map(column => <th key={column.key} className={`${alignClass(column.align)} ${column.className || ''}`.trim()}>{column.header}</th>)}</tr></thead>
      <tbody>{rows.length === 0 ? <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-brand-muted">{empty}</td></tr> : rows.map((row, index) => <tr key={rowKey(row, index)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'cursor-pointer' : undefined}>{columns.map(column => <td key={column.key} className={`${alignClass(column.align)} ${column.className || ''}`.trim()}>{column.render(row)}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
