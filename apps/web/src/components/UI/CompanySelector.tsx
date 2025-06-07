import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import './CompanySelector.css';

interface Company {
  symbol: string;
  name: string;
  sector?: string;
  exchange?: string;
}

interface CompanySelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  companies?: Company[];
  disabled?: boolean;
}

const POPULAR_STOCKS: Company[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Automotive' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
];

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  selectedSymbol,
  onSymbolChange,
  companies = POPULAR_STOCKS,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSelections, setRecentSelections] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent selections from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('finance-screener-recent-stocks');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSelections(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentSelections([]);
      }
    }
  }, []);

  // Save recent selections to localStorage
  const saveRecentSelection = useCallback((symbol: string) => {
    const updated = [symbol, ...recentSelections.filter(s => s !== symbol)].slice(0, 5);
    setRecentSelections(updated);
    localStorage.setItem('finance-screener-recent-stocks', JSON.stringify(updated));
  }, [recentSelections]);

  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    
    const term = searchTerm.toLowerCase();
    return companies.filter(company => 
      company.symbol.toLowerCase().includes(term) ||
      company.name.toLowerCase().includes(term) ||
      (company.sector && company.sector.toLowerCase().includes(term))
    );
  }, [companies, searchTerm]);

  // Get recent companies
  const recentCompanies = useMemo(() => {
    return recentSelections
      .map(symbol => companies.find(c => c.symbol === symbol))
      .filter(Boolean) as Company[];
  }, [recentSelections, companies]);

  // Handle company selection
  const handleSelect = useCallback((symbol: string) => {
    onSymbolChange(symbol);
    saveRecentSelection(symbol);
    setIsOpen(false);
    setSearchTerm('');
  }, [onSymbolChange, saveRecentSelection]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedCompany = companies.find(c => c.symbol === selectedSymbol);

  return (
    <div className="company-selector" ref={dropdownRef}>
      <label className="selector-label">Select Company</label>
      
      <button
        className={`selector-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        onKeyDown={handleKeyDown}
      >
        <div className="selected-company">
          <div className="company-symbol">{selectedSymbol}</div>
          {selectedCompany && (
            <div className="company-name">{selectedCompany.name}</div>
          )}
        </div>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="selector-dropdown">
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredCompanies.length > 0) {
                  handleSelect(filteredCompanies[0].symbol);
                }
              }}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="dropdown-content">
            {/* Recent selections */}
            {!searchTerm && recentCompanies.length > 0 && (
              <div className="company-section">
                <div className="section-header">Recent</div>
                {recentCompanies.map((company) => (
                  <button
                    key={`recent-${company.symbol}`}
                    className={`company-option ${company.symbol === selectedSymbol ? 'selected' : ''}`}
                    onClick={() => handleSelect(company.symbol)}
                  >
                    <div className="company-info">
                      <div className="company-symbol">{company.symbol}</div>
                      <div className="company-name">{company.name}</div>
                      {company.sector && (
                        <div className="company-sector">{company.sector}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Popular/All companies */}
            <div className="company-section">
              <div className="section-header">
                {searchTerm ? `Search Results (${filteredCompanies.length})` : 'Popular Stocks'}
              </div>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <button
                    key={company.symbol}
                    className={`company-option ${company.symbol === selectedSymbol ? 'selected' : ''}`}
                    onClick={() => handleSelect(company.symbol)}
                  >
                    <div className="company-info">
                      <div className="company-symbol">{company.symbol}</div>
                      <div className="company-name">{company.name}</div>
                      {company.sector && (
                        <div className="company-sector">{company.sector}</div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="no-results">
                  No companies found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
