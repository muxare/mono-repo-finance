import React, { useState, useEffect } from 'react';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  isLoading: boolean;
  dataTimestamp?: Date | null;
  onMount?: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isLoading,
  dataTimestamp,
  onMount
}) => {
  const [renderTime, setRenderTime] = useState<number>(0);
  const [frameRate, setFrameRate] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  // Measure render performance
  useEffect(() => {
    const startTime = performance.now();
    
    // Track frame rate
    let frameCount = 0;
    let lastTime = startTime;
    
    const measureFrame = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFrameRate(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      
      if (!isLoading) {
        requestAnimationFrame(measureFrame);
      }
    };
    
    if (!isLoading) {
      requestAnimationFrame(measureFrame);
    }
      return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setRenderTime(duration);
    };
  }, [isLoading]);

  // Call onMount when component mounts
  useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, [onMount]);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <div 
        className="performance-monitor-toggle"
        onClick={() => setIsVisible(true)}
        title="Click or press Ctrl+P to show performance monitor"
      >
        📊
      </div>
    );
  }

  return (
    <div className="performance-monitor">
      <div className="performance-header">
        <h4>Performance Monitor</h4>
        <button 
          className="close-button"
          onClick={() => setIsVisible(false)}
          title="Hide performance monitor (Ctrl+P)"
        >
          ×
        </button>
      </div>
      
      <div className="performance-metrics">
        <div className="metric">
          <span className="label">Render Time:</span>
          <span className={`value ${renderTime > 100 ? 'warning' : 'good'}`}>
            {renderTime.toFixed(1)}ms
          </span>
        </div>
        
        <div className="metric">
          <span className="label">Frame Rate:</span>
          <span className={`value ${frameRate < 30 ? 'warning' : 'good'}`}>
            {frameRate} FPS
          </span>
        </div>
        
        <div className="metric">
          <span className="label">Status:</span>
          <span className={`value ${isLoading ? 'loading' : 'idle'}`}>
            {isLoading ? 'Loading...' : 'Idle'}
          </span>
        </div>
        
        {dataTimestamp && (
          <div className="metric">
            <span className="label">Data Age:</span>
            <span className="value">
              {Math.round((Date.now() - dataTimestamp.getTime()) / 1000)}s
            </span>
          </div>
        )}
          <div className="metric">
          <span className="label">Memory:</span>
          <span className="value">
            {((performance as any).memory?.usedJSHeapSize / 1024 / 1024).toFixed(1) || 'N/A'}MB
          </span>
        </div>
      </div>
      
      <div className="performance-tips">
        <small>💡 Press Ctrl+P to toggle this monitor</small>
      </div>
    </div>
  );
};
