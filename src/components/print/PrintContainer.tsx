import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { PrintContainerProps } from '@/types/print';
import { getNestedValue, formatCellValue } from '@/hooks/usePrintColumns';

export const PrintContainer: React.FC<PrintContainerProps> = ({
  reportTitle,
  columns,
  data,
  settings,
  appliedFilters,
  onPrintComplete
}) => {
  const selectedColumns = columns.filter(col => 
    settings.selectedColumnIds.includes(col.id)
  );

  useEffect(() => {
    // Auto-trigger print when component mounts
    const timeoutId = setTimeout(() => {
      window.print();
      if (onPrintComplete) {
        onPrintComplete();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [onPrintComplete]);

  const generateFilterSummary = () => {
    if (!appliedFilters || Object.keys(appliedFilters).length === 0) {
      return 'No filters applied - Showing all records';
    }

    const filterParts: string[] = [];
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          filterParts.push(`${key}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          filterParts.push(`${key}: ${value}`);
        }
      }
    });

    return filterParts.length > 0 
      ? filterParts.join(' | ') 
      : 'No filters applied - Showing all records';
  };

  // Debug logging
  console.log('PrintContainer - Data:', data);
  console.log('PrintContainer - Columns:', columns);
  console.log('PrintContainer - Settings:', settings);
  console.log('PrintContainer - Selected columns:', selectedColumns);

  return (
    <div id="print-root" className="print-container">
      {/* Print Header */}
      <div className="print-header">
        <div className="report-title">
          <h1>{reportTitle}</h1>
          {settings.showDateTime && (
            <p className="report-date">
              Generated on {format(new Date(), 'EEEE, MMMM do, yyyy \'at\' HH:mm')}
            </p>
          )}
        </div>
        
        {settings.showFilters && (
          <div className="filters-summary">
            <h3>Applied Filters:</h3>
            <p>{generateFilterSummary()}</p>
          </div>
        )}

        <div className="report-stats">
          <p>
            Showing {data.length} record{data.length !== 1 ? 's' : ''} 
            {selectedColumns.length > 0 && ` across ${selectedColumns.length} column${selectedColumns.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Print Table */}
      <div className="print-table-container">
        <table className="print-table">
          <thead>
            <tr>
              {selectedColumns.map((column) => (
                <th
                  key={column.id}
                  className={`print-th ${column.align || 'left'}`}
                  style={{ width: column.widthPx ? `${column.widthPx}px` : 'auto' }}
                >
                  <div className="print-header-content">
                    {column.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
              // Debug first row
              if (rowIndex === 0) {
                console.log('First row:', row);
                console.log('Row keys:', Object.keys(row));
              }
              
              return (
                <tr key={rowIndex} className="print-tr">
                  {selectedColumns.map((column) => {
                    const rawValue = getNestedValue(row, column.accessorKey);
                    const formattedValue = formatCellValue(rawValue, column);
                    
                    // Debug first row values
                    if (rowIndex === 0) {
                      console.log(`Column ${column.id} (${column.accessorKey}): ${rawValue} → ${formattedValue}`);
                    }
                    
                    return (
                      <td
                        key={column.id}
                        className={`print-td ${column.align || 'left'}`}
                      >
                        <div className="print-cell-content">
                          {formattedValue}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Print Footer */}
      {settings.showPageNumbers && (
        <div className="print-footer">
          <div className="page-info">
            <span className="page-number">Page <span className="page-counter"></span></span>
            <span className="total-pages"> of <span className="total-counter"></span></span>
          </div>
          <div className="report-footer">
            {reportTitle} - {format(new Date(), 'yyyy-MM-dd HH:mm')}
          </div>
        </div>
      )}

      {/* Embedded CSS for print styling */}
      <style jsx>{`
        .print-container {
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 0;
        }

        .print-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #000;
        }

        .report-title h1 {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 5px 0;
          color: #000;
        }

        .report-date {
          font-size: 11px;
          color: #666;
          margin: 0;
        }

        .filters-summary {
          margin: 15px 0 10px 0;
        }

        .filters-summary h3 {
          font-size: 12px;
          font-weight: bold;
          margin: 0 0 5px 0;
        }

        .filters-summary p {
          font-size: 11px;
          color: #333;
          margin: 0;
          word-wrap: break-word;
        }

        .report-stats {
          margin-top: 10px;
        }

        .report-stats p {
          font-size: 11px;
          color: #666;
          margin: 0;
        }

        .print-table-container {
          width: 100%;
          overflow: visible;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          font-size: 10px;
        }

        .print-th {
          background-color: #f5f5f5;
          border: 1px solid #000;
          padding: 8px 6px;
          font-weight: bold;
          font-size: 10px;
          vertical-align: middle;
          page-break-inside: avoid;
        }

        .print-th.left {
          text-align: left;
        }

        .print-th.center {
          text-align: center;
        }

        .print-th.right {
          text-align: right;
        }

        .print-header-content {
          word-wrap: break-word;
          hyphens: auto;
          line-height: 1.2;
        }

        .print-td {
          border: 1px solid #000;
          padding: 6px 6px;
          vertical-align: top;
          font-size: 9px;
          page-break-inside: avoid;
        }

        .print-td.left {
          text-align: left;
        }

        .print-td.center {
          text-align: center;
        }

        .print-td.right {
          text-align: right;
        }

        .print-cell-content {
          word-wrap: break-word;
          hyphens: auto;
          line-height: 1.3;
          max-width: 100%;
        }

        .print-tr {
          page-break-inside: avoid;
        }

        .print-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-top: 1px solid #ccc;
          background: #fff;
          font-size: 10px;
        }

        .page-info {
          font-weight: bold;
        }

        .report-footer {
          color: #666;
        }

        /* Page break controls */
        @page {
          size: ${settings.pageSize} ${settings.orientation};
          margin: 0.5in 0.3in 0.7in 0.3in;
        }

        /* Ensure table headers repeat on each page */
        thead {
          display: table-header-group;
        }

        tbody {
          display: table-row-group;
        }

        tfoot {
          display: table-footer-group;
        }

        /* CSS counters for page numbers */
        .page-counter::after {
          content: counter(page);
        }

        .total-counter::after {
          content: counter(pages);
        }

        /* Landscape-specific adjustments */
        ${settings.orientation === 'landscape' ? `
          .print-table {
            font-size: 9px;
          }
          
          .print-th {
            padding: 6px 4px;
            font-size: 9px;
          }
          
          .print-td {
            padding: 4px 4px;
            font-size: 8px;
          }
        ` : ''}

        /* Responsive column widths for better fit */
        .print-table {
          table-layout: fixed;
        }

        /* Break long words */
        .print-cell-content {
          word-break: break-word;
          overflow-wrap: break-word;
        }

        /* Hide scrollbars in print */
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};