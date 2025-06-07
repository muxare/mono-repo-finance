import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Financial Data Context
 * Catches errors that occur within the financial data context and provides
 * a fallback UI instead of crashing the entire application
 */
export class FinancialDataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('FinancialDataErrorBoundary caught an error:', error);
    console.error('Error details:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or use provided fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ color: '#d63031', marginTop: 0 }}>
            🚨 Financial Data Error
          </h2>
          
          <p style={{ color: '#2d3436', marginBottom: '15px' }}>
            Something went wrong with the financial data context. This might be due to:
          </p>
          
          <ul style={{ color: '#636e72', marginBottom: '20px' }}>
            <li>Network connectivity issues</li>
            <li>API service unavailability</li>
            <li>Invalid data format</li>
            <li>Context state corruption</li>
          </ul>

          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#636e72',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>

          {/* Development mode error details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px' }}>
              <summary style={{ 
                cursor: 'pointer', 
                padding: '10px', 
                backgroundColor: '#ddd',
                borderRadius: '4px'
              }}>
                <strong>Error Details (Development Only)</strong>
              </summary>
              <div style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: '#f8f8f8',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Error:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', color: '#d63031' }}>
                    {this.state.error.toString()}
                  </pre>
                </div>
                {this.state.errorInfo && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with Financial Data Error Boundary
 */
export const withFinancialDataErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <FinancialDataErrorBoundary fallback={fallback}>
      <Component {...props} />
    </FinancialDataErrorBoundary>
  );
};

/**
 * Hook to provide error boundary functionality in functional components
 * This is a custom implementation since React doesn't provide a hook for error boundaries
 */
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: any) => {
    console.error('Error caught by useErrorHandler:', error);
    if (errorInfo) {
      console.error('Additional error info:', errorInfo);
    }
    
    // In a real application, you might want to:
    // - Report the error to a logging service
    // - Display a user-friendly error message
    // - Attempt recovery actions
  };

  return { handleError };
};
