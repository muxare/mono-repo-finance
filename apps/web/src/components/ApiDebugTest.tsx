import React, { useState, useEffect } from 'react';

export const ApiDebugTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        setStatus('Fetching from API...');
        const response = await fetch('http://localhost:5042/api/market/analysis/ema-fan?limit=5');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        setData(result);
        setStatus(`✅ API Working! Got ${result.length} items`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setStatus(`❌ API Error: ${errorMsg}`);
      }
    };

    testApi();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #ccc', 
      margin: '20px',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>API Debug Test</h3>
      <p><strong>Status:</strong> {status}</p>
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {data && (
        <details style={{ marginTop: '10px' }}>
          <summary>API Response Data ({data.length} items)</summary>
          <pre style={{ 
            background: '#eee', 
            padding: '10px', 
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
