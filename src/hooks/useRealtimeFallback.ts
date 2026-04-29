 import { useEffect, useRef, useState } from 'react';
 import { logger } from '@/utils/logger';
 
 export interface RealtimeFallbackOptions {
   status: string;
   onUpdate: () => void;
   label: string;
   pollInterval?: number;
   initialPollInterval?: number;
   maxInterval?: number;
   backoffFactor?: number;
   enabled?: boolean;
 }
 
 /**
  * Hook padronizado para fornecer fallback de polling com backoff exponencial 
  * quando o WebSocket do Supabase não está conectado.
  */
 export function useRealtimeFallback({
   status,
   onUpdate,
   label,
   pollInterval = 45000,
   initialPollInterval = 10000,
   maxInterval = 120000,
   backoffFactor = 1.2,
   enabled = true
 }: RealtimeFallbackOptions) {
   const onUpdateRef = useRef(onUpdate);
   const [retryCount, setRetryCount] = useState(0);
 
   useEffect(() => {
     onUpdateRef.current = onUpdate;
   }, [onUpdate]);
 
   // Reset retry count when status changes or when it successfully connects
   useEffect(() => {
     if (status === 'SUBSCRIBED') {
       setRetryCount(0);
     }
   }, [status]);
 
   useEffect(() => {
     if (!enabled || status === 'SUBSCRIBED') return;
 
     const isInitial = status === 'INITIAL' || status === 'JOINING';
     const baseInterval = isInitial ? initialPollInterval : pollInterval;
     
     // Exponential backoff
     const intervalTime = Math.min(
       baseInterval * Math.pow(backoffFactor, retryCount), 
       maxInterval 
     );
 
     logger.warn(`Realtime [${label}] status: ${status}. Polling fallback em ${Math.round(intervalTime/1000)}s (Tentativa: ${retryCount})`);
     
     const timeoutId = setTimeout(() => {
       logger.info(`Executando polling de fallback para ${label}...`);
       try {
         onUpdateRef.current();
         setRetryCount(prev => prev + 1);
       } catch (err: any) {
         logger.error(`Erro no polling de fallback para ${label}:`, { error: err?.message || String(err) });
       }
     }, intervalTime);
 
     return () => clearTimeout(timeoutId);
   }, [status, label, pollInterval, initialPollInterval, enabled, retryCount]);
 }