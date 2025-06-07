import React, { useState, useEffect } from 'react';
import './ApiTrafficMonitor.css';

export interface ApiCall {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  requestData?: any;
  responseData?: any;
  status?: number;
  duration?: number;
  error?: string;
}

interface ApiTrafficMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const ApiTrafficMonitor: React.FC<ApiTrafficMonitorProps> = ({ isVisible, onToggle }) => {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);

  useEffect(() => {
    // Listen for API calls from the interceptor
    const handleApiCall = (event: CustomEvent<ApiCall>) => {
      setApiCalls(prev => [event.detail, ...prev].slice(0, 50)); // Keep only last 50 calls
    };

    window.addEventListener('api-call', handleApiCall as EventListener);
    
    return () => {
      window.removeEventListener('api-call', handleApiCall as EventListener);
    };
  }, []);

  const clearCalls = () => {
    setApiCalls([]);
    setSelectedCall(null);
  };

  const formatJson = (data: any) => {
    if (!data) return 'No data';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'gray';
    if (status >= 200 && status < 300) return 'green';
    if (status >= 400 && status < 500) return 'orange';
    if (status >= 500) return 'red';
    return 'gray';
  };

  if (!isVisible) {
    return (
      <div className="api-monitor-toggle">
        <button onClick={onToggle} className="toggle-btn">
          📡 API Monitor ({apiCalls.length})
        </button>
      </div>
    );
  }

  return (
    <div className="api-monitor">
      <div className="api-monitor-header">
        <h3>🔍 API Traffic Monitor</h3>
        <div className="api-monitor-controls">
          <span className="call-count">{apiCalls.length} calls</span>
          <button onClick={clearCalls} className="clear-btn">Clear</button>
          <button onClick={onToggle} className="close-btn">✕</button>
        </div>
      </div>
      
      <div className="api-monitor-content">
        <div className="api-calls-list">
          <h4>Recent API Calls</h4>
          <div className="calls-container">
            {apiCalls.length === 0 ? (
              <div className="no-calls">No API calls yet</div>
            ) : (
              apiCalls.map(call => (
                <div 
                  key={call.id} 
                  className={`call-item ${selectedCall?.id === call.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCall(call)}
                >
                  <div className="call-summary">
                    <span className={`method method-${call.method.toLowerCase()}`}>
                      {call.method}
                    </span>
                    <span className="url">{call.url.replace(/^https?:\/\/[^\/]+/, '')}</span>
                    <span 
                      className="status" 
                      style={{ color: getStatusColor(call.status) }}
                    >
                      {call.status || (call.error ? 'ERR' : 'PENDING')}
                    </span>
                    <span className="duration">
                      {call.duration ? `${call.duration}ms` : '...'}
                    </span>
                  </div>
                  <div className="call-time">
                    {call.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {selectedCall && (
          <div className="call-details">
            <h4>Call Details</h4>
            <div className="details-container">
              <div className="detail-section">
                <h5>Request</h5>
                <div className="detail-info">
                  <strong>Method:</strong> {selectedCall.method}<br />
                  <strong>URL:</strong> {selectedCall.url}<br />
                  <strong>Time:</strong> {selectedCall.timestamp.toLocaleString()}
                </div>
                {selectedCall.requestData && (
                  <div className="detail-data">
                    <strong>Request Data:</strong>
                    <pre>{formatJson(selectedCall.requestData)}</pre>
                  </div>
                )}
              </div>
              
              <div className="detail-section">
                <h5>Response</h5>
                <div className="detail-info">
                  <strong>Status:</strong> 
                  <span style={{ color: getStatusColor(selectedCall.status) }}>
                    {selectedCall.status || 'Pending'}
                  </span><br />
                  {selectedCall.duration && (
                    <>
                      <strong>Duration:</strong> {selectedCall.duration}ms<br />
                    </>
                  )}
                  {selectedCall.error && (
                    <>
                      <strong>Error:</strong> 
                      <span style={{ color: 'red' }}>{selectedCall.error}</span><br />
                    </>
                  )}
                </div>
                {selectedCall.responseData && (
                  <div className="detail-data">
                    <strong>Response Data:</strong>
                    <pre>{formatJson(selectedCall.responseData)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
