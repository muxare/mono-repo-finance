import React, { useState } from 'react';
import { EmaFanList } from './UI/EmaFanList';
import type { EmaFanData } from '../types/EmaFanTypes';

export const EmaFanDemo: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<EmaFanData | null>(null);

  const handleCompanySelect = (company: EmaFanData) => {
    setSelectedCompany(company);
    console.log('Selected company:', company);
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: '#1f2937',
          margin: '0 0 8px 0'
        }}>
          EMA Fan Analysis Dashboard
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#6b7280',
          margin: '0 0 16px 0'
        }}>
          Explore companies ranked by the EMA Fan technical indicator. 
          Click on any company to view detailed information.
        </p>
        
        {selectedCompany && (
          <div style={{
            padding: '16px',
            background: '#e0f2fe',
            border: '1px solid #0891b2',
            borderRadius: '8px',
            marginTop: '16px'
          }}>
            <strong>Selected: </strong>
            {selectedCompany.symbol} - {selectedCompany.name} 
            {selectedCompany.isPerfectEmaFan && (
              <span style={{ 
                marginLeft: '12px',
                padding: '2px 8px',
                background: '#dcfce7',
                color: '#166534',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                ✓ Perfect EMA Fan
              </span>
            )}
          </div>
        )}
      </div>
      
      <EmaFanList
        limit={100}
        showSummary={true}
        enableSearch={true}
        enableSorting={true}
        onCompanySelect={handleCompanySelect}
      />
    </div>
  );
};

export default EmaFanDemo;
