# EMA Fan List Component

A React component that displays companies ranked by the EMA Fan technical indicator (EMA18 > EMA50 > EMA100 > EMA200).

## Features

- **Real-time EMA Fan Analysis**: Displays companies ranked by how well they satisfy the EMA fan condition
- **Interactive Sorting**: Click column headers to sort by different criteria
- **Search Functionality**: Search by company symbol, name, or sector
- **Summary Statistics**: Shows market-wide EMA fan statistics
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Perfect Fan Highlighting**: Visual indicators for companies with perfect EMA fan alignment
- **Customizable Limits**: Choose how many companies to display (25, 50, 100, 250, 500)

## EMA Fan Scoring System

The component uses a sophisticated scoring system:

- **Score 3**: Perfect fan (EMA18 > EMA50 > EMA100 > EMA200) ✅
- **Score 2**: Two consecutive conditions satisfied 🟡
- **Score 1**: One condition satisfied 🟠
- **Score 0**: No conditions satisfied ⚪

## Components

### EmaFanList

The main component with full functionality:

```tsx
import { EmaFanList } from './components/UI/EmaFanList';

<EmaFanList
  limit={100}
  showSummary={true}
  enableSearch={true}
  enableSorting={true}
  onCompanySelect={(company) => console.log('Selected:', company)}
/>
```

### SimpleEmaFanList

A simplified version that uses the `useEmaFan` hook with auto-refresh:

```tsx
import { SimpleEmaFanList } from './components/SimpleEmaFanList';

<SimpleEmaFanList
  limit={50}
  onCompanySelect={(company) => console.log('Selected:', company)}
/>
```

### EmaFanDemo

A full demo page showcasing the component:

```tsx
import { EmaFanDemo } from './components/EmaFanDemo';

<EmaFanDemo />
```

## Props

### EmaFanListProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | `number` | `100` | Maximum number of companies to display |
| `showSummary` | `boolean` | `true` | Whether to show summary statistics |
| `enableSearch` | `boolean` | `true` | Enable search functionality |
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `onCompanySelect` | `(company: EmaFanData) => void` | - | Callback when a company is selected |
| `className` | `string` | `''` | Additional CSS class |

## Data Structure

### EmaFanData

```typescript
interface EmaFanData {
  id: number;
  symbol: string;
  name: string;
  sectorName: string;
  latestPrice: number | null;
  ema18: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;
  emaFanScore: number;        // 0-3
  isPerfectEmaFan: boolean;
  fanStrength: number | null; // Percentage
}
```

## API Endpoints

The component connects to these backend endpoints:

- `GET /api/market/analysis/ema-fan?limit={limit}` - Get ranked companies
- `GET /api/market/analysis/ema-fan/summary` - Get summary statistics

## Custom Hook

### useEmaFan

For advanced use cases, you can use the custom hook directly:

```tsx
import { useEmaFan } from './hooks/useEmaFan';

const MyComponent = () => {
  const { data, summary, loading, error, refresh } = useEmaFan({
    limit: 100,
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data.map(company => (
        <div key={company.id}>
          {company.symbol} - Score: {company.emaFanScore}
        </div>
      ))}
    </div>
  );
};
```

## Styling

The component uses CSS custom properties for theming:

```css
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --background-primary: #ffffff;
  --background-secondary: #f8fafc;
  --border-color: #e2e8f0;
  --error-color: #dc2626;
}
```

## Performance

- **Caching**: API responses are cached for 2-5 minutes
- **Request Deduplication**: Duplicate requests are automatically deduplicated
- **Pagination**: Supports different page sizes to reduce data transfer
- **Responsive**: Optimized for mobile devices with horizontal scrolling

## Example Usage

```tsx
import React, { useState } from 'react';
import { EmaFanList } from './components';
import type { EmaFanData } from './types/EmaFanTypes';

const TradingDashboard = () => {
  const [selectedStock, setSelectedStock] = useState<EmaFanData | null>(null);

  return (
    <div>
      <h1>Trading Dashboard</h1>
      
      {selectedStock && (
        <div className="selected-stock-info">
          <h2>{selectedStock.symbol} - {selectedStock.name}</h2>
          <p>EMA Fan Score: {selectedStock.emaFanScore}/3</p>
          <p>Perfect Fan: {selectedStock.isPerfectEmaFan ? 'Yes' : 'No'}</p>
        </div>
      )}
      
      <EmaFanList
        limit={50}
        onCompanySelect={setSelectedStock}
        showSummary={true}
      />
    </div>
  );
};
```

## Dependencies

- React 18+
- TypeScript
- Axios (for API calls)
- CSS Custom Properties support

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
