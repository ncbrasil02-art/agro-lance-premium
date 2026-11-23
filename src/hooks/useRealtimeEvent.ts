 import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
 import { useRealtimeFallback } from './useRealtimeFallback';

type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'JOINING' | 'INITIAL';

 export function useRealtimeEvent(eventId: string, onUpdate: () => void, onManualUpdate?: () => void) {
  const [status, setStatus] = useState<ChannelStatus>('INITIAL');
  const [retryCount, setRetryCount] = useState(0);
  const updateRef = useRef(onUpdate);
  const manualRef = useRef(onManualUpdate);
  useEffect(() => { updateRef.current = onUpdate; manualRef.current = onManualUpdate; }, [onUpdate, onManualUpdate]);
  const refresh = () => { updateRef.current(); manualRef.current?.(); };
  useCatalogReconciliation(refresh);

  useEffect(() => {
    if (!eventId) return;

    logger.info(`Configurando canal em tempo real para o evento: ${eventId} (Tentativa: ${retryCount})`);
    
    const uniqueId = `event-updates-${eventId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(uniqueId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lots',
          filter: `event_id=eq.${eventId}`,
        },
         (payload) => {
           logger.info('Mudança detectada nos lotes do evento', { eventId, payload });
           refresh();
         }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
         (payload) => {
           logger.info('Mudança detectada nos dados do evento', { eventId, payload });
           refresh();
         }
      )
      .subscribe((newStatus) => {
        logger.info(`Status do canal em tempo real (${eventId}): ${newStatus}`);
        
        // Se voltamos de um erro para inscrito, forçamos uma atualização para garantir que não perdemos nada
        if (status !== 'INITIAL' && status !== 'SUBSCRIBED' && newStatus === 'SUBSCRIBED') {
          logger.info('Conexão restabelecida, forçando atualização de dados');
          refresh();
        }
        
        setStatus(newStatus);
        
        if (newStatus === 'CHANNEL_ERROR' || newStatus === 'TIMED_OUT') {
          const timer = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 5000);
          return () => clearTimeout(timer);
        }
      });

    // Monitoramento de volta da internet
    const handleOnline = () => {
      logger.info('Internet detectada, forçando reconexão e atualização');
       refresh();
      setRetryCount(prev => prev + 1);
    };

    window.addEventListener('online', handleOnline);

    // Monitoramento de conexão global do Supabase
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        logger.info('Auth detectada, garantindo que o canal está ativo');
        setRetryCount(prev => prev + 1);
      }
    });

    return () => {
      logger.info(`Limpando canal em tempo real para o evento: ${eventId}`);
      supabase.removeChannel(channel);
      authSubscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
   }, [eventId, retryCount]);

    const fallback = useRealtimeFallback({
      status,
      onUpdate,
      label: `Evento ${eventId}`,
      pollInterval: 45000,
      initialPollInterval: 15000
    });
 
    return { ...fallback };
 }
 
   export function useHomeRealtime(onUpdate: () => void, onManualUpdate?: () => void) {
   const [status, setStatus] = useState<ChannelStatus>('INITIAL');
   const [retryCount, setRetryCount] = useState(0);
   const updateRef = useRef(onUpdate);
   const manualRef = useRef(onManualUpdate);
   useEffect(() => { updateRef.current = onUpdate; manualRef.current = onManualUpdate; }, [onUpdate, onManualUpdate]);
   const refresh = () => { updateRef.current(); manualRef.current?.(); };
   useCatalogReconciliation(refresh);
 
   useEffect(() => {
     const channelId = `home-updates-${Math.random().toString(36).substring(2, 9)}`;
     
     const channel = supabase
       .channel(channelId)
       .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
         logger.info("Evento alterado, atualizando via realtime...");
          refresh();
       })
       .on('postgres_changes', { event: '*', schema: 'public', table: 'lots' }, () => {
         logger.info("Lote alterado, atualizando via realtime...");
          refresh();
       })
       .subscribe((newStatus) => {
         setStatus(newStatus);
         if (newStatus === 'CHANNEL_ERROR' || newStatus === 'TIMED_OUT') {
           setTimeout(() => setRetryCount(prev => prev + 1), 5000);
         }
       });
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [retryCount]);
 
    const fallback = useRealtimeFallback({
      status,
      onUpdate,
      label: "Home/Geral",
      pollInterval: 30000,
      initialPollInterval: 10000
    });
 
    return { ...fallback };
 }
 export function useRealtimeLots(onUpdate: () => void) {
    return useHomeRealtime(onUpdate);
 }

// A joined socket does not guarantee table change delivery. Reconcile visible
// catalogs and refresh on return without tearing down channels on every render.
function useCatalogReconciliation(onUpdate: () => void) {
  const updateRef = useRef(onUpdate);
  useEffect(() => { updateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") updateRef.current(); };
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    window.addEventListener("catalog:bid-saved", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("catalog:bid-saved", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
}