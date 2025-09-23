import React from 'react';
import ReactDOM from 'react-dom';
import { PrintContainer } from './PrintContainer';
import { PrintContainerProps } from '@/types/print';

interface PrintPreviewProps extends PrintContainerProps {
  onClose: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = (props) => {
  const { onClose, ...printProps } = props;

  React.useEffect(() => {
    // Create a new window for print preview
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      console.error('Failed to open print preview window');
      onClose();
      return;
    }

    // Set up the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Preview - ${props.reportTitle}</title>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .preview-container { max-width: 100%; }
            .preview-actions { 
              position: fixed; 
              top: 10px; 
              right: 10px; 
              background: white; 
              padding: 10px; 
              border: 1px solid #ccc; 
              border-radius: 4px; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              z-index: 1000;
            }
            .preview-actions button { 
              margin: 0 5px; 
              padding: 8px 16px; 
              border: 1px solid #ccc; 
              border-radius: 4px; 
              cursor: pointer;
              background: white;
            }
            .preview-actions button:hover { background: #f5f5f5; }
            .preview-actions button.primary { 
              background: #007bff; 
              color: white; 
              border-color: #007bff; 
            }
            .preview-actions button.primary:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="preview-actions">
            <button onclick="window.print()" class="primary">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
          <div class="preview-container">
            <div id="print-preview-root"></div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();

    // Render the print container in the new window
    const printRoot = printWindow.document.getElementById('print-preview-root');
    if (printRoot) {
      // Create a React container in the new window
      const root = ReactDOM.createRoot(printRoot);
      root.render(
        React.createElement(PrintContainer, {
          ...printProps,
          onPrintComplete: () => {
            printWindow.close();
            onClose();
          }
        })
      );
    }

    // Handle window close
    const handleClose = () => {
      onClose();
    };

    printWindow.addEventListener('beforeunload', handleClose);

    // Focus the print window
    printWindow.focus();

    // Cleanup
    return () => {
      if (!printWindow.closed) {
        printWindow.removeEventListener('beforeunload', handleClose);
        printWindow.close();
      }
    };
  }, [props, onClose]);

  return null; // This component doesn't render in the main window
};