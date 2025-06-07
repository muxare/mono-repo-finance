import { useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useCandlestickChart } from './useCandlestickChart';
import type { ChartMethods } from './useCandlestickChart';
import type { D3ChartConfig } from '../types/ChartTypes';

export interface EnhancedChartMethods extends ChartMethods {
  zoomIn: () => void;
  zoomOut: () => void;
  panLeft: () => void;
  panRight: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  currentZoomLevel: number;
  enableKeyboardControls: () => void;
  disableKeyboardControls: () => void;
}

export const useEnhancedCandlestickChart = (config: D3ChartConfig): EnhancedChartMethods => {
  const baseChart = useCandlestickChart(config);
  const currentZoomRef = useRef(1);
  const keyboardHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 20;
  const ZOOM_FACTOR = 1.5;
  const PAN_FACTOR = 0.1;

  // Enhanced zoom methods
  const zoomIn = useCallback(() => {
    if (!baseChart.svgRef.current || currentZoomRef.current >= MAX_ZOOM) return;
    
    const svg = d3.select(baseChart.svgRef.current);
    const newScale = Math.min(MAX_ZOOM, currentZoomRef.current * ZOOM_FACTOR);
    
    svg.transition()
      .duration(250)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity.scale(newScale)
      );
      
    currentZoomRef.current = newScale;
  }, [baseChart.svgRef, MAX_ZOOM, ZOOM_FACTOR]);

  const zoomOut = useCallback(() => {
    if (!baseChart.svgRef.current || currentZoomRef.current <= MIN_ZOOM) return;
    
    const svg = d3.select(baseChart.svgRef.current);
    const newScale = Math.max(MIN_ZOOM, currentZoomRef.current / ZOOM_FACTOR);
    
    svg.transition()
      .duration(250)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity.scale(newScale)
      );
      
    currentZoomRef.current = newScale;
  }, [baseChart.svgRef, MIN_ZOOM, ZOOM_FACTOR]);

  const panLeft = useCallback(() => {
    if (!baseChart.svgRef.current) return;
    
    const svg = d3.select(baseChart.svgRef.current);
    const { chartWidth } = baseChart.scales;
    const panDistance = chartWidth * PAN_FACTOR;
    
    svg.transition()
      .duration(200)
      .call(
        d3.zoom<SVGSVGElement, unknown>().translateBy,
        panDistance,
        0
      );
  }, [baseChart.svgRef, baseChart.scales, PAN_FACTOR]);

  const panRight = useCallback(() => {
    if (!baseChart.svgRef.current) return;
    
    const svg = d3.select(baseChart.svgRef.current);
    const { chartWidth } = baseChart.scales;
    const panDistance = chartWidth * PAN_FACTOR;
    
    svg.transition()
      .duration(200)
      .call(
        d3.zoom<SVGSVGElement, unknown>().translateBy,
        -panDistance,
        0
      );
  }, [baseChart.svgRef, baseChart.scales, PAN_FACTOR]);

  // Keyboard controls
  const handleKeyboard = useCallback((event: KeyboardEvent) => {
    // Prevent default if we're handling the key
    const shouldHandle = (
      (event.ctrlKey && ['+', '-', '=', '0'].includes(event.key)) ||
      ['ArrowLeft', 'ArrowRight', 'f', 'F'].includes(event.key)
    );

    if (!shouldHandle) return;

    event.preventDefault();

    switch (event.key) {
      case '+':
      case '=':
        if (event.ctrlKey) zoomIn();
        break;
      case '-':
        if (event.ctrlKey) zoomOut();
        break;
      case '0':
        if (event.ctrlKey) baseChart.resetZoom();
        break;
      case 'ArrowLeft':
        panLeft();
        break;
      case 'ArrowRight':
        panRight();
        break;
      case 'f':
      case 'F':
        baseChart.fitToData();
        break;
    }
  }, [zoomIn, zoomOut, panLeft, panRight, baseChart.resetZoom, baseChart.fitToData]);

  const enableKeyboardControls = useCallback(() => {
    if (keyboardHandlerRef.current) {
      document.removeEventListener('keydown', keyboardHandlerRef.current);
    }
    keyboardHandlerRef.current = handleKeyboard;
    document.addEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  const disableKeyboardControls = useCallback(() => {
    if (keyboardHandlerRef.current) {
      document.removeEventListener('keydown', keyboardHandlerRef.current);
      keyboardHandlerRef.current = null;
    }
  }, []);

  // Enhanced reset zoom that also resets the current zoom ref
  const resetZoom = useCallback(() => {
    baseChart.resetZoom();
    currentZoomRef.current = 1;
  }, [baseChart.resetZoom]);

  // Enhanced fit to data that also resets the current zoom ref
  const fitToData = useCallback(() => {
    baseChart.fitToData();
    currentZoomRef.current = 1;
  }, [baseChart.fitToData]);

  // Cleanup keyboard listener on unmount
  useEffect(() => {
    return () => {
      disableKeyboardControls();
    };
  }, [disableKeyboardControls]);

  // Auto-enable keyboard controls when chart is available
  useEffect(() => {
    if (baseChart.svgRef.current) {
      enableKeyboardControls();
    }
    return () => {
      disableKeyboardControls();
    };
  }, [baseChart.svgRef.current, enableKeyboardControls, disableKeyboardControls]);

  return {
    ...baseChart,
    resetZoom,
    fitToData,
    zoomIn,
    zoomOut,
    panLeft,
    panRight,
    canZoomIn: currentZoomRef.current < MAX_ZOOM,
    canZoomOut: currentZoomRef.current > MIN_ZOOM,
    currentZoomLevel: currentZoomRef.current,
    enableKeyboardControls,
    disableKeyboardControls,
  };
};
