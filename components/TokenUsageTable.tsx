
import React from 'react';
import type { TokenUsageTableRow } from '../types';

// Types for sorting
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: keyof TokenUsageTableRow;
  direction: SortDirection;
}

interface TokenUsageTableProps {
  data: TokenUsageTableRow[];
  onSort: (key: keyof TokenUsageTableRow) => void;
  sortConfig: SortConfig | null;
}

const SortIndicator: React.FC<{ direction: SortDirection }> = ({ direction }) => (
    <span className="ml-1 opacity-80">{direction === 'ascending' ? '▲' : '▼'}</span>
);

interface SortableThProps {
    sortKey: keyof TokenUsageTableRow;
    onSort: (key: keyof TokenUsageTableRow) => void;
    sortConfig: SortConfig | null;
    children: React.ReactNode;
    className?: string;
}

const SortableTh: React.FC<SortableThProps> = ({ sortKey, onSort, sortConfig, children, className = '' }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : undefined;

    return (
        <th scope="col" className={`px-4 py-3 ${className}`} aria-sort={direction || 'none'}>
            <button
                onClick={() => onSort(sortKey)}
                className={`flex items-center gap-1 hover:text-white transition-colors w-full ${className.includes('text-right') ? 'justify-end' : ''}`}
            >
                {children}
                {isSorted && <SortIndicator direction={direction!} />}
            </button>
        </th>
    );
};


const TokenUsageTable: React.FC<TokenUsageTableProps> = ({ data, onSort, sortConfig }) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full text-sm text-left">
        <thead className="border-b border-[var(--theme-border)] text-xs text-gray-200 uppercase">
          <tr>
            <SortableTh sortKey="userName" onSort={onSort} sortConfig={sortConfig}>User</SortableTh>
            <SortableTh sortKey="fundName" onSort={onSort} sortConfig={sortConfig}>Fund</SortableTh>
            <SortableTh sortKey="date" onSort={onSort} sortConfig={sortConfig}>Date</SortableTh>
            <SortableTh sortKey="feature" onSort={onSort} sortConfig={sortConfig}>Feature</SortableTh>
            <SortableTh sortKey="model" onSort={onSort} sortConfig={sortConfig}>Model</SortableTh>
            <SortableTh sortKey="input" onSort={onSort} sortConfig={sortConfig} className="text-right">Input</SortableTh>
            <SortableTh sortKey="cached" onSort={onSort} sortConfig={sortConfig} className="text-right">Cached</SortableTh>
            <SortableTh sortKey="output" onSort={onSort} sortConfig={sortConfig} className="text-right">Output</SortableTh>
            <SortableTh sortKey="total" onSort={onSort} sortConfig={sortConfig} className="text-right">Total</SortableTh>
            <SortableTh sortKey="cost" onSort={onSort} sortConfig={sortConfig} className="text-right">Cost (USD)</SortableTh>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
              data.map((row, index) => (
                  <tr key={`${row.user}-${row.session}-${row.feature}-${row.model}-${index}`} className="border-b border-[var(--theme-border)] hover:bg-[var(--theme-bg-secondary)]/50">
                      <td className="px-4 py-2 font-medium text-white truncate" title={row.user}>{row.userName}</td>
                      <td className="px-4 py-2 text-white">{row.fundName}</td>
                      <td className="px-4 py-2 text-white">{row.date}</td>
                      <td className="px-4 py-2 text-white">{row.feature}</td>
                      <td className="px-4 py-2 text-white font-mono text-xs">{row.model}</td>
                      <td className="px-4 py-2 text-white text-right">{row.input.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white text-right">{row.cached.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white text-right">{row.output.toLocaleString()}</td>
                      <td className="px-4 py-2 text-white font-semibold text-right">{row.total.toLocaleString()}</td>
                      <td className="px-4 py-2 text-[var(--theme-gradient-end)] font-semibold text-right">${row.cost.toFixed(4)}</td>
                  </tr>
              ))
          ) : (
              <tr>
                  <td colSpan={10} className="text-center py-8 text-white">
                      No token usage data found for the current search criteria.
                  </td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TokenUsageTable;
