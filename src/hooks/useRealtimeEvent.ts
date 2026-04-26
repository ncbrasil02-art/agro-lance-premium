import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'JOINING' | 'INITIAL';

export function useRealtimeEvent(eventId: string, onUpdate: (type: 'lot' | 'event', payload: any) => void) {
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
          onUpdate('lot', payload);
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
          onUpdate('event', payload);
        }
      )
      .subscribe((newStatus) => {
        logger.info(`Status do canal em tempo real (${eventId}): ${newStatus}`);
        
        // Se voltamos de um erro para inscrito, forçamos uma atualização para garantir que não perdemos nada
        if (status !== 'INITIAL' && status !== 'SUBSCRIBED' && newStatus === 'SUBSCRIBED') {
          logger.info('Conexão restabelecida, forçando atualização de dados');
          onUpdate('event', null); // Refresh everything on reconnect
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
      onUpdate('event', null);
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

export function useRealtimeLots(onUpdate: (payload?: any) => void) {
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('all-lots-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lots' },
        (payload) => {
          const newId = payload.new && 'id' in payload.new ? payload.new.id : 'unknown';
          logger.info('Mudança detectada em lote (global)', { id: newId });
          onUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => setRetryCount(c => c + 1), 5000);
        }
      });

    const handleOnline = () => {
      onUpdate();
      setRetryCount(c => c + 1);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('online', handleOnline);
    };
  }, [onUpdate, retryCount]);
}

export function useLotRealtime(lotId: string, initialData: any) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!lotId) return;

    const channel = supabase
      .channel(`lot-detail-${lotId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lots',
          filter: `id=eq.${lotId}`,
        },
        (payload) => {
          logger.info(`Lote atualizado via realtime: ${lotId}`, payload.new);
          setData((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lotId]);

  return data;
}