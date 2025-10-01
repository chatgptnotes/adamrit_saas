import React from 'react';
import { PrintContainer } from './PrintContainer';
import { PrintContainerProps } from '@/types/print';

interface PrintPreviewProps extends PrintContainerProps {
  onClose: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = (props) => {
  const { onClose, ...printProps } = props;

  React.useEffect(() => {
    // Trigger print dialog after a short delay
    const timeoutId = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className="print-preview-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 99999,
        overflow: 'auto',
        padding: '20px'
      }}
    >
      {/* Close button - hidden during print */}
      <div
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 100000
        }}
        className="no-print"
      >
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close Preview
        </button>
      </div>

      {/* Print Container */}
      <PrintContainer
        {...printProps}
        onPrintComplete={onClose}
      />

      <style>{`
        /* Screen styles */
        .print-preview-overlay {
          display: block;
        }

        /* Print styles */
        @media print {
          /* Hide close button */
          .no-print {
            display: none !important;
          }

          /* Convert overlay to normal flow for print */
          .print-preview-overlay {
            position: static !important;
            z-index: auto !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          /* Ensure body shows content */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Force print container to be visible */
          [data-print-content="true"] {
            display: block !important;
            visibility: visible !important;
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
};