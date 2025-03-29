import { useState, useRef, useEffect } from 'react';
import { WorkPlan } from '../types';
import { 
  downloadAsJSON, 
  downloadAsMarkdown, 
  downloadAsCSV 
} from '../utils/exportUtils';

interface ExportPanelProps {
  workplan: WorkPlan;
  isOpen: boolean;
  onClose: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ 
  workplan, 
  isOpen,
  onClose
}) => {
  const [fileName, setFileName] = useState('workplan');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside the panel
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);
  
  // Close panel with Esc key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Common download handler
  const handleDownload = async (format: string, downloadFn: () => void) => {
    setIsDownloading(format);
    try {
      // Add a slight delay to provide user feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      downloadFn();
    } finally {
      setTimeout(() => {
        setIsDownloading(null);
      }, 500);
    }
  };
  
  // Export as JSON format
  const handleJSONExport = () => {
    handleDownload('json', () => downloadAsJSON(workplan, `${fileName}.json`));
  };
  
  // Export as Markdown format
  const handleMarkdownExport = () => {
    handleDownload('markdown', () => downloadAsMarkdown(workplan, `${fileName}.md`));
  };
  
  // Export as CSV format
  const handleCSVExport = () => {
    handleDownload('csv', () => downloadAsCSV(workplan, `${fileName}.csv`));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 export-panel-container p-4">
      <div 
        ref={panelRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300"
        role="dialog"
        aria-labelledby="export-panel-title"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 
            id="export-panel-title" 
            className="text-xl font-bold text-gray-800 flex items-center"
          >
            <span className="mr-2">📊</span>
            Export
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <label 
            htmlFor="fileName" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Filename
          </label>
          <div className="relative">
            <input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter filename"
              aria-describedby="filename-desc"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p id="filename-desc" className="text-xs text-gray-500 mt-1">
            *File extension will be added automatically
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-3 mb-5">
          <button
            onClick={handleJSONExport}
            className={`flex items-center justify-center px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-md border border-blue-200 transition-all ${isDownloading === 'json' ? 'opacity-75 pointer-events-none' : ''}`}
            disabled={isDownloading !== null}
          >
            {isDownloading === 'json' ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="mr-2">📄</span>
            )}
            Export as JSON
          </button>
          
          <button
            onClick={handleMarkdownExport}
            className={`flex items-center justify-center px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-md border border-purple-200 transition-all ${isDownloading === 'markdown' ? 'opacity-75 pointer-events-none' : ''}`}
            disabled={isDownloading !== null}
          >
            {isDownloading === 'markdown' ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="mr-2">📝</span>
            )}
            Export as Markdown
          </button>
          
          <button
            onClick={handleCSVExport}
            className={`flex items-center justify-center px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-md border border-green-200 transition-all ${isDownloading === 'csv' ? 'opacity-75 pointer-events-none' : ''}`}
            disabled={isDownloading !== null}
          >
            {isDownloading === 'csv' ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="mr-2">📊</span>
            )}
            Export as CSV
          </button>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Export Format Explanation:</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
            <li>
              <span className="font-medium text-blue-600">JSON:</span> Original data format. Ideal for reuse or import in other applications.
            </li>
            <li>
              <span className="font-medium text-purple-600">Markdown:</span> Readable document format. Can be displayed in GitHub and similar platforms.
            </li>
            <li>
              <span className="font-medium text-green-600">CSV:</span> Format for spreadsheet software. Suitable for analysis in Excel and similar tools.
            </li>
          </ul>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel; 