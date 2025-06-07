import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FinancialDataProvider } from './contexts/FinancialDataContext';
import { FinancialDataErrorBoundary } from './components/FinancialDataErrorBoundary';
import { TodoList } from './components/TodoList';
import { FinancialDataDemo } from './components/FinancialDataDemo';
import { ContextApiTest } from './components/ContextApiTest';
import CandlestickChartDemo from './components/CandlestickChartDemo';
import { EmaFanDemo } from './components/EmaFanDemo';
import { ApiTrafficMonitor } from './components/ApiTrafficMonitor';
import { ComponentErrorBoundary } from './components/ComponentErrorBoundary';
import { setupApiInterceptor } from './utils/apiInterceptor';
import { useState, useEffect } from 'react';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [isApiMonitorVisible, setIsApiMonitorVisible] = useState(false);

  useEffect(() => {
    // Set up API interceptor for development
    if (import.meta.env.DEV) {
      setupApiInterceptor();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FinancialDataErrorBoundary>
        <FinancialDataProvider>
          <div className="app">
            <header className="app-header">
              <h1>MonoRepo Financial App</h1>
              <p>A modern financial application built with .NET Core and React TypeScript</p>
            </header>              <main className="app-main">
              <ComponentErrorBoundary name="EmaFanDemo">
                <EmaFanDemo />
              </ComponentErrorBoundary>
            </main>
            
            <footer className="app-footer">
              <p>Built with ❤️ using .NET Core, React, TypeScript, and Vite</p>
            </footer>
            
            {/* Development API Monitor - only show in development */}
            {import.meta.env.DEV && (
              <ApiTrafficMonitor 
                isVisible={isApiMonitorVisible}
                onToggle={() => setIsApiMonitorVisible(!isApiMonitorVisible)}
              />
            )}
          </div>
        </FinancialDataProvider>
      </FinancialDataErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
