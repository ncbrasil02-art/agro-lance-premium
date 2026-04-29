  import { useEffect, useRef, useState } from 'react';
 import { logger } from '@/utils/logger';
  import { RATE_LIMITS } from '@/config/limits';
 
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
    pollInterval = RATE_LIMITS.POLLING_BASE_MS,
    initialPollInterval = RATE_LIMITS.POLLING_INITIAL_MS,
    maxInterval = RATE_LIMITS.POLLING_MAX_MS,
   backoffFactor = 1.2,
   enabled = true
 }: RealtimeFallbackOptions) {
   const onUpdateRef = useRef(onUpdate);
   const [retryCount, setRetryCount] = useState(0);
   const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
   const [currentDelay, setCurrentDelay] = useState<number>(0);
 
   // Calcula o atraso atual (tempo desde a última atualização)
   useEffect(() => {
     const interval = setInterval(() => {
       setCurrentDelay(Math.floor((Date.now() - lastUpdateTime) / 1000));
     }, 1000);
     return () => clearInterval(interval);
   }, [lastUpdateTime]);
 
   useEffect(() => {
     onUpdateRef.current = onUpdate;
   }, [onUpdate]);
 
   // Reset retry count when status changes or when it successfully connects
   useEffect(() => {
       if (status === 'SUBSCRIBED') {
         setRetryCount(0);
         setLastUpdateTime(Date.now());
       }
     }, [status]);
 
   useEffect(() => {
     if (!enabled || status === 'SUBSCRIBED') return;
 
     const isInitial = status === 'INITIAL' || status === 'JOINING';
     const baseInterval = isInitial ? initialPollInterval : pollInterval;
     
      // Exponential backoff with jitter (±10%)
      const jitter = 0.9 + Math.random() * 0.2;
      const intervalTime = Math.min(
        baseInterval * Math.pow(backoffFactor, retryCount) * jitter, 
        maxInterval 
      );
 
     logger.warn(`Realtime [${label}] status: ${status}. Polling fallback em ${Math.round(intervalTime/1000)}s (Tentativa: ${retryCount})`);
     
     const timeoutId = setTimeout(() => {
       logger.info(`Executando polling de fallback para ${label}...`);
       try {
         onUpdateRef.current();
         setRetryCount(prev => prev + 1);
         setLastUpdateTime(Date.now());
       } catch (err: any) {
         logger.error(`Erro no polling de fallback para ${label}:`, { error: err?.message || String(err) });
       }
     }, intervalTime);
 
     return () => clearTimeout(timeoutId);
   }, [status, label, pollInterval, initialPollInterval, enabled, retryCount]);
 
     const onManualUpdate = () => {
       setLastUpdateTime(Date.now());
     };
 
     return {
       delaySeconds: currentDelay,
       lastUpdate: lastUpdateTime,
       isPolling: status !== 'SUBSCRIBED',
       status,
       onManualUpdate
     };
 }