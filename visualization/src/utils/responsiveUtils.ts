import { useState, useEffect } from 'react';

// Breakpoint definitions
export enum Breakpoint {
  xs = 0,    // Extra small devices (phones)
  sm = 640,  // Small devices (tablets)
  md = 768,  // Medium devices (landscape tablets)
  lg = 1024, // Large devices (desktops)
  xl = 1280, // Extra large devices (large desktops)
  xxl = 1536 // Double extra large devices
}

// Custom hook to determine current breakpoint
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof Breakpoint>(() => {
    // Set initial value
    return getBreakpoint(window.innerWidth);
  });

  useEffect(() => {
    // Handler for window resize events
    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    // Register listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoint;
}

// Function to determine breakpoint from width
function getBreakpoint(width: number): keyof typeof Breakpoint {
  if (width >= Breakpoint.xxl) return 'xxl';
  if (width >= Breakpoint.xl) return 'xl';
  if (width >= Breakpoint.lg) return 'lg';
  if (width >= Breakpoint.md) return 'md';
  if (width >= Breakpoint.sm) return 'sm';
  return 'xs';
}

// Utility function to return responsive values
type ResponsiveValues<T> = {
  [key in keyof typeof Breakpoint]?: T;
} & {
  default: T;
};

export function getResponsiveValue<T>(
  values: ResponsiveValues<T>,
  currentBreakpoint: keyof typeof Breakpoint
): T {
  // Return the value of the largest breakpoint less than or equal to the current breakpoint
  const breakpoints: (keyof typeof Breakpoint)[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpoints.indexOf(currentBreakpoint);
  
  // Search in descending order from current breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp] as T;
    }
  }
  
  // Return default value if not found
  return values.default;
}

// Hook for adjusting react-flow canvas size
export function useResponsiveFlowDimensions() {
  const breakpoint = useBreakpoint();
  
  // Adjust flow canvas size based on breakpoint
  const nodePadding = getResponsiveValue<number>(
    {
      xs: 5,
      sm: 10,
      md: 15,
      lg: 20,
      default: 20
    },
    breakpoint
  );

  const nodeSpacing = getResponsiveValue<number>(
    {
      xs: 30,
      sm: 40,
      md: 50,
      lg: 60,
      default: 60
    },
    breakpoint
  );
  
  const miniMapVisible = getResponsiveValue<boolean>(
    {
      xs: false,
      sm: false,
      md: true,
      default: true
    },
    breakpoint
  );
  
  const controlsStyle = getResponsiveValue<React.CSSProperties>(
    {
      xs: { right: '5px', bottom: '5px', transform: 'scale(0.8)' },
      sm: { right: '10px', bottom: '10px', transform: 'scale(0.9)' },
      md: { right: '10px', bottom: '10px' },
      default: { right: '10px', bottom: '10px' }
    },
    breakpoint
  );
  
  const miniMapStyle = getResponsiveValue<React.CSSProperties>(
    {
      xs: { display: 'none' },
      sm: { display: 'none' },
      md: { right: 10, top: 10, width: 120, height: 80 },
      lg: { right: 10, top: 10, width: 150, height: 100 },
      default: { right: 10, top: 10, width: 200, height: 120 }
    },
    breakpoint
  );

  return {
    nodePadding,
    nodeSpacing,
    miniMapVisible,
    controlsStyle,
    miniMapStyle,
    currentBreakpoint: breakpoint
  };
} 