/**
 * React Query Provider Component
 * React component wrapper for React Query with real-time integration
 */

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './queryClient';
import { getRealTimeService } from '../realtime';

interface ReactQueryProviderProps {
  children: React.ReactNode;
  enableRealtime?: boolean;
}

export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({ 
  children, 
  enableRealtime = true 
}) => {
  
  // Initialize real-time service when provider mounts
  useEffect(() => {
    if (!enableRealtime) return;

    const realTimeService = getRealTimeService();
    
    const initializeRealTime = async () => {
      try {
        console.log('Initializing real-time service...');
        await realTimeService.initialize();
        console.log('Real-time service initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize real-time service:', error);
        // Don't throw - real-time is an enhancement, not a requirement
      }
    };

    initializeRealTime();

    // Cleanup on unmount
    return () => {
      realTimeService.shutdown().catch(error => {
        console.warn('Error shutting down real-time service:', error);
      });
    };
  }, [enableRealtime]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};
