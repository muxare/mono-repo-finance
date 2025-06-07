import React, { useCallback } from 'react';
import './ChartControls.css';

interface ChartControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToData: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isLoading?: boolean;
  showVolumeToggle?: boolean;
  showVolume?: boolean;
  onToggleVolume?: (show: boolean) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToData,
  onPanLeft,
  onPanRight,
  canZoomIn,
  canZoomOut,
  isLoading = false,
  showVolumeToggle = false,
  showVolume = false,
  onToggleVolume
}) => {

  const handleKeyDown = useCallback((event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []);

  return (
    <div className="chart-controls">
      <div className="control-group zoom-controls">
        <button
          className="control-button zoom-in"
          onClick={onZoomIn}
          onKeyDown={(e) => handleKeyDown(e, onZoomIn)}
          disabled={!canZoomIn || isLoading}
          title="Zoom In (Ctrl+Plus)"
          aria-label="Zoom in on chart"
        >
          🔍+
        </button>
        
        <button
          className="control-button zoom-out"
          onClick={onZoomOut}
          onKeyDown={(e) => handleKeyDown(e, onZoomOut)}
          disabled={!canZoomOut || isLoading}
          title="Zoom Out (Ctrl+Minus)"
          aria-label="Zoom out of chart"
        >
          🔍-
        </button>
        
        <button
          className="control-button reset-zoom"
          onClick={onResetZoom}
          onKeyDown={(e) => handleKeyDown(e, onResetZoom)}
          disabled={isLoading}
          title="Reset Zoom (Ctrl+0)"
          aria-label="Reset chart zoom"
        >
          ⌂
        </button>
        
        <button
          className="control-button fit-data"
          onClick={onFitToData}
          onKeyDown={(e) => handleKeyDown(e, onFitToData)}
          disabled={isLoading}
          title="Fit to Data (F)"
          aria-label="Fit chart to all data"
        >
          ⊞
        </button>
      </div>

      <div className="control-group pan-controls">
        <button
          className="control-button pan-left"
          onClick={onPanLeft}
          onKeyDown={(e) => handleKeyDown(e, onPanLeft)}
          disabled={isLoading}
          title="Pan Left (Arrow Left)"
          aria-label="Pan chart left"
        >
          ←
        </button>
        
        <button
          className="control-button pan-right"
          onClick={onPanRight}
          onKeyDown={(e) => handleKeyDown(e, onPanRight)}
          disabled={isLoading}
          title="Pan Right (Arrow Right)"
          aria-label="Pan chart right"
        >
          →
        </button>
      </div>

      {showVolumeToggle && onToggleVolume && (
        <div className="control-group volume-controls">
          <button
            className={`control-button volume-toggle ${showVolume ? 'active' : ''}`}
            onClick={() => onToggleVolume(!showVolume)}
            onKeyDown={(e) => handleKeyDown(e, () => onToggleVolume(!showVolume))}
            disabled={isLoading}
            title={`${showVolume ? 'Hide' : 'Show'} Volume (V)`}
            aria-label={`${showVolume ? 'Hide' : 'Show'} volume bars`}
          >
            📊
          </button>
        </div>
      )}

      <div className="control-instructions">
        <div className="instruction-group">
          <span className="instruction-title">Mouse:</span>
          <span className="instruction-text">Wheel to zoom, drag to pan</span>
        </div>
        <div className="instruction-group">
          <span className="instruction-title">Keyboard:</span>
          <span className="instruction-text">Ctrl+/- zoom, arrows pan</span>
        </div>
      </div>
    </div>
  );
};
