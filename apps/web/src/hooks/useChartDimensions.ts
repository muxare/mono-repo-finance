import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChartDimensions } from '../types/ChartTypes';
import { DEFAULT_CHART_DIMENSIONS } from '../types/ChartTypes';

export interface UseChartDimensionsConfig {
  height?: number;
  margin?: Partial<ChartDimensions['margin']>;
  debounceMs?: number;
}

const defaultMargin = DEFAULT_CHART_DIMENSIONS.margin;

/**
 * Hook for managing responsive chart dimensions with automatic resize handling
 * Follows Swizec Teller's D3 + React patterns for dimension management
 */
export const useChartDimensions = ({
  height = DEFAULT_CHART_DIMENSIONS.height,
  margin: customMargin,
  debounceMs = 100,
}: UseChartDimensionsConfig = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Merge custom margin with defaults
  const margin = {
    ...defaultMargin,
    ...customMargin,
  };
  
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: DEFAULT_CHART_DIMENSIONS.width,
    height,
    margin,
  });

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || DEFAULT_CHART_DIMENSIONS.width;
    
    const newDimensions: ChartDimensions = {
      width,
      height,
      margin,
    };

    setDimensions(prev => {
      // Only update if dimensions actually changed to prevent unnecessary re-renders
      if (
        prev.width !== newDimensions.width ||
        prev.height !== newDimensions.height ||
        JSON.stringify(prev.margin) !== JSON.stringify(newDimensions.margin)
      ) {
        return newDimensions;
      }
      return prev;
    });
  }, [height, margin]);

  // Debounced resize handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, debounceMs);
    };

    // Initial dimension calculation
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateDimensions, debounceMs]);

  // Update when container size changes (e.g., sidebar toggle)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        updateDimensions();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);
  return {
    containerRef,
    dimensions,
    updateDimensions,
  };
};

// Utility hook for responsive breakpoints
export const useChartBreakpoints = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return breakpoint;
};

// Hook for calculating optimal chart settings based on dimensions
export const useChartSettings = (dimensions: ChartDimensions) => {
  return {
    // Calculate optimal candle width based on data points and chart width
    getCandleWidth: (dataPointCount: number) => {
      const { width, margin } = dimensions;
      const chartWidth = width - margin.left - margin.right;
      const maxCandleWidth = 12;
      const minCandleWidth = 1;
      const optimalWidth = Math.max(minCandleWidth, 
        Math.min(maxCandleWidth, (chartWidth / dataPointCount) * 0.8)
      );
      return optimalWidth;
    },

    // Calculate number of ticks for axes based on chart size
    getAxisTicks: () => {
      const { width, height } = dimensions;
      return {
        xTicks: Math.max(3, Math.floor(width / 100)),
        yTicks: Math.max(3, Math.floor(height / 60)),
      };
    },

    // Determine if mobile-optimized rendering should be used
    isMobileOptimized: () => {
      return dimensions.width < 600;
    },

    // Calculate font sizes based on chart dimensions
    getFontSizes: () => {
      const baseSize = Math.max(10, Math.min(14, dimensions.width / 60));
      return {
        axis: `${baseSize}px`,
        title: `${baseSize + 2}px`,
        legend: `${baseSize - 1}px`,
      };
    },
  };
};

export default useChartDimensions;
