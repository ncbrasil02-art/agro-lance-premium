import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'JOINING' | 'INITIAL';

export function useRealtimeEvent(eventId: string, onUpdate: () => void) {
  const [status, setStatus] = useState<ChannelStatus>('INITIAL');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!eventId) return;

    logger.info(`Configurando canal em tempo real para o evento: ${eventId} (Tentativa: ${retryCount})`);
    
    const channel = supabase
      .channel(`event-updates-${eventId}`)
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
          onUpdate();
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
          onUpdate();
        }
      )
      .subscribe((newStatus) => {
        logger.info(`Status do canal em tempo real (${eventId}): ${newStatus}`);
        
        // Se voltamos de um erro para inscrito, forçamos uma atualização para garantir que não perdemos nada
        if (status !== 'INITIAL' && status !== 'SUBSCRIBED' && newStatus === 'SUBSCRIBED') {
          logger.info('Conexão restabelecida, forçando atualização de dados');
          onUpdate();
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
      onUpdate();
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
  }, [eventId, onUpdate, retryCount]);

  return { status };
}

 export function useHomeRealtime(onUpdate: () => void) {
   const [status, setStatus] = useState<ChannelStatus>('INITIAL');
   const [retryCount, setRetryCount] = useState(0);
 
   useEffect(() => {
     const channelId = `home-updates-${Math.random().toString(36).substring(2, 9)}`;
     
     const channel = supabase
       .channel(channelId)
       .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
         logger.info("Evento alterado, atualizando via realtime...");
         onUpdate();
       })
       .on('postgres_changes', { event: '*', schema: 'public', table: 'lots' }, () => {
         logger.info("Lote alterado, atualizando via realtime...");
         onUpdate();
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
   }, [onUpdate, retryCount]);
 
   // Fallback Polling if WebSocket is not connected
   useEffect(() => {
     if (status === 'SUBSCRIBED') return;
 
     const intervalTime = status === 'INITIAL' ? 10000 : 30000;
     logger.warn(`Realtime não conectado (${status}), iniciando polling de fallback (${intervalTime}ms)`);
     
     const pollInterval = setInterval(() => {
       logger.info("Executando polling de fallback para Home...");
       onUpdate();
     }, intervalTime);
 
     return () => clearInterval(pollInterval);
   }, [status, onUpdate]);
 
   return { status };
 }
 
 export function useRealtimeLots(onUpdate: () => void) {
   const { status } = useHomeRealtime(onUpdate);
   return { status };
 }