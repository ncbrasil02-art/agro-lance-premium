 import { useEffect, useRef } from 'react';
 import { logger } from '@/utils/logger';
 
 export interface RealtimeFallbackOptions {
   status: string;
   onUpdate: () => void;
   label: string;
   pollInterval?: number;
   initialPollInterval?: number;
   enabled?: boolean;
 }
 
 /**
  * Hook padronizado para fornecer fallback de polling quando o WebSocket do Supabase não está conectado.
  */
 export function useRealtimeFallback({
   status,
   onUpdate,
   label,
   pollInterval = 30000,
   initialPollInterval = 10000,
   enabled = true
 }: RealtimeFallbackOptions) {
   const onUpdateRef = useRef(onUpdate);
 
   useEffect(() => {
     onUpdateRef.current = onUpdate;
   }, [onUpdate]);
 
   useEffect(() => {
     if (!enabled || status === 'SUBSCRIBED') return;
 
     const intervalTime = status === 'INITIAL' ? initialPollInterval : pollInterval;
     logger.warn(`Realtime [${label}] não conectado (${status}), iniciando polling de fallback (${intervalTime}ms)`);
     
     const pollIntervalId = setInterval(() => {
       logger.info(`Executando polling de fallback para ${label}...`);
       onUpdateRef.current();
     }, intervalTime);
 
     return () => clearInterval(pollIntervalId);
   }, [status, label, pollInterval, initialPollInterval, enabled]);
 }