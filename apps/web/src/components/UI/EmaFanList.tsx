import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './EmaFanList.css';
import { EmaFanService } from '../../services/api/emaFanService';
import type { 
  EmaFanData, 
  EmaFanSummary, 
  EmaFanListProps, 
  EmaFanSortField, 
  SortDirection 
} from '../../types/EmaFanTypes';

const emaFanService = new EmaFanService();

export const EmaFanList: React.FC<EmaFanListProps> = ({
  limit = 100,
  showSummary = true,
  enableSearch = true,
  enableSorting = true,
  onCompanySelect,
  className = ''
}) => {
  const [data, setData] = useState<EmaFanData[]>([]);
  const [summary, setSummary] = useState<EmaFanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLimit, setCurrentLimit] = useState(limit);
  const [sortField, setSortField] = useState<EmaFanSortField>('emaFanScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Load data on component mount and when limit changes
  useEffect(() => {
    loadData();
  }, [currentLimit]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [fanData, summaryData] = await Promise.all([
        emaFanService.getEmaFanRanking(currentLimit),
        showSummary ? emaFanService.getEmaFanSummary() : Promise.resolve(null)
      ]);

      setData(fanData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load EMA Fan data');
    } finally {
      setLoading(false);
    }
  }, [currentLimit, showSummary]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm && enableSearch) {
      const term = searchTerm.toLowerCase();
      filtered = data.filter(
        item =>
          item.symbol.toLowerCase().includes(term) ||
          item.name.toLowerCase().includes(term) ||
          item.sectorName.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (enableSorting) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        // Handle null values
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        // Convert to comparable values
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortField, sortDirection, enableSearch, enableSorting]);

  const handleSort = useCallback((field: EmaFanSortField) => {
    if (!enableSorting) return;

    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, enableSorting]);

  const handleCompanyClick = useCallback((company: EmaFanData) => {
    onCompanySelect?.(company);
  }, [onCompanySelect]);

  const formatPrice = (price: number | null): string => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatEmaValue = (value: number | null): string => {
    if (value === null) return 'N/A';
    return value.toFixed(2);
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  const getSortIndicator = (field: EmaFanSortField): string => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const renderSortableHeader = (field: EmaFanSortField, label: string) => (
    <th 
      className={enableSorting ? 'sortable-header' : ''}
      onClick={() => handleSort(field)}
    >
      {label}
      {enableSorting && (
        <span className="sort-indicator">
          {getSortIndicator(field)}
        </span>
      )}
    </th>
  );

  if (loading) {
    return (
      <div className={`ema-fan-list ${className}`}>
        <div className="loading-container">
          <div>Loading EMA Fan analysis...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`ema-fan-list ${className}`}>
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="retry-button" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`ema-fan-list ${className}`}>
      {/* Header */}
      <div className="ema-fan-header">
        <div>
          <h2 className="ema-fan-title">EMA Fan Analysis</h2>
          <p className="ema-fan-subtitle">
            Companies ranked by EMA Fan technical indicator (EMA18 &gt; EMA50 &gt; EMA100 &gt; EMA200)
          </p>
        </div>
        
        <div className="ema-fan-controls">
          {enableSearch && (
            <input
              type="text"
              placeholder="Search by symbol, name, or sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          )}
          
          <select
            value={currentLimit}
            onChange={(e) => setCurrentLimit(Number(e.target.value))}
            className="limit-selector"
          >
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
            <option value={250}>Top 250</option>
            <option value={500}>Top 500</option>
          </select>
          
          <button
            onClick={loadData}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {showSummary && summary && (
        <div className="ema-fan-summary">
          <div className="summary-stat">
            <p className="summary-stat-value">{summary.totalStocksAnalyzed}</p>
            <p className="summary-stat-label">Total Stocks</p>
          </div>
          <div className="summary-stat">
            <p className="summary-stat-value">{summary.perfectEmaFanCount}</p>
            <p className="summary-stat-label">Perfect EMA Fans</p>
          </div>
          <div className="summary-stat">
            <p className="summary-stat-value">
              {((summary.perfectEmaFanCount / summary.totalStocksAnalyzed) * 100).toFixed(1)}%
            </p>
            <p className="summary-stat-label">Perfect Fan Rate</p>
          </div>
          <div className="summary-stat">
            <p className="summary-stat-value">{summary.averageEmaFanScore?.toFixed(1)}</p>
            <p className="summary-stat-label">Average Score</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="ema-fan-table-container">
        {filteredAndSortedData.length === 0 ? (
          <div className="empty-state">
            <p>No companies found matching your search criteria.</p>
          </div>
        ) : (
          <table className="ema-fan-table">
            <thead>
              <tr>
                {renderSortableHeader('symbol', 'Company')}
                {renderSortableHeader('sectorName', 'Sector')}
                {renderSortableHeader('latestPrice', 'Price')}
                {renderSortableHeader('emaFanScore', 'Fan Score')}
                <th>Perfect Fan</th>
                {renderSortableHeader('fanStrength', 'Fan Strength')}
                <th>EMA Values</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((company) => (
                <tr 
                  key={company.id} 
                  onClick={() => handleCompanyClick(company)}
                >
                  <td>
                    <div className="company-info">
                      <div className="company-symbol">{company.symbol}</div>
                      <div className="company-name">{company.name}</div>
                    </div>
                  </td>
                  <td>
                    <span className="sector-tag">{company.sectorName}</span>
                  </td>
                  <td>
                    <span className="price-value">
                      {formatPrice(company.latestPrice)}
                    </span>
                  </td>
                  <td>
                    <span className={`ema-fan-score score-${company.emaFanScore}`}>
                      {company.emaFanScore}
                    </span>
                  </td>
                  <td>
                    <div className={`perfect-fan-indicator ${company.isPerfectEmaFan ? 'perfect' : 'imperfect'}`}>
                      <span className="fan-icon">
                        {company.isPerfectEmaFan ? '✓' : '✗'}
                      </span>
                      {company.isPerfectEmaFan ? 'Yes' : 'No'}
                    </div>
                  </td>
                  <td>
                    <span className={`fan-strength ${(company.fanStrength || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercentage(company.fanStrength)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className="ema-value">18: {formatEmaValue(company.ema18)}</span>
                      <span className="ema-value">50: {formatEmaValue(company.ema50)}</span>
                      <span className="ema-value">100: {formatEmaValue(company.ema100)}</span>
                      <span className="ema-value">200: {formatEmaValue(company.ema200)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EmaFanList;
