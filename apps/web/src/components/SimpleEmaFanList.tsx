import React from 'react';
import { EmaFanList } from './UI/EmaFanList';
import { useEmaFan } from '../hooks/useEmaFan';
import type { EmaFanData } from '../types/EmaFanTypes';

interface SimpleEmaFanListProps {
  limit?: number;
  onCompanySelect?: (company: EmaFanData) => void;
  className?: string;
}

export const SimpleEmaFanList: React.FC<SimpleEmaFanListProps> = ({
  limit = 50,
  onCompanySelect,
  className
}) => {
  const { data, loading, error, refresh } = useEmaFan({
    limit,
    autoRefresh: true,
    refreshInterval: 120000 // 2 minutes
  });

  if (loading && data.length === 0) {
    return (
      <div style={{ 
        padding: '48px', 
        textAlign: 'center', 
        color: '#6b7280' 
      }}>
        Loading EMA Fan data...
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div style={{ 
        padding: '48px', 
        textAlign: 'center',
        color: '#dc2626'
      }}>
        <div>{error}</div>
        <button 
          onClick={refresh}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <EmaFanList
        limit={limit}
        showSummary={true}
        enableSearch={true}
        enableSorting={true}
        onCompanySelect={onCompanySelect}
        className={className}
      />
    </div>
  );
};

export default SimpleEmaFanList;
