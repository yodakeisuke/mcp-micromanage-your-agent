import { useState, useEffect, useRef, useCallback } from 'react';
import { CommitStatus } from '../types';

// Filter settings type
export interface FilterOptions {
  statusFilter: CommitStatus | 'all';
  searchQuery: string;
  onlyShowActive: boolean; // Show only active PRs/commits
}

interface FilterPanelProps {
  options: FilterOptions;
  onChange: (newOptions: FilterOptions) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Status display name mapping
const STATUS_LABELS: Record<CommitStatus | 'all', string> = {
  'all': 'All',
  'not_started': 'Not Started',
  'in_progress': 'In Progress',
  'blocked': 'Blocked',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'needsRefinment': 'Needs Refinement',
  'user_review': 'Awaiting User Review'
};

// Status icon mapping
const STATUS_ICONS: Record<CommitStatus | 'all', string> = {
  'all': '🔍',
  'not_started': '⚪',
  'in_progress': '🔄',
  'blocked': '⛔',
  'completed': '✅',
  'cancelled': '❌',
  'needsRefinment': '⚠️',
  'user_review': '👀'
};

// Pre-generate status options
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([status, label]) => (
  <option key={status} value={status}>
    {STATUS_ICONS[status as CommitStatus | 'all']} {label}
  </option>
));

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  options, 
  onChange,
  isOpen,
  onClose
}) => {
  const [localOptions, setLocalOptions] = useState<FilterOptions>(options);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Update internal state when options from props change
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);
  
  // Change handler (memoized)
  const handleChange = useCallback((key: keyof FilterOptions, value: any) => {
    const newOptions = { ...localOptions, [key]: value };
    setLocalOptions(newOptions);
    onChange(newOptions);
  }, [localOptions, onChange]);
  
  // Reset handler (memoized)
  const handleReset = useCallback(() => {
    const defaultOptions: FilterOptions = {
      statusFilter: 'all',
      searchQuery: '',
      onlyShowActive: false
    };
    setLocalOptions(defaultOptions);
    onChange(defaultOptions);
  }, [onChange]);
  
  // Close when clicking outside the panel
  useEffect(() => {
    if (!isOpen) return;
    
    const handleOutsideClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);
  
  // Close panel with Esc key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 transition-all duration-300"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="mr-2">🔍</span>
          Filter Settings
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Status filter */}
        <div className="transition-all duration-200 hover:shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="relative">
            <select
              value={localOptions.statusFilter}
              onChange={(e) => handleChange('statusFilter', e.target.value)}
              className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              {STATUS_OPTIONS}
            </select>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              {STATUS_ICONS[localOptions.statusFilter as CommitStatus | 'all']}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Search filter */}
        <div className="transition-all duration-200 hover:shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={localOptions.searchQuery}
              onChange={(e) => handleChange('searchQuery', e.target.value)}
              placeholder="Search in commit content..."
              className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            {localOptions.searchQuery && (
              <button
                onClick={() => handleChange('searchQuery', '')}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Show only active items */}
        <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
          <input
            type="checkbox"
            id="onlyActive"
            checked={localOptions.onlyShowActive}
            onChange={(e) => handleChange('onlyShowActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
          />
          <label htmlFor="onlyActive" className="ml-2 block text-sm text-gray-700">
            Show only active tasks
          </label>
        </div>
        
        {/* Filter badge display */}
        {(localOptions.statusFilter !== 'all' || 
         localOptions.searchQuery.trim() || 
         localOptions.onlyShowActive) && (
          <div className="flex flex-wrap gap-2 pt-2 pb-3">
            <p className="w-full text-xs text-gray-500 mb-1">Active filters:</p>
            
            {localOptions.statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {STATUS_ICONS[localOptions.statusFilter as CommitStatus]}
                <span className="ml-1">{STATUS_LABELS[localOptions.statusFilter as CommitStatus]}</span>
                <button
                  onClick={() => handleChange('statusFilter', 'all')}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            )}
            
            {localOptions.searchQuery.trim() && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                🔍 {localOptions.searchQuery}
                <button
                  onClick={() => handleChange('searchQuery', '')}
                  className="ml-1 text-green-500 hover:text-green-700"
                >
                  ×
                </button>
              </span>
            )}
            
            {localOptions.onlyShowActive && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                🔄 Active Only
                <button
                  onClick={() => handleChange('onlyShowActive', false)}
                  className="ml-1 text-yellow-500 hover:text-yellow-700"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
        
        {/* Reset button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel; 