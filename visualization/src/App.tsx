import { useState, useEffect, useCallback, useRef } from 'react'
import { ReactFlowProvider } from 'reactflow'
import WorkplanFlow from './components/WorkplanFlow'
import FilterPanel, { FilterOptions } from './components/FilterPanel'
import OrientationWarning from './components/OrientationWarning'
import { WorkPlan, CommitStatus } from './types'
import { useBreakpoint } from './utils/responsiveUtils'
import './App.css'

function App() {
  // Get breakpoint
  const breakpoint = useBreakpoint();
  
  // Initialize with normalized sample data
  const [workplan, setWorkplan] = useState<WorkPlan | null>(null);
  const [lastLoadedTime, setLastLoadedTime] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Polling interval (milliseconds)
  const [pollingInterval, setPollingInterval] = useState<number>(5000); // Default: 1 second
  // Whether polling is enabled
  const [pollingEnabled, setPollingEnabled] = useState<boolean>(true);
  // Loading flag
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Track last polling attempt
  const pollingTimeoutRef = useRef<number | null>(null);
  
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statusFilter: 'all',
    searchQuery: '',
    onlyShowActive: false
  });
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Load settings from localStorage
    const savedMode = localStorage.getItem('darkMode');
    // Check system color scheme settings
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Use saved settings if available, otherwise follow system settings
    return savedMode !== null ? savedMode === 'true' : prefersDark;
  });

  // Separate data loading function for reusability
  const loadData = useCallback(async () => {
    if (isLoading) return; // Do nothing if already loading
    
    setIsLoading(true);
    try {
      // Get JSON file directly (add timestamp parameter to avoid cache)
      // Options to completely disable caching
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };
      
      const timestamp = new Date().getTime();
      const response = await fetch(`/data/workplan.json?t=${timestamp}`, fetchOptions);
      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }
      
      const actualWorkPlan = await response.json();
      
      // Data structure conversion
      const convertedWorkPlan: WorkPlan = {
        goal: actualWorkPlan.currentTicket.goal,
        prPlans: actualWorkPlan.currentTicket.pullRequests.map((pr: {
          goal: string;
          status: string;
          developerNote?: string;
          commits: Array<{
            goal: string;
            status: string;
            developerNote?: string;
          }>;
        }) => ({
          goal: pr.goal,
          status: pr.status as CommitStatus,
          developerNote: pr.developerNote,
          commitPlans: pr.commits.map((commit: {
            goal: string;
            status: string;
            developerNote?: string;
          }) => ({
            goal: commit.goal,
            status: commit.status as CommitStatus,
            developerNote: commit.developerNote
          }))
        }))
      };
      
      // Apply updates
      setWorkplan(convertedWorkPlan);
      setLastLoadedTime(new Date());
      setLoadError(null);
    } catch (error) {
      console.error('Error occurred while loading data:', error);
      setLoadError('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array

  // Get data from JSON file on initial load
  useEffect(() => {
    // Initial load
    loadData();
    
    // Set up polling
    const setupPolling = () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      
      if (pollingEnabled && pollingInterval > 0) {
        pollingTimeoutRef.current = window.setTimeout(() => {
          // Load data, then schedule next polling
          loadData().finally(() => {
            if (pollingEnabled) {
              setupPolling();
            }
          });
        }, pollingInterval);
      }
    };
    
    // Start polling
    setupPolling();
    
    // Clean up on component unmount
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [loadData, pollingEnabled, pollingInterval]);
  
  // Add/remove class from html tag when dark mode setting changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    
    // Save settings to localStorage
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Filter options change handler
  const handleFilterChange = useCallback((newOptions: FilterOptions) => {
    setFilterOptions(newOptions);
  }, []);

  // Filter button click handler
  const handleFilterClick = useCallback(() => {
    setShowFilterPanel(true);
  }, []);
  
  // Dark mode toggle handler
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Polling settings toggle handler
  const togglePolling = useCallback(() => {
    setPollingEnabled(prev => !prev);
  }, []);

  // Fallback display for errors
  if (loadError || !workplan) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="text-center p-8 max-w-md">
          <div className="animate-pulse text-5xl mb-6">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            An error occurred
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {loadError || "Workplan data not found"}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className={`bg-gray-800 text-white shadow-md flex justify-between items-center ${
        breakpoint === 'xs' ? 'p-2' : 'p-4'
      }`}>
        <div>
          {/* Currently unused area - available for future use */}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {lastLoadedTime && (
            <span className={`text-gray-300 ${breakpoint === 'xs' ? 'text-xs' : 'text-sm'} hidden sm:inline`}>
              Last updated: {lastLoadedTime.toLocaleTimeString()}
            </span>
          )}
          
          {/* Polling toggle button */}
          <button 
            onClick={togglePolling}
            className={`px-1 py-0.5 ${pollingEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'} rounded-sm text-white transition flex items-center text-xs`}
            title={pollingEnabled ? "Stop auto-refresh" : "Start auto-refresh"}
            aria-label={pollingEnabled ? "Stop auto-refresh" : "Start auto-refresh"}
          >
            <svg className={`h-2.5 w-2.5 ${pollingEnabled ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
            </svg>
            <span className="hidden sm:inline text-xs ml-0.5">{pollingEnabled ? 'Auto ON' : 'Auto OFF'}</span>
          </button>
          
          {/* Manual refresh button */}
          <button 
            onClick={() => loadData()}
            disabled={isLoading}
            className={`px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded text-white transition flex items-center ${
              breakpoint === 'xs' ? 'text-xs' : 'text-sm'
            }`}
            title="Refresh now"
            aria-label="Refresh now"
          >
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          {/* Dark mode toggle button */}
          <button 
            onClick={toggleDarkMode}
            className={`px-2 sm:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white transition flex items-center ${
              breakpoint === 'xs' ? 'text-xs' : 'text-sm'
            }`}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <>
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
          
          <button 
            onClick={handleFilterClick}
            className={`px-2 sm:px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white transition ${
              breakpoint === 'xs' ? 'text-xs' : 'text-sm'
            }`}
            aria-label="Open filter"
          >
            <span className="mr-1">🔍</span>
            {breakpoint !== 'xs' && "Filter"}
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <ReactFlowProvider>
          <WorkplanFlow 
            workplan={workplan}
            filterOptions={filterOptions}
          />
        </ReactFlowProvider>
      </main>
      
      {/* Filter panel */}
      <div className="filter-panel-container">
        {showFilterPanel && (
          <FilterPanel
            options={filterOptions}
            onChange={handleFilterChange}
            isOpen={showFilterPanel}
            onClose={() => setShowFilterPanel(false)}
          />
        )}
      </div>
      
      {/* Device orientation warning (mobile only) */}
      <OrientationWarning />
    </div>
  );
}

export default App
