import { useCallback } from 'react';
import type { Timeframe } from '../types/FinancialTypes';
import type { FinancialDataState } from '../types/FinancialContextTypes';
import { useFinancialDataContext } from '../contexts/FinancialDataContext';

/**
 * Hook for managing user preferences
 * @returns User preferences and update functions
 */
export const usePreferences = () => {
  const { state, actions } = useFinancialDataContext();

  const updateTheme = useCallback((theme: 'light' | 'dark') => {
    actions.updatePreferences({ theme });
  }, [actions]);

  const updateDefaultTimeframe = useCallback((defaultTimeframe: Timeframe) => {
    actions.updatePreferences({ defaultTimeframe });
  }, [actions]);

  const updateAutoRefresh = useCallback((autoRefresh: boolean) => {
    actions.updatePreferences({ autoRefresh });
  }, [actions]);

  const updateRefreshInterval = useCallback((refreshInterval: number) => {
    actions.updatePreferences({ refreshInterval });
  }, [actions]);

  const updateMultiplePreferences = useCallback((
    preferences: Partial<FinancialDataState['preferences']>
  ) => {
    actions.updatePreferences(preferences);
  }, [actions]);

  return {
    preferences: state.preferences,
    updateTheme,
    updateDefaultTimeframe,
    updateAutoRefresh,
    updateRefreshInterval,
    updatePreferences: updateMultiplePreferences,
  };
};

/**
 * Hook for timeframe management
 * @returns Current timeframe and timeframe management functions
 */
export const useTimeframe = () => {
  const { state, actions } = useFinancialDataContext();

  const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

  const getCurrentTimeframeIndex = useCallback(() => {
    return timeframes.indexOf(state.timeframe);
  }, [state.timeframe]);

  const getNextTimeframe = useCallback(() => {
    const currentIndex = getCurrentTimeframeIndex();
    const nextIndex = (currentIndex + 1) % timeframes.length;
    return timeframes[nextIndex];
  }, [getCurrentTimeframeIndex]);

  const getPreviousTimeframe = useCallback(() => {
    const currentIndex = getCurrentTimeframeIndex();
    const prevIndex = currentIndex === 0 ? timeframes.length - 1 : currentIndex - 1;
    return timeframes[prevIndex];
  }, [getCurrentTimeframeIndex]);

  const setNextTimeframe = useCallback(() => {
    const nextTimeframe = getNextTimeframe();
    actions.setTimeframe(nextTimeframe);
  }, [getNextTimeframe, actions]);

  const setPreviousTimeframe = useCallback(() => {
    const prevTimeframe = getPreviousTimeframe();
    actions.setTimeframe(prevTimeframe);
  }, [getPreviousTimeframe, actions]);

  return {
    currentTimeframe: state.timeframe,
    availableTimeframes: timeframes,
    setTimeframe: actions.setTimeframe,
    setNextTimeframe,
    setPreviousTimeframe,
    getNextTimeframe,
    getPreviousTimeframe,
    getCurrentTimeframeIndex,
  };
};
