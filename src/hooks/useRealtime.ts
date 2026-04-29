  import { useEffect, useState, useRef } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { logger } from '@/utils/logger';
 import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
  import { useRealtimeFallback } from './useRealtimeFallback';
 
 type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'JOINING' | 'INITIAL';
 
 interface UseRealtimeOptions {
   table: string;
   filter?: string;
   event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
   schema?: string;
   onPayload?: (payload: RealtimePostgresChangesPayload<any>) => void;
   onUpdate?: () => void;
   pollInterval?: number;
   enabled?: boolean;
 }
 
 export function useRealtime({
   table,
   filter,
   event = '*',
   schema = 'public',
   onPayload,
   onUpdate,
   pollInterval = 30000,
   enabled = true
 }: UseRealtimeOptions) {
   const [status, setStatus] = useState<ChannelStatus>('INITIAL');
   const [retryCount, setRetryCount] = useState(0);
   const onUpdateRef = useRef(onUpdate);
   const onPayloadRef = useRef(onPayload);
 
   useEffect(() => {
     onUpdateRef.current = onUpdate;
   }, [onUpdate]);
 
   useEffect(() => {
     onPayloadRef.current = onPayload;
   }, [onPayload]);
 
   useEffect(() => {
     if (!enabled) return;
 
     const channelName = `rt-${table}-${filter || 'all'}-${Math.random().toString(36).substring(2, 7)}`;
     
     const channel = supabase
       .channel(channelName)
       .on(
         'postgres_changes',
         {
           event,
           schema,
           table,
           filter,
         },
         (payload) => {
           logger.info(`Realtime update on ${table}`, { filter, eventType: payload.eventType });
           if (onPayloadRef.current) onPayloadRef.current(payload);
           if (onUpdateRef.current) onUpdateRef.current();
         }
       )
       .subscribe((newStatus) => {
         setStatus(newStatus);
         if (newStatus === 'CHANNEL_ERROR' || newStatus === 'TIMED_OUT') {
           logger.warn(`Realtime channel error for ${table}: ${newStatus}. Retry ${retryCount + 1}`);
           setTimeout(() => setRetryCount(prev => prev + 1), 5000);
         }
       });
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [table, filter, event, schema, retryCount, enabled]);
 
    useRealtimeFallback({
      status,
      onUpdate: () => onUpdateRef.current?.(),
      label: `Tabela ${table}`,
      pollInterval,
      initialPollInterval: pollInterval / 2,
      enabled
    });
 
   return { status };
 }