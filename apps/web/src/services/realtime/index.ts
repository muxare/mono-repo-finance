/**
 * Real-time Services Index
 * Main exports for real-time functionality
 */

export { SignalRClient } from './SignalRClient';
export { 
  RealTimeService, 
  getRealTimeService, 
  createRealTimeService, 
  resetRealTimeService 
} from './RealTimeService';
export type { 
  RealTimeEvents, 
  RealTimeEventNames 
} from './SignalRClient';
export type { 
  ConnectionStatus, 
  ConnectionConfig 
} from '../../types/ApiTypes';
