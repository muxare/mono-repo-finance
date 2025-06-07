import React from 'react';
import type { StockDataStatus } from '../../hooks/useStockDataWithStatus';
import './DataFlowStatus.css';

interface DataFlowStatusProps {
  status: StockDataStatus;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const DataFlowStatus: React.FC<DataFlowStatusProps> = ({
  status,
  isLoading,
  error,
  onRefresh
}) => {
  const getConnectionStatusIcon = () => {
    if (isLoading) return '⏳';
    if (error) return '❌';
    if (status.isConnected) return '✅';
    return '🔄';
  };

  const getConnectionStatusText = () => {
    if (isLoading) return 'Loading data...';
    if (error) return `Error: ${error}`;
    if (status.isConnected) return 'Connected';
    return 'Reconnecting...';
  };

  const getFreshnessColor = () => {
    switch (status.dataFreshness) {
      case 'fresh': return '#10b981'; // green
      case 'stale': return '#f59e0b'; // yellow
      case 'expired': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const formatLatency = (latency: number) => {
    return latency < 1000 ? `${Math.round(latency)}ms` : `${(latency / 1000).toFixed(1)}s`;
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  };

  return (
    <div className="data-flow-status">
      <div className="status-main">
        <div className="connection-indicator">
          <span className="status-icon">{getConnectionStatusIcon()}</span>
          <span className="status-text">{getConnectionStatusText()}</span>
        </div>
        
        <button 
          className="refresh-button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh data"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="status-details">
        <div className="status-item">
          <span className="label">Data Source:</span>
          <span className={`value source-${status.dataSource}`}>
            {status.dataSource.toUpperCase()}
          </span>
        </div>
        
        <div className="status-item">
          <span className="label">Freshness:</span>
          <span 
            className="value freshness-indicator"
            style={{ color: getFreshnessColor() }}
          >
            {status.dataFreshness.toUpperCase()}
          </span>
        </div>
        
        {status.connectionLatency > 0 && (
          <div className="status-item">
            <span className="label">Latency:</span>
            <span className="value">{formatLatency(status.connectionLatency)}</span>
          </div>
        )}
        
        <div className="status-item">
          <span className="label">Last Update:</span>
          <span className="value">{formatLastUpdate(status.lastUpdate)}</span>
        </div>
      </div>
    </div>
  );
};
