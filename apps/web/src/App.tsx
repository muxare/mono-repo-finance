import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import './App.css';
import { ApiTrafficMonitor } from './components/ApiTrafficMonitor';
import { EmaFanDemo } from './components/EmaFanDemo';
import { FinancialDataProvider } from './contexts/FinancialDataContext';
import { setupApiInterceptor } from './utils/apiInterceptor';
// Import shared packages
import { ENV } from '@monorepo/shared-config';
import { Button, Card, ErrorBoundary, Modal, useModal } from '@monorepo/shared-ui';
import { formatCurrency } from '@monorepo/shared-utils';

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
  const { isOpen: isInfoModalOpen, open: openInfoModal, close: closeInfoModal } = useModal();

  useEffect(() => {
    // Set up API interceptor for development
    if (import.meta.env.DEV) {
      setupApiInterceptor();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <FinancialDataProvider>
          <div className="app">
            <header className="app-header">
              <Card className="mb-6" padding="lg" shadow="lg">
                <h1 className="text-3xl font-bold mb-2">MonoRepo Financial App</h1>
                <p className="text-gray-600 mb-4">A modern financial application built with .NET Core and React TypeScript</p>

                <div className="flex gap-2 mb-4">
                  <Button variant="primary" onClick={() => console.log('Primary button clicked')}>
                    Primary Action
                  </Button>
                  <Button variant="secondary" onClick={() => console.log('Secondary button clicked')}>
                    Secondary Action
                  </Button>
                  <Button variant="outline" onClick={openInfoModal}>
                    View Environment Info
                  </Button>
                  {import.meta.env.DEV && (
                    <Button
                      variant="outline"
                      onClick={() => setIsApiMonitorVisible(!isApiMonitorVisible)}
                    >
                      {isApiMonitorVisible ? 'Hide' : 'Show'} API Monitor
                    </Button>
                  )}
                </div>
              </Card>
            </header>

            <main className="app-main">
              <ErrorBoundary>
                <Card className="mb-6" padding="lg" shadow="md">
                  <h2 className="text-2xl font-semibold mb-4">EMA Fan Analysis</h2>
                  <EmaFanDemo />
                </Card>
              </ErrorBoundary>
            </main>

            <footer className="app-footer">
              <Card padding="sm" shadow="sm" className="text-center">
                <p className="text-sm text-gray-600">Built with ❤️ using .NET Core, React, TypeScript, and Vite</p>
              </Card>
            </footer>

            {/* Environment Info Modal */}
            <Modal isOpen={isInfoModalOpen} onClose={closeInfoModal} title="Environment Information">
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Environment:</span>{' '}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {ENV.IS_DEVELOPMENT ? 'Development' : 'Production'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">API URL:</span>{' '}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{ENV.API_URL}</span>
                </div>
                <div>
                  <span className="font-semibold">Sample formatting:</span>{' '}
                  <div className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                    {formatCurrency(1234.56)} | {formatCurrency(9876.54, 'EUR', 'de-DE')}
                  </div>
                </div>
              </div>
            </Modal>

            {/* Development API Monitor - only show in development */}
            {import.meta.env.DEV && (
              <ApiTrafficMonitor
                isVisible={isApiMonitorVisible}
                onToggle={() => setIsApiMonitorVisible(!isApiMonitorVisible)}
              />
            )}
          </div>
        </FinancialDataProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
