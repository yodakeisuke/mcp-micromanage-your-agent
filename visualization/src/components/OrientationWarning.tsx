import React, { useState, useEffect } from 'react';
import { useBreakpoint, Breakpoint } from '../utils/responsiveUtils';

/**
 * Component that detects mobile device orientation and displays a warning
 * Shows a recommendation to use landscape orientation
 */
const OrientationWarning: React.FC = () => {
  const breakpoint = useBreakpoint();
  const [isPortrait, setIsPortrait] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Detect screen orientation
  useEffect(() => {
    const checkOrientation = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setIsPortrait(true);
      } else {
        setIsPortrait(false);
      }
    };

    // Initial check
    checkOrientation();

    // Orientation change listener
    window.addEventListener('resize', checkOrientation);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  // Determine whether to show the warning
  const shouldShowWarning = isPortrait && ['xs', 'sm'].includes(breakpoint) && !isDismissed;
  
  if (!shouldShowWarning) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-100 border-t border-yellow-200 p-3 z-50 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-xl mr-2" aria-hidden="true">📱</span>
          <div>
            <p className="text-yellow-800 font-medium">Landscape orientation recommended</p>
            <p className="text-yellow-700 text-xs">Rotate your device to landscape for a better experience.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsDismissed(true)}
          className="text-yellow-700 hover:text-yellow-900"
          aria-label="Close warning"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default OrientationWarning; 